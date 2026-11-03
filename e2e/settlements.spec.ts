import { expect, test } from "@playwright/test";
import {
  acceptInvitation,
  createExpense,
  createGroup,
  createTestUser,
  inviteMember,
  uniqueEmail,
} from "./helpers";

test("registro, confirmação, histórico e extrato", async ({ browser }) => {
  const receiver = await createTestUser(
    browser,
    "Ana Recebedora",
    uniqueEmail("ana-settlement"),
  );
  const payer = await createTestUser(
    browser,
    "Bruno Pagador",
    uniqueEmail("bruno-settlement"),
  );

  try {
    const groupName = "Grupo E2E de Quitação";
    const groupId = await createGroup(receiver.page, groupName);

    await inviteMember(receiver.page, payer.email);
    await acceptInvitation(payer.page, groupName);

    await createExpense(receiver.page, groupId, {
      description: "Aluguel compartilhado",
      total: "100,00",
    });

    await payer.page.goto(`/groups/${groupId}/settlements/new`);
    await payer.page.getByLabel("Quem recebeu").selectOption({ index: 0 });
    await payer.page.getByLabel("Valor do pagamento").fill("50,00");
    await payer.page
      .getByRole("button", { name: "Registrar pagamento" })
      .click();
    await payer.page.waitForURL(/\/settlements\/[0-9a-f-]{36}$/);

    const settlementPath = new URL(payer.page.url()).pathname;

    await expect(payer.page.getByText("Pendente").first()).toBeVisible();
    await expect(
      payer.page.getByText(/ainda não foi confirmado/),
    ).toBeVisible();

    await receiver.page.goto(`/groups/${groupId}/settlements/pending`);
    await expect(receiver.page.getByText("Pagamento recebido")).toBeVisible();
    await receiver.page
      .getByRole("button", { name: "Confirmar recebimento" })
      .click();
    await receiver.page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirmar recebimento" })
      .click();
    await expect(
      receiver.page.getByText("Nenhum pagamento pendente"),
    ).toBeVisible({ timeout: 15_000 });

    await receiver.page.goto(settlementPath);
    await expect(receiver.page.getByText("Pagamento confirmado")).toBeVisible();

    await receiver.page.goto(`/groups/${groupId}/dashboard`);
    await expect(
      receiver.page.getByText("Totalmente equilibrado", { exact: true }),
    ).toBeVisible();

    await receiver.page.goto(`/groups/${groupId}/settlements`);
    await expect(receiver.page.getByText("Confirmado").first()).toBeVisible();

    await payer.page.goto(`/groups/${groupId}/statement`);
    await expect(
      payer.page.getByRole("heading", { name: "Pagamentos enviados" }),
    ).toBeVisible();
    await expect(payer.page.getByText("Enviado confirmado")).toBeVisible();

    await receiver.page.goto(`/groups/${groupId}/statement`);
    await expect(
      receiver.page.getByRole("heading", { name: "Pagamentos recebidos" }),
    ).toBeVisible();
    await expect(receiver.page.getByText("Recebido confirmado")).toBeVisible();
  } finally {
    await receiver.context.close();
    await payer.context.close();
  }
});
