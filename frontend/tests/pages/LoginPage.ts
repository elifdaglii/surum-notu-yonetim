import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole("textbox", { name: "KULLANICI ADI" });
    this.passwordInput = page.getByRole("textbox", { name: "ŞİFRE" });
    this.loginButton = page.getByRole("button", { name: "Giriş Yap" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // handleLoginSuccess() login isteği (async) tamamlanınca localStorage'a
    // token yazıp App.tsx'i yeniden render ediyor - bu login formunu unmount
    // ediyor. Bunu beklemeden dönersek (örn. hemen ardından page.goto('/')
    // çağıran testlerde), henüz yazılmamış bir token'a güvenip tekrar login
    // ekranına düşülebiliyor. Yanlış bilgilerle girişte form hiç unmount
    // olmuyor (bkz. login.spec.ts'teki başarısız giriş testleri) - bu yüzden
    // sınırlı süreli, best-effort bekliyoruz: başarılı girişte hızlıca
    // gerçekleşir, başarısız girişte sessizce timeout'a düşüp devam eder.
    await this.usernameInput.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  }
}
