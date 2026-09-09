// Testes de "fumaça": não dependem de rede/Firebase, só verificam que a
// interface (HTML/CSS/JS) está correta — carregam o index.html localmente,
// com o SDK do Firebase trocado por um stub (veja tests/helpers/mock-firebase.js).
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./helpers/mock-firebase');

test.beforeEach(async ({ page }) => {
  await mockFirebase(page);
});

test.describe('Tela inicial', () => {
  test('carrega e mostra a escolha de tipo de acesso', async ({ page }) => {
    await page.goto('index.html');
    await expect(page).toHaveTitle(/SchedulEsty/i);
    await expect(page.getByText('Como você quer entrar?')).toBeVisible();
    await expect(page.getByRole('link', { name: /sou cliente/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sou profissional/i })).toBeVisible();
  });

  test('não mostra tela de erro/branco (div#app existe e não está vazia)', async ({ page }) => {
    await page.goto('index.html');
    const app = page.locator('#app');
    await expect(app).not.toBeEmpty();
  });
});

test.describe('Navegação para login', () => {
  test('"Sou cliente" leva ao formulário de login de cliente', async ({ page }) => {
    await page.goto('index.html');
    await page.getByRole('link', { name: /sou cliente/i }).click();
    await expect(page).toHaveURL(/#\/entrar-cliente/);
    await expect(page.getByRole('heading', { name: /entrar como cliente/i })).toBeVisible();

    const form = page.locator('form[data-form="login"]');
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="senha"]')).toBeVisible();
    await expect(form.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('"Sou profissional" leva ao formulário de login de profissional', async ({ page }) => {
    await page.goto('index.html');
    await page.getByRole('link', { name: /sou profissional/i }).click();
    await expect(page).toHaveURL(/#\/entrar-admin/);
    await expect(page.getByRole('heading', { name: /entrar como profissional/i })).toBeVisible();
  });

  test('link "Voltar" retorna para a tela inicial', async ({ page }) => {
    await page.goto('index.html#/entrar-cliente');
    await page.getByRole('link', { name: /voltar/i }).click();
    await expect(page.getByText('Como você quer entrar?')).toBeVisible();
  });
});

test.describe('Navegação para cadastro', () => {
  test('cadastro de cliente mostra os campos esperados', async ({ page }) => {
    await page.goto('index.html');
    await page.getByRole('link', { name: /cadastre-se como cliente/i }).click();
    await expect(page).toHaveURL(/#\/cadastro\/cliente/);

    const form = page.locator('form[data-form="cadastro"]');
    await expect(form.locator('input[name="nome"]')).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="telefone"]')).toBeVisible();
    await expect(form.locator('input[name="senha"]')).toBeVisible();
    await expect(form.locator('input[name="confirmarSenha"]')).toBeVisible();
  });

  test('cadastro de profissional mostra o campo de especialidade', async ({ page }) => {
    await page.goto('index.html');
    await page.getByRole('link', { name: /como profissional/i }).click();
    await expect(page).toHaveURL(/#\/cadastro\/admin/);

    const form = page.locator('form[data-form="cadastro"]');
    await expect(form.locator('input[name="especialidade"]')).toBeVisible();
  });
});

test.describe('Validação de formulário (HTML5, sem rede)', () => {
  test('login não envia com campos vazios (required)', async ({ page }) => {
    await page.goto('index.html#/entrar-cliente');
    const emailInput = page.locator('form[data-form="login"] input[name="email"]');
    await page.locator('form[data-form="login"] button[type="submit"]').click();
    // O navegador bloqueia o submit e marca o campo obrigatório como inválido
    const isValid = await emailInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('cadastro exige senha com no mínimo 6 caracteres', async ({ page }) => {
    await page.goto('index.html#/cadastro/cliente');
    const senhaInput = page.locator('form[data-form="cadastro"] input[name="senha"]');
    await senhaInput.fill('123');
    const isValid = await senhaInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBe(false);
  });
});
