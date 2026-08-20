import { test, expect, APIRequestContext } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ArchivePage } from './pages/ArchivePage';
import { ReleaseNoteFormPage } from './pages/ReleaseNoteFormPage';
import { uniqueVersion } from './utils/testData';

const BACKEND_URL = 'http://localhost:8080';

// uniqueVersion() global olarak benzersiz ama iki bağımsız çağrının sonucu şans eseri
// birbirinin ALT DİZESİ olabilir (örn. "v9.897.6" ve "v9.897.625" - aynı "minor" +
// kısa bir "patch" bir uzununkinin öneki oluyor). Arşivin arama filtresi (ve bu dosyadaki
// findIndex tabanlı sıralama kontrolleri) tam eşleşme değil .includes() kullandığı için bu,
// nadir ama gerçek bir yanlış-pozitif kaynağı - aynı testte birden fazla versiyon
// karşılaştırılacaksa bu sarmalayıcıyla üretiliyor.
function nonOverlappingVersion(existing: string[]): string {
  let candidate = uniqueVersion();
  while (existing.some((v) => candidate.includes(v) || v.includes(candidate))) {
    candidate = uniqueVersion();
  }
  return candidate;
}

// Yazara göre filtreleme testinde "sadece bu yazarın notu görünüyor mu" iddiasını kanıtlamak
// için Elif'ten (testlerin login olduğu tek UI kullanıcısı) FARKLI bir yazara ihtiyaç var.
// UI'da ikinci bir oturum açmak yerine forgot-password.spec.ts'teki gibi backend'e doğrudan
// register+login+create isteği atıp yeni, garantili benzersiz bir kullanıcı adına ait tek bir
// not oluşturuyoruz - bu sayede DB'de önceden ne olursa olsun test izole ve deterministik kalıyor.
//
// /api/auth/register artık ADMIN kimlik doğrulaması gerektiriyor (self-servis kayıt kapatıldı -
// bkz. backend SecurityConfig/AuthController) - önce Elif olarak login olup alınan admin
// token'ı bu isteğe ekleniyor.
async function createNoteAsNewAuthor(request: APIRequestContext, version: string): Promise<string> {
  const username = `archauth_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const password = 'TestSifre123';

  const adminLoginResponse = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username: 'Elif', password: 'TestSifre123' },
  });
  const { token: adminToken } = (await adminLoginResponse.json()) as { token: string };

  const registerResponse = await request.post(`${BACKEND_URL}/api/auth/register`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { username, password },
  });
  if (!registerResponse.ok()) {
    throw new Error(`Test yazarı oluşturulamadı: ${registerResponse.status()} ${await registerResponse.text()}`);
  }

  const loginResponse = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username, password },
  });
  const { token } = (await loginResponse.json()) as { token: string };

  const categoriesResponse = await request.get(`${BACKEND_URL}/api/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const categories = (await categoriesResponse.json()) as { id: number }[];

  const createResponse = await request.post(`${BACKEND_URL}/api/release-notes`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      version,
      releaseDate: '2026-01-01',
      categoryId: categories[0].id,
      contentMarkdown: '## farklı yazar notu',
    },
  });
  if (!createResponse.ok()) {
    throw new Error(`Test notu oluşturulamadı: ${createResponse.status()} ${await createResponse.text()}`);
  }

  return username;
}

