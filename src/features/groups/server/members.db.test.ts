import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { groupMembers } from "@/db/schema";
import type { GroupDomainError } from "@/features/groups/server/errors";
import type { GroupAccessError } from "@/features/groups/server/group-access";
import { leaveGroup } from "@/features/groups/server/leave-group";
import { promoteGroupMember } from "@/features/groups/server/promote-member";
import { removeGroupMember } from "@/features/groups/server/remove-member";
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

async function getMembership(groupId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    );

  return membership;
}

async function setup() {
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

  return { aliceId, bobId, carolId, groupId };
}

describe("member management", () => {
  it("permite admin remover membro comum preservando a linha", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);

    await removeGroupMember(data.groupId, data.aliceId, data.bobId, db);
    const membership = await getMembership(data.groupId, data.bobId);

    expect(membership.status).toBe("ACCEPTED");
    expect(membership.leftAt).toBeInstanceOf(Date);
    expect(
      await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, data.groupId)),
    ).toHaveLength(2);
  });

  it("impede remoção de outro administrador", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId, "ADMIN");

    await expect(
      removeGroupMember(data.groupId, data.aliceId, data.bobId, db),
    ).rejects.toMatchObject<Partial<GroupDomainError>>({
      code: "CANNOT_REMOVE_ADMIN",
    });
  });

  it("impede que admin remova a si mesmo pela ação de remoção", async () => {
    const data = await setup();

    await expect(
      removeGroupMember(data.groupId, data.aliceId, data.aliceId, db),
    ).rejects.toMatchObject<Partial<GroupDomainError>>({
      code: "CANNOT_REMOVE_SELF",
    });
  });

  it("impede que membro comum remova alguém", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);
    await addAcceptedMember(db, data.groupId, data.carolId);

    await expect(
      removeGroupMember(data.groupId, data.bobId, data.carolId, db),
    ).rejects.toMatchObject<Partial<GroupAccessError>>({
      code: "GROUP_ADMIN_REQUIRED",
    });
  });

  it("permite que membro comum saia", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);

    await leaveGroup(data.groupId, data.bobId, db);
    const membership = await getMembership(data.groupId, data.bobId);

    expect(membership.leftAt).toBeInstanceOf(Date);
  });

  it("impede que o último admin saia", async () => {
    const data = await setup();

    await expect(
      leaveGroup(data.groupId, data.aliceId, db),
    ).rejects.toMatchObject<Partial<GroupDomainError>>({
      code: "LAST_ADMIN",
    });
  });

  it("permite promover membro e depois o admin sair", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);

    await promoteGroupMember(data.groupId, data.aliceId, data.bobId, db);
    const bobMembership = await getMembership(data.groupId, data.bobId);
    expect(bobMembership.role).toBe("ADMIN");

    await leaveGroup(data.groupId, data.aliceId, db);
    const aliceMembership = await getMembership(data.groupId, data.aliceId);

    expect(aliceMembership.leftAt).toBeInstanceOf(Date);
  });

  it("impede membro comum de promover alguém", async () => {
    const data = await setup();
    await addAcceptedMember(db, data.groupId, data.bobId);
    await addAcceptedMember(db, data.groupId, data.carolId);

    await expect(
      promoteGroupMember(data.groupId, data.bobId, data.carolId, db),
    ).rejects.toMatchObject<Partial<GroupAccessError>>({
      code: "GROUP_ADMIN_REQUIRED",
    });
  });

  it("impede promoção de quem não é membro ativo", async () => {
    const data = await setup();

    await expect(
      promoteGroupMember(data.groupId, data.aliceId, data.bobId, db),
    ).rejects.toMatchObject<Partial<GroupDomainError>>({
      code: "TARGET_NOT_MEMBER",
    });
  });
});
