import { expect, test } from "@playwright/test";
import {
  acceptInvitation,
  createGroup,
  createTestUser,
  inviteMember,
  uniqueEmail,
} from "./helpers";

test("criação de grupo, convite e aceite", async ({ browser }) => {
  const admin = await createTestUser(
    browser,
    "Admin Grupo",
    uniqueEmail("admin-group"),
  );
  const member = await createTestUser(
    browser,
    "Membro Convite",
    uniqueEmail("member-group"),
  );

  try {
    const groupName = "Grupo E2E de Convites";
    const groupId = await createGroup(admin.page, groupName);

    await expect(
      admin.page.getByText("Administrador", { exact: true }).first(),
    ).toBeVisible();
    await inviteMember(admin.page, member.email);

    await acceptInvitation(member.page, groupName);

    await member.page.goto("/groups");
    await expect(member.page.getByText(groupName)).toBeVisible();

    await admin.page.goto(`/groups/${groupId}`);
    await expect(
      admin.page.getByText("Membro Convite", { exact: true }).first(),
    ).toBeVisible();
  } finally {
    await admin.context.close();
    await member.context.close();
  }
});
