import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { CategoryPage } from './pages/CategoryPage';
import { ReleaseNoteFormPage } from './pages/ReleaseNoteFormPage';
import { ArchivePage } from './pages/ArchivePage';
import { uniqueVersion } from './utils/testData';

test.describe('Kategori Yönetimi', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Elif', 'TestSifre123');
  });

  test('kategori ekleme', async ({ page }) => {
    const categoryPage = new CategoryPage(page);
    const categoryName = `Test-${Date.now()}`;

    await categoryPage.goto();
    await categoryPage.addCategory(categoryName);

    await expect(categoryPage.categoryRow(categoryName)).toBeVisible();
  });

  test('kullanılmayan kategori silme', async ({ page }) => {
    const categoryPage = new CategoryPage(page);
    const categoryName = `Test-${Date.now()}`;

    await categoryPage.goto();
    await categoryPage.addCategory(categoryName);
    await expect(categoryPage.categoryRow(categoryName)).toBeVisible();

    await categoryPage.deleteCategory(categoryName);

    await expect(categoryPage.categoryRow(categoryName)).not.toBeVisible();
  });

  test('kullanılan kategori silme engeli', async ({ page }) => {
    const categoryPage = new CategoryPage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const categoryName = `Test-${Date.now()}`;

    await categoryPage.goto();
    await categoryPage.addCategory(categoryName);
    await expect(categoryPage.categoryRow(categoryName)).toBeVisible();

    // Kategoriyi gerçekten "kullanılan" hale getirmek için ona bağlı bir sürüm
    // notu oluşturuyoruz - böylece test, "Özellik" gibi başka test dosyalarının
    // ürettiği kayıtlara bağımlı olmuyor.
    await formPage.goto();
    await formPage.createReleaseNote(uniqueVersion(), categoryName, '## deneme yapıyorum');

    await categoryPage.goto();
    await categoryPage.deleteCategory(categoryName);

    await expect(categoryPage.categoryDeleteError).toBeVisible();
    await expect(categoryPage.categoryRow(categoryName)).toBeVisible();
  });

  test('kategoriye göre filtreleme', async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    const archivePage = new ArchivePage(page);
    const versionOzellik = uniqueVersion();
    const versionHataCozumu = uniqueVersion();

    await formPage.goto();
    await formPage.createReleaseNote(versionOzellik, 'Özellik', '## deneme yapıyorum');
    await formPage.createReleaseNote(versionHataCozumu, 'Hata Çözümü', '## deneme yapıyorum');

    await archivePage.filterByCategory('Özellik');

    await expect(formPage.noteCard(versionOzellik)).toBeVisible();
    await expect(formPage.noteCard(versionHataCozumu)).not.toBeVisible();
  });
});
