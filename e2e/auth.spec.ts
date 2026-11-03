import { expect, test } from "@playwright/test";
import { loginOnPage, logout, registerOnPage, uniqueEmail } from "./helpers";

test("cadastro, login, logout e proteção de rotas", async ({ page }) => {
  const email = uniqueEmail("auth");

  await registerOnPage(page, "Usuária Auth", email);
  await logout(page);

  await loginOnPage(page, email);
  await logout(page);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
