import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { groupMembers, groups } from "@/db/schema";
import { createGroup } from "@/features/groups/server/create-group";
import type { GroupAccessError } from "@/features/groups/server/group-access";
import {
  getGroupDetailForUser,
  listGroupsForUser,
} from "@/features/groups/server/queries";
import { updateGroup } from "@/features/groups/server/update-group";
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

describe("group lifecycle", () => {
  it("cria grupo e adiciona o criador como admin aceito", async () => {
    const userId = await createTestUser(db, {
      name: "Alice",
      email: "alice@example.com",
    });

    const group = await createGroup(
      { name: "Viagem", description: "Praia" },
      userId,
      db,
    );

    const [storedGroup] = await db
      .select({ createdBy: groups.createdBy, name: groups.name })
      .from(groups)
      .where(eq(groups.id, group.id));

    const [membership] = await db
      .select({
        role: groupMembers.role,
        status: groupMembers.status,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, group.id));

    expect(storedGroup).toEqual({ createdBy: userId, name: "Viagem" });
    expect(membership.role).toBe("ADMIN");
    expect(membership.status).toBe("ACCEPTED");
    expect(membership.joinedAt).toBeInstanceOf(Date);
  });

  it("lista somente grupos com participação ativa", async () => {
    const alice = await createTestUser(db, {
      name: "Alice",
      email: "alice@example.com",
    });
    const bob = await createTestUser(db, {
      name: "Bob",
      email: "bob@example.com",
    });
    const aliceGroup = await createGroupWithAdmin(db, alice, "Grupo da Alice");
    await createGroupWithAdmin(db, bob, "Grupo do Bob");

    const aliceGroups = await listGroupsForUser(alice, db);
    const bobGroups = await listGroupsForUser(bob, db);

    expect(aliceGroups.map((group) => group.id)).toEqual([aliceGroup]);
    expect(bobGroups).toHaveLength(1);
    expect(bobGroups[0].name).toBe("Grupo do Bob");
  });

  it("impede acesso a detalhes de grupo de terceiros", async () => {
    const alice = await createTestUser(db, {
      name: "Alice",
      email: "alice@example.com",
    });
    const bob = await createTestUser(db, {
      name: "Bob",
      email: "bob@example.com",
    });
    const groupId = await createGroupWithAdmin(db, alice);

    expect(await getGroupDetailForUser(groupId, bob, db)).toBeNull();

    const detail = await getGroupDetailForUser(groupId, alice, db);
    expect(detail?.currentUserRole).toBe("ADMIN");
    expect(detail?.members).toHaveLength(1);
  });

  it("permite que admin atualize o grupo", async () => {
    const alice = await createTestUser(db, {
      name: "Alice",
      email: "alice@example.com",
    });
    const groupId = await createGroupWithAdmin(db, alice, "Antigo");

    await updateGroup(
      groupId,
      alice,
      { name: "Novo nome", description: "Nova descrição" },
      db,
    );

    const [group] = await db
      .select({ name: groups.name, description: groups.description })
      .from(groups)
      .where(eq(groups.id, groupId));

    expect(group).toEqual({
      name: "Novo nome",
      description: "Nova descrição",
    });
  });

  it("impede que membro comum edite o grupo", async () => {
    const alice = await createTestUser(db, {
      name: "Alice",
      email: "alice@example.com",
    });
    const bob = await createTestUser(db, {
      name: "Bob",
      email: "bob@example.com",
    });
    const groupId = await createGroupWithAdmin(db, alice);
    await addAcceptedMember(db, groupId, bob);

    await expect(
      updateGroup(groupId, bob, { name: "Tentativa", description: null }, db),
    ).rejects.toMatchObject<Partial<GroupAccessError>>({
      code: "GROUP_ADMIN_REQUIRED",
    });
  });
});
