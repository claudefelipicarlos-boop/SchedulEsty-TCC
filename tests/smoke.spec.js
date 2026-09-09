// Testes de "fumaça": não dependem de rede/Firebase, só verificam que a
// interface (HTML/CSS/JS) está correta — carregam o index.html localmente,
// com o SDK do Firebase trocado por um stub (veja tests/helpers/mock-firebase.js).
//
// Esta versão do app não usa mais roteamento por hash (#/entrar-cliente):
// as telas de autenticação são <div class="auth-screen"> alternadas via
// showAuth('screen-x'), e a navegação interna do app usa navTo('id').
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./helpers/mock-firebase');

test.beforeEach(async ({ page }) => {
  await mockFirebase(page);
});

test.describe('Tela inicial', () => {
  test('carrega e mostra a tela de login', async ({ page }) => {
    await page.goto('index.html');
    await expect(page).toHaveTitle(/SchedulEsty/i);
    await expect(page.locator('#screen-login')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-senha')).toBeVisible();
    await expect(page.locator('#btn-login')).toBeVisible();
  });

  test('não mostra tela em branco (auth-wrap existe e está visível)', async ({ page }) => {
    await page.goto('index.html');
    const authWrap = page.locator('#auth-wrap');
    await expect(authWrap).toBeVisible();
    await expect(page.locator('#app-shell')).toBeHidden();
  });
});

test.describe('Navegação entre telas de autenticação', () => {
  test('"Cadastre-se" leva ao formulário de criar conta', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#screen-login .auth-link', { hasText: 'Cadastre-se' }).click();
    await expect(page.locator('#screen-register')).toBeVisible();
    await expect(page.locator('#screen-login')).toBeHidden();
    await expect(page.locator('#cad-nome')).toBeVisible();
    await expect(page.locator('#cad-email')).toBeVisible();
    await expect(page.locator('#cad-telefone')).toBeVisible();
    await expect(page.locator('#cad-senha')).toBeVisible();
    await expect(page.locator('#cad-confirmar')).toBeVisible();
  });

  test('"Esqueceu a senha?" leva à tela de recuperação', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#screen-login .auth-link', { hasText: 'Esqueceu a senha?' }).click();
    await expect(page.locator('#screen-recover')).toBeVisible();
    await expect(page.locator('#recover-email')).toBeVisible();
  });

  test('"Entrar" no cadastro volta para o login', async ({ page }) => {
    await page.goto('index.html#');
    await page.evaluate(() => window.showAuth('screen-register'));
    await page.locator('#screen-register .auth-link', { hasText: 'Entrar' }).click();
    await expect(page.locator('#screen-login')).toBeVisible();
  });
});

test.describe('Fluxo de cadastro (escolha de perfil)', () => {
  test('preencher o cadastro e avançar mostra a escolha admin/cliente', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#screen-login .auth-link', { hasText: 'Cadastre-se' }).click();
    await page.locator('#cad-nome').fill('Maria');
    await page.locator('#cad-sobrenome').fill('Silva');
    await page.locator('#cad-email').fill('maria@teste.com');
    await page.locator('#cad-senha').fill('123456');
    await page.locator('#cad-confirmar').fill('123456');
    await page.locator('#btn-cadastro').click();
    await expect(page.locator('#screen-profile')).toBeVisible();
    await expect(page.getByText('Você quer se cadastrar como...')).toBeVisible();
  });

  test('senha curta é rejeitada com mensagem de erro (sem chamar a rede)', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#screen-login .auth-link', { hasText: 'Cadastre-se' }).click();
    await page.locator('#cad-nome').fill('Maria');
    await page.locator('#cad-email').fill('maria@teste.com');
    await page.locator('#cad-senha').fill('123');
    await page.locator('#cad-confirmar').fill('123');
    await page.locator('#btn-cadastro').click();
    await expect(page.locator('#cad-erro')).toContainText(/pelo menos 6 caracteres/i);
    // não deve ter avançado de tela
    await expect(page.locator('#screen-register')).toBeVisible();
  });

  test('senhas diferentes são rejeitadas com mensagem de erro', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#screen-login .auth-link', { hasText: 'Cadastre-se' }).click();
    await page.locator('#cad-nome').fill('Maria');
    await page.locator('#cad-email').fill('maria@teste.com');
    await page.locator('#cad-senha').fill('123456');
    await page.locator('#cad-confirmar').fill('654321');
    await page.locator('#btn-cadastro').click();
    await expect(page.locator('#cad-erro')).toContainText(/não coincidem/i);
  });
});

test.describe('Validação de login (sem rede)', () => {
  test('login não avança com campos vazios', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#btn-login').click();
    await expect(page.locator('#login-erro')).toContainText(/preencha e-mail e senha/i);
    await expect(page.locator('#screen-login')).toBeVisible();
  });
});
