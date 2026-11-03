import { expect, test } from "@playwright/test";
import {
  acceptInvitation,
  createExpense,
  createGroup,
  createTestUser,
  inviteMember,
  uniqueEmail,
} from "./helpers";

test("despesas, rateios, saldos e plano simplificado", async ({ browser }) => {
  const admin = await createTestUser(
    browser,
    "Ana Despesas",
    uniqueEmail("ana-expenses"),
  );
  const bruno = await createTestUser(
    browser,
    "Bruno Despesas",
    uniqueEmail("bruno-expenses"),
  );
  const carla = await createTestUser(
    browser,
    "Carla Despesas",
    uniqueEmail("carla-expenses"),
  );

  try {
    const groupName = "Grupo E2E de Despesas";
    const groupId = await createGroup(admin.page, groupName);

    await inviteMember(admin.page, bruno.email);
    await inviteMember(admin.page, carla.email);
    await acceptInvitation(bruno.page, groupName);
    await acceptInvitation(carla.page, groupName);

    await createExpense(admin.page, groupId, {
      description: "Jantar compartilhado",
      total: "300,00",
    });

    await expect(
      admin.page.getByRole("heading", { name: "Jantar compartilhado" }),
    ).toBeVisible();
    await expect(admin.page.getByText(/300,00/).first()).toBeVisible();
    await expect(admin.page.getByText(/100,00/).first()).toBeVisible();

    await admin.page.goto(`/groups/${groupId}/balances`);
    await expect(admin.page.getByText("Saldos individuais")).toBeVisible();
    await expect(admin.page.getByText(/\+R\$\s*200,00/)).toBeVisible();

    await createExpense(admin.page, groupId, {
      description: "Hotel compartilhado",
      total: "300,00",
      payer: { name: bruno.name, email: bruno.email },
    });

    await admin.page.goto(`/groups/${groupId}/balances`);
    await expect(
      admin.page.getByText("Plano sugerido de pagamentos"),
    ).toBeVisible();
    await expect(
      admin.page.getByText(/Total de 2 transferências/),
    ).toBeVisible();
    await expect(
      admin.page.getByText(/Nenhum pagamento foi confirmado/),
    ).toBeVisible();

    await admin.page.goto(`/groups/${groupId}/settlements`);
    await expect(
      admin.page.getByText("Nenhum pagamento encontrado"),
    ).toBeVisible();
  } finally {
    await admin.context.close();
    await bruno.context.close();
    await carla.context.close();
  }
});