test.describe('Arşiv Arama ve Sıralama', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Elif', 'TestSifre123');
  });

  test('varsayılan ters kronolojik sıralama', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const oldVersion = uniqueVersion();
    const midVersion = nonOverlappingVersion([oldVersion]);
    const newVersion = nonOverlappingVersion([oldVersion, midVersion]);

    // Birbirinden uzak, kesin sıralı üç tarih - hangi başka veri DB'de olursa olsun bu
    // üçünün BİRBİRİNE göre sırası tek anlamlı kalıyor.
    // createReleaseNote() kaydetme isteğinin bitmesini BEKLEMEDEN döner (bkz.
    // ReleaseNoteFormPage) - bir sonraki notu oluşturmadan/karşılaştırma yapmadan önce
    // kartın gerçekten listeye yansıdığını (Playwright'ın otomatik retry'ı ile) doğruluyoruz.
    // Böylece henüz sunucuya ulaşmamış bir isteği okumaya çalışmıyoruz.
    await formPage.createReleaseNote(oldVersion, 'Özellik', '## eski kayıt', '2020-03-10');
    await expect(formPage.noteCard(oldVersion)).toBeVisible();
    await formPage.createReleaseNote(midVersion, 'Özellik', '## orta kayıt', '2023-07-04');
    await expect(formPage.noteCard(midVersion)).toBeVisible();
    await formPage.createReleaseNote(newVersion, 'Özellik', '## yeni kayıt', '2026-01-01');
    await expect(formPage.noteCard(newVersion)).toBeVisible();

    const cardTexts = await archivePage.cards.allTextContents();
    const indexNew = cardTexts.findIndex((t) => t.includes(newVersion));
    const indexMid = cardTexts.findIndex((t) => t.includes(midVersion));
    const indexOld = cardTexts.findIndex((t) => t.includes(oldVersion));

    expect(indexNew).toBeGreaterThanOrEqual(0);
    expect(indexMid).toBeGreaterThanOrEqual(0);
    expect(indexOld).toBeGreaterThanOrEqual(0);
    expect(indexNew).toBeLessThan(indexMid);
    expect(indexMid).toBeLessThan(indexOld);
  });

  test('sıralama yönü değiştirme', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const oldVersion = uniqueVersion();
    const newVersion = nonOverlappingVersion([oldVersion]);

    await formPage.createReleaseNote(oldVersion, 'Özellik', '## eski kayıt', '2020-03-10');
    await expect(formPage.noteCard(oldVersion)).toBeVisible();
    await formPage.createReleaseNote(newVersion, 'Özellik', '## yeni kayıt', '2026-01-01');
    await expect(formPage.noteCard(newVersion)).toBeVisible();

    const descTexts = await archivePage.cards.allTextContents();
    const descIndexNew = descTexts.findIndex((t) => t.includes(newVersion));
    const descIndexOld = descTexts.findIndex((t) => t.includes(oldVersion));
    expect(descIndexNew).toBeLessThan(descIndexOld);

    await archivePage.setSortAscending();

    const ascTexts = await archivePage.cards.allTextContents();
    const ascIndexNew = ascTexts.findIndex((t) => t.includes(newVersion));
    const ascIndexOld = ascTexts.findIndex((t) => t.includes(oldVersion));
    expect(ascIndexOld).toBeLessThan(ascIndexNew);
  });

  test('yazara göre filtreleme', async ({ page, request }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    const author = await createNoteAsNewAuthor(request, version);

    // Elif'in kendi notu - filtre uygulandığında bunun EKRANDAN KAYBOLMASI, filtrenin
    // gerçekten sadece seçilen yazarı bırakıp diğerlerini elediğini kanıtlıyor. Paralel
    // çalışan diğer suite'lerin DB'ye eş zamanlı yazdığı bir ortamda toplam kart SAYISINA
    // (toHaveCount) güvenmek kırılgan olurdu - bunun yerine bilinen, belirli iki kartın
    // görünürlüğüne bakıyoruz (category.spec.ts'teki "kategoriye göre filtreleme" testiyle
    // aynı yaklaşım).
    const elifVersion = nonOverlappingVersion([version]);
    await formPage.createReleaseNote(elifVersion, 'Özellik', '## elif notu');
    await expect(formPage.noteCard(elifVersion)).toBeVisible();

    await archivePage.goto();
    await archivePage.filterByAuthor(author);

    await expect(formPage.noteCard(version)).toBeVisible();
    await expect(formPage.noteCard(elifVersion)).not.toBeVisible();
  });

  test('sürüm no / içerik arama', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    const uniqueContentWord = `aramakelimesi${Date.now()}`;
    // Arama gerçekten DARALTIYOR mu diye kanıtlamak için eşleşmemesi gereken ikinci,
    // alakasız bir not da oluşturuyoruz.
    const unrelatedVersion = nonOverlappingVersion([version]);

    await formPage.createReleaseNote(version, 'Özellik', `## ${uniqueContentWord} içeriği`);
    await expect(formPage.noteCard(version)).toBeVisible();
    await formPage.createReleaseNote(unrelatedVersion, 'Hata Çözümü', '## alakasız içerik');
    await expect(formPage.noteCard(unrelatedVersion)).toBeVisible();

    // 1) Sürüm numarasına göre arama
    await archivePage.search(version);
    await expect(formPage.noteCard(version)).toBeVisible();
    await expect(formPage.noteCard(unrelatedVersion)).not.toBeVisible();

    // 2) İçerikteki benzersiz kelimeye göre arama
    await archivePage.search(uniqueContentWord);
    await expect(formPage.noteCard(version)).toBeVisible();
    await expect(formPage.noteCard(unrelatedVersion)).not.toBeVisible();
  });

  test('sonuç bulunamayan arama', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    // "notes.length > 0" koşulu sağlansın diye en az bir not garantiliyoruz (bkz.
    // release-notes-archive.tsx - liste tamamen boşsa farklı bir mesaj gösteriliyor).
    await formPage.createReleaseNote(version, 'Özellik', '## deneme yapıyorum');
    await expect(formPage.noteCard(version)).toBeVisible();

    const nonExistentQuery = `hicbirnotta-olmayan-kelime-${Date.now()}`;
    await archivePage.search(nonExistentQuery);

    await expect(archivePage.noResultsMessage).toBeVisible();
    await expect(formPage.noteCard(version)).not.toBeVisible();
  });

  test('filtre temizleme', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const versionA = uniqueVersion();
    const versionB = nonOverlappingVersion([versionA]);

    await formPage.createReleaseNote(versionA, 'Özellik', '## deneme yapıyorum');
    await expect(formPage.noteCard(versionA)).toBeVisible();
    // createReleaseNote() kaydetme isteğinin bitmesini BEKLEMEDEN döner (bkz.
    // ReleaseNoteFormPage) - versionB'nin kartının gerçekten yansıdığını burada
    // doğrulamadan hemen aramaya geçmek, yoğun paralel yük altında (ör. tüm suite aynı
    // anda çalışırken) formun/modalın henüz kapanmamış olabileceği bir an yakalayıp
    // search() input'unu etkileşimsiz bırakabiliyordu (bkz. archive-search.spec.ts'teki
    // sıralama testlerinde daha önce bulunan aynı sınıf race - orada da bu şekilde
    // çözüldü).
    await formPage.createReleaseNote(versionB, 'Hata Çözümü', '## deneme yapıyorum');
    await expect(formPage.noteCard(versionB)).toBeVisible();

    await archivePage.search(versionA);
    await expect(formPage.noteCard(versionA)).toBeVisible();
    await expect(formPage.noteCard(versionB)).not.toBeVisible();

    await archivePage.clearSearch();

    await expect(formPage.noteCard(versionA)).toBeVisible();
    await expect(formPage.noteCard(versionB)).toBeVisible();
  });
});
