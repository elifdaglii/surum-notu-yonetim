import { test, expect, APIRequestContext } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ArchivePage } from './pages/ArchivePage';
import { ReleaseNoteFormPage } from './pages/ReleaseNoteFormPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { uniqueVersion } from './utils/testData';

const BACKEND_URL = 'http://localhost:8080';

// Senaryo 4/5 için testin kendi oluşturduğu, garantili benzersiz bir USER hesabı -
// forgot-password.spec.ts / archive-search.spec.ts'teki aynı desen: backend'e doğrudan
// register isteği atmak, UI'da ikinci bir oturum kurmadan izole bir hesap veriyor.
//
// /api/auth/register artık ADMIN kimlik doğrulaması gerektiriyor (self-servis kayıt kapatıldı -
// bkz. backend SecurityConfig/AuthController) - önce Elif olarak login olup alınan admin
// token'ı bu isteğe ekleniyor.
async function registerUser(request: APIRequestContext): Promise<{ username: string; password: string }> {
  const username = `adminpanel_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const password = 'TestSifre123';
  const adminToken = await loginViaApi(request, 'Elif', 'TestSifre123');
  const response = await request.post(`${BACKEND_URL}/api/auth/register`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { username, password },
  });
  if (!response.ok()) {
    throw new Error(`Test kullanıcısı oluşturulamadı: ${response.status()} ${await response.text()}`);
  }
  return { username, password };
}

async function loginViaApi(request: APIRequestContext, username: string, password: string): Promise<string> {
  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username, password },
  });
  const { token } = (await response.json()) as { token: string };
  return token;
}

test.describe('Admin Paneli - Kullanıcı Yönetimi', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Elif', 'TestSifre123');
  });

  test('kullanıcı ekleme', async ({ page }) => {
    const adminPanel = new AdminPanelPage(page);
    const username = `kullanici_${Date.now()}`;

    await adminPanel.goto();
    await adminPanel.addUser(username, 'TestSifre123', 'USER');

    await expect(adminPanel.userRow(username)).toBeVisible();
  });

  // NOT: Orijinal istek "son admin silinemez" başlığındaydı. Sistemde şu an tek gerçek
  // ADMIN (Elif) var ve o, diğer tüm testlerin login için kullandığı hesap - onu silmeyi
  // DENEMEK bile (backend engellese dahi) testler arası paylaşılan bir hesapla riskli bir
  // oyun oynamak demek. Bunun yerine, kullanıcının kendi önerdiği güvenli alternatifi
  // uyguladım: testin kendi oluşturduğu İKİNCİ bir ADMIN'i, "son admin" durumuna hiç
  // gelmeden (silme anında sistemde 2 admin var: Elif + bu) siliyoruz - bu, koruma
  // mekanizmasının admin sayısı yeterliyken silmeyi ENGELLEMEDİĞİNİ kanıtlıyor.
  // Gerçek "son admin engellendi" davranışını (Elif'i silmeyi deneyip 409 aldığını
  // görmek) test etmek Elif'in silinmeye çalışılmasını gerektirir - bu adımı SİZİN
  // onayınız olmadan yazmadım (bkz. konuşmadaki talebiniz). Bulduğum gerçek davranış:
  // backend'de GERÇEKTEN bir son-admin koruması var - UserManagementService.deleteUser():
  // `if (user.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1)
  // throw new LastAdminException(...)` -> controller bunu 409 olarak dönüyor, frontend
  // (api/admin.ts deleteUser) 409'u "Sistemde en az bir ADMIN kalmalı, bu kullanıcı
  // silinemez" mesajına çeviriyor (bkz. adminPanel.userDeleteError).
  test('ikinci admin silinebilir (son admin koruması yanlışlıkla engel olmuyor)', async ({ page }) => {
    const adminPanel = new AdminPanelPage(page);
    const username = `ikincitest_admin_${Date.now()}`;

    await adminPanel.goto();
    await adminPanel.addUser(username, 'TestSifre123', 'ADMIN');
    await expect(adminPanel.userRow(username)).toBeVisible();
    await expect(adminPanel.userRow(username)).toContainText('ADMIN');

    await adminPanel.deleteUser(username);

    await expect(adminPanel.userRow(username)).not.toBeVisible();
    await expect(adminPanel.userDeleteError).not.toBeVisible();
  });

  test('kullanıcı düzenleme', async ({ page }) => {
    const adminPanel = new AdminPanelPage(page);
    // "duzenlenecek_..." ve "duzenlendi_..." bilerek FARKLI köklerle başlıyor - biri
    // diğerinin alt dizesi olsaydı (örn. sadece sona ek eklenseydi), yeniden adlandırma
    // sonrası "eski kullanıcı adı artık görünmüyor" kontrolü satırın YENİ adını da
    // (içerdiği için) yanlışlıkla eşleştirip testi anlamsızlaştırabilirdi.
    const originalUsername = `duzenlenecek_${Date.now()}`;
    const newUsername = `duzenlendi_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    await adminPanel.goto();
    await adminPanel.addUser(originalUsername, 'TestSifre123', 'USER');
    await expect(adminPanel.userRow(originalUsername)).toBeVisible();

    await adminPanel.openEditDialog(originalUsername);
    await adminPanel.editUsernameInput.fill(newUsername);
    await adminPanel.selectEditRole('ADMIN');
    await adminPanel.saveEditButton.click();

    await expect(adminPanel.userRow(newUsername)).toBeVisible();
    await expect(adminPanel.userRow(newUsername)).toContainText('ADMIN');
    await expect(adminPanel.userRow(originalUsername)).not.toBeVisible();
  });

  test('ADMIN başkasının notunu düzenleyip silebilir', async ({ page, request }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();

    // Not, testin kendi oluşturduğu bir USER hesabıyla, API üzerinden oluşturuluyor -
    // UI'da ikinci bir oturum açmadan "başkasının notu" durumunu garanti ediyor.
    const owner = await registerUser(request);
    const ownerToken = await loginViaApi(request, owner.username, owner.password);
    const categoriesResponse = await request.get(`${BACKEND_URL}/api/categories`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const categories = (await categoriesResponse.json()) as { id: number }[];
    await request.post(`${BACKEND_URL}/api/release-notes`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        version,
        releaseDate: '2026-01-01',
        categoryId: categories[0].id,
        contentMarkdown: '## sahibi başka bir kullanıcı',
      },
    });

    await page.goto('/');
    await expect(formPage.noteCard(version)).toBeVisible();

    await formPage.noteCard(version).click();
    // canManage = role === "ADMIN" || note.createdByUsername === currentUsername -
    // Elif ADMIN olduğu için not kendisine ait olmasa da Düzenle/Sil görünür olmalı.
    await expect(archivePage.editNoteButton(version)).toBeVisible();
    await expect(archivePage.deleteNoteButton(version)).toBeVisible();

    const updatedMarker = `guncellendi-${Date.now()}`;
    await archivePage.editNoteButton(version).click();
    await formPage.contentInput.fill(`## ${updatedMarker}`);
    await formPage.updateButton.click();

    // getByText(updatedMarker) düzenleme formu kapanana kadar HEM hâlâ açık olan
    // textarea'ya (içeriğin ham hâli) HEM markdown'dan render edilmiş karttaki başlığa
    // ("## " bir <h2>'ye dönüşüyor) eşleşip strict-mode ihlaline yol açıyordu - kontrolü
    // doğrudan karta daraltmak hem bunu önlüyor hem "gerçekten kartta güncellendi mi"yi
    // (formdaki değeri değil) doğruluyor.
    await expect(formPage.noteCard(version)).toContainText(updatedMarker);

    await formPage.noteCard(version).click();
    await archivePage.deleteNoteButton(version).click();
    await archivePage.confirmDeleteNote();

    await expect(formPage.noteCard(version)).not.toBeVisible();
  });

  test('USER admin sayfalarına erişemez', async ({ page, request }) => {
    const adminPanel = new AdminPanelPage(page);
    const loginPage = new LoginPage(page);
    const testUser = await registerUser(request);

    // beforeEach zaten Elif/ADMIN ile giriş yaptı - şimdi çıkış yapıp testin kendi
    // oluşturduğu USER hesabıyla tekrar giriş yapıyoruz (HomePage.tsx: "ADMIN buraya hiç
    // düşmüyor, USER hiçbir zaman sidebar görmemeli" yorumunu doğrudan doğrulamak için).
    await adminPanel.logout();
    await loginPage.login(testUser.username, testUser.password);

    await expect(page.getByRole('heading', { name: 'Geçmiş Sürüm Notları' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kullanıcılar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Kategoriler' })).toHaveCount(0);
    await expect(page.getByText('Admin Paneli')).toHaveCount(0);
  });
});
