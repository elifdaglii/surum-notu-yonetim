import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { ReleaseNoteFormPage } from "./pages/ReleaseNoteFormPage";
import { uniqueVersion } from "./utils/testData";

test.describe("Sürüm Notu Oluşturma", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("Elif", "TestSifre123");
  });

  test("geçerli bilgilerle sürüm notu oluşturulabilmeli", async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    await formPage.createReleaseNote(
      version,
      "Özellik",
      "## deneme yapıyorum",
    );

    await expect(formPage.noteCard(version)).toBeVisible();
  });

  test('geçersiz SemVer formatı reddedilmeli', async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    await formPage.createReleaseNote(
      "v1.2",
      "Özellik",
      "## deneme yapıyorum",
    );

    await expect(formPage.versionErrorMessage).toBeVisible();
  });

  test('kategori seçilmeden kaydetme engellenmeli', async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    await formPage.submitWithoutCategory(version, "## deneme yapıyorum");

    await expect(formPage.saveButton).toBeVisible();
    await expect(formPage.noteCard(version)).not.toBeVisible();
  });

  test('markdown içeriği canlı önizlemede gösterilmeli', async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    await formPage.openForm();
    await formPage.contentInput.fill('## Test Başlığı');

    await expect(
      formPage.previewPanel.getByRole('heading', { name: 'Test Başlığı', level: 2 }),
    ).toBeVisible();
  });

  test('script içeriği güvenli hale getirilmeli', async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    const maliciousContent = 'Test <script>window.xssTriggered = true</script> içerik';

    await formPage.openForm();
    await formPage.versionInput.fill(version);
    await formPage.selectCategory('Özellik');
    await formPage.contentInput.fill(maliciousContent);

    // Canlı önizleme bu noktada zaten dangerouslySetInnerHTML ile render edilmiş
    // durumda (bkz. add-release-note-dialog.tsx previewHtml) - "kaydetmeden önce"
    // ölçümü burada alınıyor.
    const scriptCountBeforeSave = await page.locator('script').count();

    await formPage.saveButton.click();
    await expect(formPage.noteCard(version)).toBeVisible();

    const scriptCountAfterSave = await page.locator('script').count();
    expect(scriptCountAfterSave).toBe(scriptCountBeforeSave);

    const xssTriggered = await page.evaluate(() => (window as unknown as { xssTriggered?: boolean }).xssTriggered);
    expect(xssTriggered).toBeUndefined();
  });
});
