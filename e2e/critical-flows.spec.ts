import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
  await page.goto("/corridas?login=true");
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByLabel("E-mail")).toBeHidden();
}

test("login modal is reachable from the protected-flow redirect", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/corridas\?login=true/);
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("race listing renders", async ({ page }) => {
  await page.goto("/corridas");
  await expect(page.getByRole("heading", { name: "Calendário de Corridas" })).toBeVisible();
  await expect(page.getByPlaceholder(/Buscar por nome, cidade/)).toBeVisible();
});

test("authenticated user can toggle RSVP", async ({ page }) => {
  test.skip(!process.env.E2E_RACE_SLUG, "Set E2E_RACE_SLUG to a disposable staging race");
  await login(page);
  await page.goto(`/corrida/${process.env.E2E_RACE_SLUG}`);
  const button = page.getByRole("button", { name: /Vou nessa|Confirmado!/ }).first();
  await expect(button).toBeVisible();
  const initial = await button.textContent();
  await button.click();
  await expect(button).not.toHaveText(initial ?? "");
  await button.click();
});

test("checkout requires authentication", async ({ page }) => {
  await page.goto("/para-organizadores");
  await page.getByRole("button", { name: /Destacar minha corrida|Comprar pacote/ }).first().click();
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("webhook rejects an invalid signature", async ({ request }) => {
  const response = await request.post("/api/payments/webhook?webhookSecret=invalid", {
    data: { id: "e2e-invalid", event: "billing.paid", data: {}, devMode: true },
    headers: { "x-webhook-signature": "invalid" },
  });
  expect(response.status()).toBe(401);
});
