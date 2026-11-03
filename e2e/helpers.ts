import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from "@playwright/test";
import { getE2eBaseUrl } from "./test-database";

export const TEST_PASSWORD = "senha-segura-123";

export type TestUser = {
  name: string;
  email: string;
  context: BrowserContext;
  page: Page;
};

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}.${suffix}@example.com`;
}

export async function registerOnPage(
  page: Page,
  name: string,
  email: string,
): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirmar senha").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();
}

export async function loginOnPage(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sair", exact: true }).first().click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sair", exact: true }).click();
  await page.waitForURL("**/login");
}

export async function createTestUser(
  browser: Browser,
  name: string,
  email: string,
): Promise<TestUser> {
  const context = await browser.newContext({ baseURL: getE2eBaseUrl() });
  const page = await context.newPage();

  await registerOnPage(page, name, email);

  return { name, email, context, page };
}

export async function createGroup(page: Page, name: string): Promise<string> {
  await page.goto("/groups/new");
  await page.getByLabel("Nome do grupo").fill(name);
  await page.getByRole("button", { name: "Criar grupo" }).click();
  await page.waitForURL(/\/groups\/[0-9a-f-]{36}$/);

  const match = new URL(page.url()).pathname.match(
    /\/groups\/([0-9a-f-]{36})$/,
  );

  if (!match) {
    throw new Error("Não foi possível identificar o grupo criado.");
  }

  return match[1];
}

export async function inviteMember(page: Page, email: string): Promise<void> {
  await page.getByRole("button", { name: "Convidar" }).click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  await dialog.getByLabel("E-mail").fill(email);
  await dialog.getByRole("button", { name: "Adicionar" }).click();
  await dialog.getByRole("button", { name: "Criar convites" }).click();
  await expect(dialog.getByText("Criado", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

export async function acceptInvitation(
  page: Page,
  groupName: string,
): Promise<void> {
  await page.goto("/invitations");
  await expect(page.getByRole("heading", { name: groupName })).toBeVisible();
  await page.getByRole("button", { name: "Aceitar" }).first().click();
  await expect(page.getByText("Aceito", { exact: true })).toBeVisible();
}

export async function createExpense(
  page: Page,
  groupId: string,
  options: {
    description: string;
    total: string;
    payer?: { name: string; email: string };
  },
): Promise<void> {
  await page.goto(`/groups/${groupId}/expenses/new`);
  await page.getByLabel("Descrição").fill(options.description);
  await page.getByLabel("Valor total").fill(options.total);

  if (options.payer) {
    await page.getByLabel("Pago por").selectOption({
      label: `${options.payer.name} (${options.payer.email})`,
    });
  }

  await page.getByRole("button", { name: "Salvar despesa" }).click();
  await page.waitForURL(
    new RegExp(`/groups/${groupId}/expenses/[0-9a-f-]{36}$`),
  );
}
