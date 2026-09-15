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

test("home renders the race calendar at the canonical URL", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /calendário de corridas/i })).toBeVisible();
});

test("legacy race calendar URL redirects to home", async ({ page }) => {
  await page.goto("/corridas");
  await expect(page).toHaveURL(/\/$/);
});

test("anonymous runner can search and filter races", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /calendário de corridas/i })).toBeVisible();
  const search = page.locator('input[type="search"]:visible');
  await expect(search).toBeVisible();
  await search.fill("Rio Preto");
  await expect(search).toHaveValue("Rio Preto");
});

test("desktop runner can combine and remove precise filters", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: /distância todas/i }).click();
  await page.getByRole("button", { name: "5K", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Remover filtro 5K" })).toBeVisible();

  await page.getByRole("button", { name: /premiação qualquer/i }).click();
  await page.getByRole("button", { name: "Com troféu", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Remover filtro Com troféu" })).toBeVisible();

  await page.getByRole("button", { name: "Remover filtro 5K" }).click();
  await expect(page.getByRole("button", { name: "Remover filtro 5K" })).not.toBeVisible();
});

test("city combobox supports keyboard selection", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/api/cities/search**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: "1", name: "Araçatuba", state_code: "SP", slug: "aracatuba", latitude: -21.2, longitude: -50.4 }]),
  }));
  await page.goto("/");
  await page.getByRole("button", { name: /cidade todas/i }).click();
  const city = page.getByRole("combobox", { name: "Buscar cidade" });
  await city.fill("Ara");
  await expect(page.getByRole("option", { name: /Araçatuba/ })).toBeVisible();
  await city.press("ArrowDown");
  await city.press("Enter");
  await expect(page.getByRole("button", { name: "Remover filtro Araçatuba" })).toBeVisible();
});

test("mobile runner confirms or discards filter drafts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("button", { name: "10K", exact: true }).click();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByRole("button", { name: "Remover filtro 10K" })).not.toBeVisible();

  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("button", { name: "10K", exact: true }).click();
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByRole("button", { name: "Remover filtro 10K" })).toBeVisible();
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
