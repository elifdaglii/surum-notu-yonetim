import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Login", () => {
  test("doğru bilgilerle giriş başarılı olmalı", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("Elif", "TestSifre123");

    await expect(
      page.getByText("Sürüm Notları", { exact: true }),
    ).toBeVisible();
  });
  test("yanlış şifre ile giriş başarısız olmalı", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("Elif", "yanlisSifre123");

    await expect(
      page.getByText("Kullanıcı adı veya şifre hatalı"),
    ).toBeVisible();
  });
  test("var olmayan kullanıcı adıyla giriş başarısız olmalı", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("olmayankullanici123", "herhangibirsifre");

    await expect(
      page.getByText("Kullanıcı adı veya şifre hatalı"),
    ).toBeVisible();
  });

  test("boş alanla giriş denemesi engellenmeli", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click();

    await expect(page).toHaveURL("http://localhost:5173/");
  });
});
