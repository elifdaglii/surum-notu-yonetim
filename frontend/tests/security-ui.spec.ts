import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { GeneralUIPage } from './pages/GeneralUIPage';

const BACKEND_URL = 'http://localhost:8080';

// Saf API testi - tarayıcı/login gerektirmiyor, bu yüzden ayrı, beforeEach'siz bir
// describe bloğunda.
test.describe('Register Endpoint Güvenliği', () => {
  test('kapatılan register endpoint çalışmamalı', async ({ request }) => {
    const username = `sec_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const response = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { username, password: 'TestSifre123' },
    });

    // BEKLENEN/İSTENEN davranış: self-servis kayıt kapalı olmalı (404 ya da 403).
    //
    // GERÇEK DURUM (bu görevin başında koddan doğrulandı, tahmin değil): SecurityConfig.java
    // hâlâ ".requestMatchers(\"/api/auth/**\", \"/error\").permitAll()" ile TÜM /api/auth/**
    // endpoint'lerini (register dahil) kimlik doğrulamasız bırakıyor; AuthService.register()
    // bunu engelleyen hiçbir kontrol/feature-flag içermiyor. Bu isteği bu oturumda üç ayrı
    // test dosyasında (forgot-password.spec.ts, archive-search.spec.ts, admin-panel.spec.ts)
    // defalarca attık ve hepsi 201 Created ile başarıyla tamamlandı.
    //
    // Bu test BİLEREK "olması gereken" (kapalı) davranışı doğruluyor - kullanıcının kararıyla
    // FAIL bırakılıyor: suite'teki bu kırmızı sonuç, kapatılması gereken gerçek bir güvenlik
    // regresyonunu işaretliyor. Uygulama kodu bu görev kapsamında DEĞİŞTİRİLMEDİ.
    expect([403, 404]).toContain(response.status());
  });
});

test.describe('Genel Arayüz (Tema, Oturum)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Elif', 'TestSifre123');
  });

  test('dark/light mode toggle çalışmalı ve kalıcı olmalı', async ({ page }) => {
    const generalUI = new GeneralUIPage(page);

    // theme-provider.tsx: defaultTheme="light", enableSystem={false} - taze bir tarayıcı
    // bağlamında (Playwright her testte izole localStorage veriyor) başlangıç her zaman
    // light olmalı.
    expect(await generalUI.isDarkMode()).toBe(false);

    await generalUI.toggleTheme();

    expect(await generalUI.isDarkMode()).toBe(true);
    expect(await generalUI.storedTheme()).toBe('dark');

    await page.reload();

    // Token/rol de localStorage'da olduğu için reload sonrası hâlâ giriş yapmış
    // durumdayız (bkz. App.tsx) - burada asıl doğrulanan, next-themes'in kendi
    // kalıcılığı: sayfa yeniden yüklendiğinde tema tercihinin (localStorage'dan okunarak)
    // korunması.
    expect(await generalUI.isDarkMode()).toBe(true);
    expect(await generalUI.storedTheme()).toBe('dark');
  });

  test('profilden çıkış sonrası korumalı sayfalara erişilememeli', async ({ page }) => {
    const adminPanel = new AdminPanelPage(page);
    const loginPage = new LoginPage(page);

    await adminPanel.logout();

    await expect(loginPage.usernameInput).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();

    // NOT: Bu uygulamada gerçek bir router yok ("Router yok, sayfa geçişleri elle
    // yönetiliyor" - bkz. App.tsx) - login/logout URL değiştirmiyor, sadece React state'i
    // değişiyor. beforeEach'teki loginPage.goto() bu testin TEK gerçek navigasyonu olduğu
    // için goBack()'in gidebileceği başka bir geçmiş girdisi yok - about:blank'e düşüyor.
    // about:blank "opaque origin" olduğu için localStorage'a erişim tarayıcı tarafından
    // SecurityError ile reddediliyor (bunu da doğrulanmış davranış olarak burada
    // belgeliyoruz) - bu yüzden localStorage kontrolünü, gerçek origin'e döndüğümüz
    // aşağıdaki adıma bırakıyoruz. Burada asıl kontrol edilen: about:blank'te (ya da
    // nereye düşersek düşelim) korumalı içerik SIZMAMALI.
    await page.goBack();

    await expect(page.getByRole('button', { name: 'Kullanıcılar' })).toHaveCount(0);

    // '/'e tekrar gidip (ör. sekme yeniden açılsa/bookmark'tan dönülse ne olurdu) hâlâ
    // login ekranına düştüğümüzü ve token'ın geri gelmediğini doğruluyoruz.
    await page.goto('/');

    await expect(loginPage.usernameInput).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
