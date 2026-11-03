import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { groupInvitations, groupMembers } from "@/db/schema";
import { cancelInvitation } from "@/features/groups/server/cancel-invitation";
import type { GroupAccessError } from "@/features/groups/server/group-access";
import type { InvitationNotification } from "@/features/groups/server/invitation-notifier";
import {
  hashInvitationToken,
  INVITATION_TTL_MS,
} from "@/features/groups/server/invitation-token";
import {
  type InviteMembersInput,
  inviteMembers,
} from "@/features/groups/server/invite-members";
import { respondToInvitation } from "@/features/groups/server/respond-invitation";
import type { InviteDelivery } from "@/features/groups/types";
import {
  addAcceptedMember,
  createGroupWithAdmin,
  createTestDatabase,
  createTestUser,
  resetTestDatabase,
} from "@/test-utils/fixtures";

const { client, db } = createTestDatabase();

beforeAll(async () => {
  await client.connect();
});

beforeEach(async () => {
  await resetTestDatabase(client);
});

afterAll(async () => {
  await client.end();
});

type Setup = {
  groupId: string;
  aliceId: string;
  aliceEmail: string;
  bobId: string;
  bobEmail: string;
  carolId: string;
  carolEmail: string;
};

async function setup(): Promise<Setup> {
  const aliceId = await createTestUser(db, {
    name: "Alice",
    email: "alice@example.com",
  });
  const bobId = await createTestUser(db, {
    name: "Bob",
    email: "bob@example.com",
  });
  const carolId = await createTestUser(db, {
    name: "Carol",
    email: "carol@example.com",
  });
  const groupId = await createGroupWithAdmin(db, aliceId);

  return {
    groupId,
    aliceId,
    aliceEmail: "alice@example.com",
    bobId,
    bobEmail: "bob@example.com",
    carolId,
    carolEmail: "carol@example.com",
  };
}

function createNotifier() {
  const notifications: InvitationNotification[] = [];
  const notifier = {
    async sendInvitation(input: InvitationNotification) {
      notifications.push(input);
      return "not-configured" as InviteDelivery;
    },
  };

  return { notifications, notifier };
}

function inviteInput(
  data: Setup,
  emails: string[],
  actorId = data.aliceId,
  actorEmail = data.aliceEmail,
): InviteMembersInput {
  return {
    groupId: data.groupId,
    actorId,
    actorEmail,
    emails,
  };
}

describe("invite members", () => {
  it("cria convite, armazena apenas o hash e usa validade de 7 dias", async () => {
    const data = await setup();
    const { notifications, notifier } = createNotifier();

    const results = await inviteMembers(
      inviteInput(data, [data.bobEmail]),
      db,
      notifier,
    );
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    expect(results).toEqual([
      expect.objectContaining({ email: data.bobEmail, status: "created" }),
    ]);
    expect(invitation.status).toBe("PENDING");
    expect(invitation.tokenHash).toHaveLength(64);
    expect(invitation.tokenHash).not.toBe(notifications[0].token);
    expect(invitation.tokenHash).toBe(
      hashInvitationToken(notifications[0].token),
    );
    expect(invitation.expiresAt.getTime()).toBeGreaterThan(
      Date.now() + INVITATION_TTL_MS - 60_000,
    );
  });

  it("processa vários e-mails e remove duplicados", async () => {
    const data = await setup();

    const results = await inviteMembers(
      inviteInput(data, [data.bobEmail, data.carolEmail, data.bobEmail]),
      db,
    );

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.status === "created")).toBe(true);
    expect(
      await db
        .select()
        .from(groupInvitations)
        .where(eq(groupInvitations.groupId, data.groupId)),
    ).toHaveLength(2);
  });

  it("rejeita e-mail sem usuário cadastrado", async () => {
    const data = await setup();

    const results = await inviteMembers(
      inviteInput(data, ["naoexiste@example.com"]),
      db,
    );
    const invitations = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    expect(results[0]).toMatchObject({
      status: "not-registered",
      message: "Usuário não existe no sistema.",
    });
    expect(invitations).toHaveLength(0);
  });

  it("impede auto-convite", async () => {
    const data = await setup();

    const results = await inviteMembers(
      inviteInput(data, [data.aliceEmail]),
      db,
    );

    expect(results[0].status).toBe("self");
  });

  it("impede convite para integrante ativo", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);

    const results = await inviteMembers(inviteInput(data, [data.bobEmail]), db);

    expect(results[0].status).toBe("already-member");
  });

  it("impede convite pendente duplicado", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);

    const results = await inviteMembers(inviteInput(data, [data.bobEmail]), db);

    expect(results[0].status).toBe("pending");
  });

  it("permite novo convite após recusa", async () => {
    const data = await setup();
    const [first] = await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const invitation = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    await respondToInvitation(
      {
        invitationId: invitation[0].id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "decline",
      },
      db,
    );

    const results = await inviteMembers(inviteInput(data, [data.bobEmail]), db);

    expect(first.status).toBe("created");
    expect(results[0].status).toBe("created");
  });

  it("renova convite vencido", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    const past = new Date(Date.now() - 60 * 60 * 1000);
    await db
      .update(groupInvitations)
      .set({
        createdAt: new Date(past.getTime() - 60 * 60 * 1000),
        expiresAt: past,
      })
      .where(eq(groupInvitations.id, invitation.id));

    const results = await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [expired] = await db
      .select({ status: groupInvitations.status })
      .from(groupInvitations)
      .where(eq(groupInvitations.id, invitation.id));

    expect(results[0].status).toBe("created");
    expect(expired.status).toBe("EXPIRED");
  });

  it("impede convite por membro comum", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);

    await expect(
      inviteMembers(
        inviteInput(data, [data.carolEmail], data.bobId, data.bobEmail),
        db,
      ),
    ).rejects.toMatchObject<Partial<GroupAccessError>>({
      code: "GROUP_ADMIN_REQUIRED",
    });
  });
});

