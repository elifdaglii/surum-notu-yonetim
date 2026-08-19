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
});
