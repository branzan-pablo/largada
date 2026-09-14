import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Configure E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD");
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("home redirects to the race calendar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/corridas$/);
});

test("anonymous runner can search and filter races", async ({ page }) => {
  await page.goto("/corridas");
  await expect(page.getByRole("heading", { name: "Calendário de Corridas" })).toBeVisible();
  const search = page.getByPlaceholder(/buscar por nome, cidade/i);
  await expect(search).toBeVisible();
  await search.fill("Rio Preto");
  await expect(search).toHaveValue("Rio Preto");
});

test("anonymous runner can consult a race and its registration link", async ({ page }) => {
  test.skip(!process.env.E2E_RACE_SLUG, "Configure E2E_RACE_SLUG");
  await page.goto(`/corrida/${process.env.E2E_RACE_SLUG}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /inscreva-se/i })).toHaveAttribute("href", /\/api\/r\//);
});

test("anonymous access to admin redirects to the dedicated login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Acesso administrativo" })).toBeVisible();
});

test("admin can access race management and the creation form", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await page.getByRole("link", { name: /nova corrida/i }).click();
  await expect(page.getByRole("heading", { name: "Nova Corrida" })).toBeVisible();
  await expect(page.getByText(/preencher com ia/i)).toBeVisible();
});

test("removed runner and monetization routes return not found", async ({ page }) => {
  for (const path of ["/perfil", "/sugerir", "/radar-de-podio", "/para-organizadores"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});
