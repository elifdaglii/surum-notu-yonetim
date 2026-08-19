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

    // Kaydetme sonrası kısa süreli bir "başarı" toast'ı da aynı versiyon metnini
    // içeriyor (bkz. add-release-note-dialog.tsx SUCCESS_MESSAGE_DURATION_MS),
    // bu yüzden arşiv kartındaki metni doğrulamadan önce toast'ın kaybolmasını
    // bekliyoruz - yoksa getByText(version) iki eşleşme bulup strict-mode
    // ihlaline yol açıyor.
    await expect(page.getByRole("status")).toBeHidden({ timeout: 6000 });
    await expect(page.getByText(version)).toBeVisible();
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
});
