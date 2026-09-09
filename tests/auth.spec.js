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
const { test, expect } = require('@playwright/test');

const EMAIL = process.env.TEST_CLIENTE_EMAIL;
const SENHA = process.env.TEST_CLIENTE_SENHA;

test.describe('Login com Firebase (conta de teste real)', () => {
  test.skip(!EMAIL || !SENHA, 'TEST_CLIENTE_EMAIL / TEST_CLIENTE_SENHA não configurados');

  test('login de cliente com credenciais válidas entra na área do cliente', async ({ page }) => {
    await page.goto('index.html#/entrar-cliente');

    const form = page.locator('form[data-form="login"]');
    await form.locator('input[name="email"]').fill(EMAIL);
    await form.locator('input[name="senha"]').fill(SENHA);
    await form.getByRole('button', { name: /entrar/i }).click();

    // Espera o Firebase Authentication responder e o app navegar para a área logada
    await expect(page).toHaveURL(/#\/c\//, { timeout: 15000 });
  });

  test('login com senha errada mostra mensagem de erro', async ({ page }) => {
    await page.goto('index.html#/entrar-cliente');

    const form = page.locator('form[data-form="login"]');
    await form.locator('input[name="email"]').fill(EMAIL);
    await form.locator('input[name="senha"]').fill('senha-propositalmente-errada-123');
    await form.getByRole('button', { name: /entrar/i }).click();

    await expect(page.locator('#erro-login .erro-form')).toBeVisible({ timeout: 15000 });
    await expect(page).not.toHaveURL(/#\/c\//);
  });
});