describe("respond to invitation", () => {
  it("aceita convite e cria membership", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    const result = await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "accept",
      },
      db,
    );

    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, data.groupId),
          eq(groupMembers.userId, data.bobId),
        ),
      );
    const [stored] = await db
      .select({ status: groupInvitations.status })
      .from(groupInvitations)
      .where(eq(groupInvitations.id, invitation.id));

    expect(result).toEqual({
      ok: true,
      decision: "ACCEPTED",
      groupId: data.groupId,
    });
    expect(membership.status).toBe("ACCEPTED");
    expect(membership.role).toBe("MEMBER");
    expect(membership.leftAt).toBeNull();
    expect(stored.status).toBe("ACCEPTED");
  });

  it("recusa convite sem criar membership", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    const result = await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "decline",
      },
      db,
    );
    const memberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, data.bobId));

    expect(result.ok).toBe(true);
    expect(memberships).toHaveLength(0);
  });

  it("impede aceite por e-mail diferente", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    const result = await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.carolId,
        userEmail: data.carolEmail,
        decision: "accept",
      },
      db,
    );

    expect(result).toEqual({ ok: false, code: "EMAIL_MISMATCH" });
  });

  it("impede reutilização de convite", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "accept",
      },
      db,
    );
    const result = await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "accept",
      },
      db,
    );

    expect(result).toEqual({ ok: false, code: "NOT_PENDING" });
  });

  it("impede aceite de convite expirado", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    const past = new Date(Date.now() - 60 * 60 * 1000);
    await db
      .update(groupInvitations)
      .set({
        createdAt: new Date(past.getTime() - 60 * 60 * 1000),
        expiresAt: past,
      })
      .where(eq(groupInvitations.id, invitation.id));

    const result = await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "accept",
      },
      db,
    );
    const [stored] = await db
      .select({ status: groupInvitations.status })
      .from(groupInvitations)
      .where(eq(groupInvitations.id, invitation.id));

    expect(result).toEqual({ ok: false, code: "EXPIRED" });
    expect(stored.status).toBe("EXPIRED");
  });

  it("reativa ex-integrante como membro comum", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);
    await db
      .update(groupMembers)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, data.groupId),
          eq(groupMembers.userId, data.bobId),
        ),
      );
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "accept",
      },
      db,
    );

    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, data.groupId),
          eq(groupMembers.userId, data.bobId),
        ),
      );

    expect(membership.status).toBe("ACCEPTED");
    expect(membership.role).toBe("MEMBER");
    expect(membership.leftAt).toBeNull();
  });
});

describe("cancel invitation", () => {
  it("permite cancelamento por admin", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    const result = await cancelInvitation(
      data.groupId,
      invitation.id,
      data.aliceId,
      db,
    );

    const [stored] = await db
      .select({ status: groupInvitations.status })
      .from(groupInvitations)
      .where(eq(groupInvitations.id, invitation.id));

    expect(result).toEqual({ ok: true });
    expect(stored.status).toBe("CANCELLED");
  });

  it("impede cancelamento por membro comum", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);
    await inviteMembers(inviteInput(data, [data.carolEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    await expect(
      cancelInvitation(data.groupId, invitation.id, data.bobId, db),
    ).rejects.toMatchObject<Partial<GroupAccessError>>({
      code: "GROUP_ADMIN_REQUIRED",
    });
  });

  it("não cancela convite já respondido", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    await respondToInvitation(
      {
        invitationId: invitation.id,
        userId: data.bobId,
        userEmail: data.bobEmail,
        decision: "decline",
      },
      db,
    );

    const result = await cancelInvitation(
      data.groupId,
      invitation.id,
      data.aliceId,
      db,
    );

    expect(result).toEqual({ ok: false, code: "NOT_PENDING" });
  });

  it("não cancela convite de outro grupo", async () => {
    const data = await setup();
    await inviteMembers(inviteInput(data, [data.bobEmail]), db);
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.groupId, data.groupId));

    await expect(
      cancelInvitation(
        "00000000-0000-4000-8000-000000000000",
        invitation.id,
        data.aliceId,
        db,
      ),
    ).rejects.toMatchObject<Partial<GroupAccessError>>({
      code: "GROUP_MEMBER_REQUIRED",
    });
  });
});
