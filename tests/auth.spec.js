// Testes "de rede": entram de verdade no Firebase (Authentication + Firestore).
// Precisam de uma conta de teste já existente no projeto Firebase.
//
// Como configurar:
//   - Local: crie um arquivo ".env" (não é versionado) com:
//       TEST_CLIENTE_EMAIL=email-de-um-cliente-de-teste@exemplo.com
//       TEST_CLIENTE_SENHA=senha-desse-cliente
//     e rode os testes com: npx dotenv -e .env -- npx playwright test
//   - GitHub Actions: cadastre os mesmos dois valores em
//     Settings > Secrets and variables > Actions como TEST_CLIENTE_EMAIL e
//     TEST_CLIENTE_SENHA (veja o workflow em .github/workflows/tests.yml).
//
// Se as variáveis não estiverem definidas, estes testes são pulados
// automaticamente (não quebram o restante da suíte).
//
// Esta versão do app não usa mais roteamento por hash: o login acontece na
// tela #screen-login (campos #login-email / #login-senha / #btn-login) e,
// depois de autenticado, o app troca #auth-wrap por #app-shell.
const { test, expect } = require('@playwright/test');

const EMAIL = process.env.TEST_CLIENTE_EMAIL;
const SENHA = process.env.TEST_CLIENTE_SENHA;

test.describe('Login com Firebase (conta de teste real)', () => {
  test.skip(!EMAIL || !SENHA, 'TEST_CLIENTE_EMAIL / TEST_CLIENTE_SENHA não configurados');

  test('login com credenciais válidas entra na área logada', async ({ page }) => {
    await page.goto('index.html');

    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill(SENHA);
    await page.locator('#btn-login').click();

    // Espera o Firebase Authentication responder e o app trocar para o app-shell
    await expect(page.locator('#app-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#auth-wrap')).toBeHidden();
  });

  test('login com senha errada mostra mensagem de erro', async ({ page }) => {
    await page.goto('index.html');

    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill('senha-propositalmente-errada-123');
    await page.locator('#btn-login').click();

    await expect(page.locator('#login-erro .erro-form')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#app-shell')).toBeHidden();
  });
});
