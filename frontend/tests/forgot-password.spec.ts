import { test, expect, APIRequestContext } from '@playwright/test';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Backend "Elif" hesabı için tek bir resetToken alanı tutuyor ve art arda kod
// isteklerinde 1 dakikalık cooldown uyguluyor (bkz. AuthService.RESET_REQUEST_COOLDOWN),
// bu cooldown başarılı sıfırlamadan sonra bile bilerek temizlenmiyor. Paylaşılan bir
// hesap kullanmak testleri (paralel çalışırken özellikle) birbirinin kodunu geçersiz
// kılar. Bu yüzden her test kendi izole hesabını backend'e doğrudan register ederek
// oluşturur.
const BACKEND_URL = 'http://localhost:8080';
const REGISTER_PASSWORD = 'GecmisSifre123';

// /api/auth/register artık ADMIN kimlik doğrulaması gerektiriyor (self-servis kayıt
// kapatıldı - bkz. backend SecurityConfig/AuthController) - test kullanıcıları artık
// önce Elif olarak login olup alınan admin token'ıyla oluşturuluyor.
async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username: 'Elif', password: 'TestSifre123' },
  });
  const { token } = (await response.json()) as { token: string };
  return token;
}

async function registerUniqueUser(request: APIRequestContext): Promise<string> {
  const username = `pwreset_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const adminToken = await loginAsAdmin(request);
  const response = await request.post(`${BACKEND_URL}/api/auth/register`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    // email: kod artık gerçekten gönderiliyor (bkz. backend AuthService.forgotPassword) -
    // gerçek bir gönderim denemesi tetiklemek için sahte de olsa bir adres veriyoruz.
    data: { username, password: REGISTER_PASSWORD, email: `${username}@example.com` },
  });
  if (!response.ok()) {
    throw new Error(`Test kullanıcısı oluşturulamadı: ${response.status()} ${await response.text()}`);
  }
  return username;
}

// Kod artık ekranda/response'ta değil, kullanıcının email'inde - Playwright gerçek bir
// email kutusunu okuyamayacağı için backend'in SADECE test/geliştirme amaçlı debug
// endpoint'ini kullanıyoruz (bkz. backend AuthController.debugResetCode,
// app.debug-reset-code-enabled). Bu endpoint devre dışıyken (varsayılan) 404 döner -
// bu durumda backend'in .env dosyasında DEBUG_RESET_CODE_ENABLED=true olması gerekir.
async function fetchResetCode(request: APIRequestContext, username: string): Promise<string> {
  const response = await request.get(`${BACKEND_URL}/api/auth/debug/reset-code`, {
    params: { username },
  });
  if (!response.ok()) {
    throw new Error(
      `Sıfırlama kodu okunamadı (${response.status()}) - backend .env dosyasında ` +
        'DEBUG_RESET_CODE_ENABLED=true olduğundan emin olun',
    );
  }
  const { code } = (await response.json()) as { code: string };
  return code;
}

test.describe('Şifremi Unuttum', () => {
  test('doğru pin ile şifre başarıyla değişmeli', async ({ page, request }) => {
    const username = await registerUniqueUser(request);
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestCode(username);
    await forgotPasswordPage.advanceToResetStep();

    const validPin = await fetchResetCode(request, username);
    expect(validPin).toMatch(/^\d{6}$/);

    await forgotPasswordPage.submitReset(validPin, 'Yenisifre123', 'Yenisifre123');

    await expect(page.getByText('Şifreniz başarıyla güncellendi')).toBeVisible();
  });

  test('şifreler eşleşmezse hata verilmeli', async ({ page, request }) => {
    const username = await registerUniqueUser(request);
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestCode(username);
    await forgotPasswordPage.advanceToResetStep();

    const validPin = await fetchResetCode(request, username);
    await forgotPasswordPage.submitReset(validPin, 'Yenisifre123', 'FarkliSifre456');

    await expect(page.getByText('Şifreler eşleşmiyor')).toBeVisible();
  });

  test('yanlış pin ile şifre değiştirilememeli', async ({ page, request }) => {
    const username = await registerUniqueUser(request);
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestCode(username);
    await forgotPasswordPage.advanceToResetStep();

    await forgotPasswordPage.submitReset('000000', 'Yenisifre123', 'Yenisifre123');

    await expect(page.getByText('Geçersiz kod')).toBeVisible();
  });
});
