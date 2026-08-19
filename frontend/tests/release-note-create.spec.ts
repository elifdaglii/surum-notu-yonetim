import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { ReleaseNoteFormPage } from "./pages/ReleaseNoteFormPage";

test.describe("Sürüm Notu Oluşturma", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("Elif", "TestSifre123");
  });

  test("geçerli bilgilerle sürüm notu oluşturulabilmeli", async ({ page }) => {
    const formPage = new ReleaseNoteFormPage(page);
    await formPage.createReleaseNote(
      "v8.8.8",
      "Özellik",
      "## deneme yapıyorum",
    );

    await expect(page.getByText("v8.8.8")).toBeVisible();
  });
});
