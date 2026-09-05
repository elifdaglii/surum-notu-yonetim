import path from 'path';
import dotenv from 'dotenv';
import { test, expect, APIRequestContext } from '@playwright/test';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Backend'in kendi admin seed mekanizmasinin (AdminUserSeeder) okudugu AYNI .env
// dosyasini yuklüyoruz - ADMIN_USERNAME/ADMIN_PASSWORD boylece iki tarafta da HEP
// birbirine esit kalir. Onceden bootstrap admin olarak "Elif"/"TestSifre123" gibi
// elle olusturulmus, farkli/temiz bir Postgres instance'inda var olmasi garanti
// olmayan bir hesaba bagimliydik - AdminUserSeeder ise veritabaninda hic ADMIN
// yokken TAM OLARAK bu .env degerleriyle ilk admin'i otomatik olusturuyor, yani bu
// kimlik bilgisi herhangi bir (temiz) veritabaninda garanti calisir.
dotenv.config({ path: path.resolve(import.meta.dirname, '../../backend/.env'), quiet: true });

const BACKEND_URL = 'http://localhost:8080';
const REGISTER_PASSWORD = 'GecmisSifre123';

// /api/auth/register artık ADMIN kimlik doğrulaması gerektiriyor (self-servis kayıt
// kapatıldı - bkz. backend SecurityConfig/AuthController) - test kullanıcıları backend'in
// seed ettiği admin hesabıyla login olup alınan token'la oluşturuluyor.
async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'ADMIN_USERNAME/ADMIN_PASSWORD okunamadı - backend/.env dosyasının var olduğundan ve ' +
        'bu değerlerin dolu olduğundan emin olun (bkz. backend/.env.example).',
    );
  }

  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username, password },
  });
  if (!response.ok()) {
    throw new Error(
      `Admin girişi başarısız (${response.status()}) - backend/.env'deki ADMIN_USERNAME/` +
        'ADMIN_PASSWORD, veritabanındaki gerçek admin hesabıyla eşleşmiyor olabilir (ör. ' +
        'admin zaten seed edildikten SONRA bu değerler değiştirildiyse, backend onu yeniden ' +
        'seed etmez - bkz. backend AdminUserSeeder).',
    );
  }
  const { token } = (await response.json()) as { token: string };
  return token;
}

type TestUser = {
  username: string;
  adminToken: string;
};

// Backend "Elif" gibi tek bir paylaşılan hesap için tek bir resetToken alanı tutuyor
// ve art arda kod isteklerinde 1 dakikalık cooldown uyguluyor (bkz.
// AuthService.RESET_REQUEST_COOLDOWN) - paylaşılan bir hesap kullanmak testleri
// (paralel çalışırken özellikle) birbirinin kodunu geçersiz kılar. Bu yüzden her test
// kendi izole, benzersiz (timestamp + random) hesabını backend'e doğrudan register
// ederek oluşturur - sabit bir kullanıcı adına asla bağımlı değildir.
async function registerUniqueUser(request: APIRequestContext): Promise<TestUser> {
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
  return { username, adminToken };
}

// Test bitince oluşturduğumuz kullanıcıyı siliyoruz - backend'de bunun için gerçek bir
// DELETE /api/admin/users/{id} var (bkz. AdminController.deleteUser), o yüzden
// atlamıyoruz. /api/auth/register 201 ile boş gövde döndüğü için id'yi doğrudan
// alamıyoruz - önce listeden kullanıcı adına göre buluyoruz. Silme başarısız olsa
// bile (ör. liste isteği patlarsa) testin kendi sonucunu etkilememesi için sessizce
// yutuyoruz - bu sadece "iyi vatandaşlık" temizliği, testin doğruluğu buna bağlı değil.
async function deleteTestUser(request: APIRequestContext, testUser: TestUser): Promise<void> {
  try {
    const listResponse = await request.get(`${BACKEND_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${testUser.adminToken}` },
    });
    if (!listResponse.ok()) return;

    const users = (await listResponse.json()) as { id: number; username: string }[];
    const match = users.find((user) => user.username === testUser.username);
    if (!match) return;

    await request.delete(`${BACKEND_URL}/api/admin/users/${match.id}`, {
      headers: { Authorization: `Bearer ${testUser.adminToken}` },
    });
  } catch {
    // Temizlik best-effort - basarisiz olsa da testin asil sonucunu etkilemesin.
  }
}

// Kod artık ekranda/response'ta değil, kullanıcının email'inde - Playwright gerçek bir
// email kutusunu okuyamayacağı için backend'in SADECE test/geliştirme amaçlı debug
// endpoint'ini kullanıyoruz (bkz. backend AuthDebugController, @Profile("dev") +
// app.debug-reset-code-enabled). Bu endpoint devre dışıyken (varsayılan) 404 döner -
// bu durumda backend'in .env dosyasında spring.profiles.active=dev VE
// DEBUG_RESET_CODE_ENABLED=true olması gerekir.
async function fetchResetCode(request: APIRequestContext, username: string): Promise<string> {
  const response = await request.get(`${BACKEND_URL}/api/auth/debug/reset-code`, {
    params: { username },
  });
  if (!response.ok()) {
    throw new Error(
      `Sıfırlama kodu okunamadı (${response.status()}) - backend .env dosyasında ` +
        'spring.profiles.active=dev VE DEBUG_RESET_CODE_ENABLED=true olduğundan emin olun',
    );
  }
  const { code } = (await response.json()) as { code: string };
  return code;
}

test.describe('Şifremi Unuttum', () => {
  test('doğru pin ile şifre başarıyla değişmeli', async ({ page, request }) => {
    const testUser = await registerUniqueUser(request);
    try {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();
      await forgotPasswordPage.requestCode(testUser.username);
      await forgotPasswordPage.advanceToResetStep();

      const validPin = await fetchResetCode(request, testUser.username);
      expect(validPin).toMatch(/^\d{6}$/);

      await forgotPasswordPage.submitReset(validPin, 'Yenisifre123', 'Yenisifre123');

      await expect(page.getByText('Şifreniz başarıyla güncellendi')).toBeVisible();
    } finally {
      await deleteTestUser(request, testUser);
    }
  });

  test('şifreler eşleşmezse hata verilmeli', async ({ page, request }) => {
    const testUser = await registerUniqueUser(request);
    try {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();
      await forgotPasswordPage.requestCode(testUser.username);
      await forgotPasswordPage.advanceToResetStep();

      const validPin = await fetchResetCode(request, testUser.username);
      await forgotPasswordPage.submitReset(validPin, 'Yenisifre123', 'FarkliSifre456');

      await expect(page.getByText('Şifreler eşleşmiyor')).toBeVisible();
    } finally {
      await deleteTestUser(request, testUser);
    }
  });

  test('yanlış pin ile şifre değiştirilememeli', async ({ page, request }) => {
    const testUser = await registerUniqueUser(request);
    try {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();
      await forgotPasswordPage.requestCode(testUser.username);
      await forgotPasswordPage.advanceToResetStep();

      await forgotPasswordPage.submitReset('000000', 'Yenisifre123', 'Yenisifre123');

      await expect(page.getByText('Geçersiz kod')).toBeVisible();
    } finally {
      await deleteTestUser(request, testUser);
    }
  });
});
