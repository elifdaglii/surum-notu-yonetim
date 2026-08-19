import { Page, Locator } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly forgotPasswordButton: Locator;
  readonly usernameInput: Locator;
  readonly generateCodeButton: Locator;
  // Adım 1 sonundaki "Şifreyi Sıfırla" butonu - submit değil, adım 2'ye geçirir
  // (bkz. forgot-password-form.tsx: onTokenGenerated). Pin input'u ancak bu
  // tıklamadan sonra DOM'a eklenir.
  readonly confirmCodeButton: Locator;
  readonly pinInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly updatePasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.forgotPasswordButton = page.getByRole('button', { name: 'Şifremi Unuttum' });
    this.usernameInput = page.getByRole('textbox', { name: 'KULLANICI ADI' });
    this.generateCodeButton = page.getByRole('button', { name: 'Doğrulama Kodu Oluştur' });
    this.confirmCodeButton = page.getByRole('button', { name: 'Şifreyi Sıfırla' });
    this.pinInput = page.getByRole('textbox', { name: 'DOĞRULAMA KODU' });
    this.newPasswordInput = page.getByRole('textbox', { name: 'YENİ ŞİFRE', exact: true });
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'YENİ ŞİFRE (TEKRAR)' });
    this.updatePasswordButton = page.getByRole('button', { name: 'Şifreyi Güncelle' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async requestCode(username: string) {
    await this.forgotPasswordButton.click();
    await this.usernameInput.fill(username);
    await this.generateCodeButton.click();
  }

  // Adım 1 -> adım 2 geçişi. Pin input'u ancak bu çağrıdan sonra erişilebilir olur.
  async advanceToResetStep() {
    await this.confirmCodeButton.click();
  }

  // Backend'in ürettiği ve reset-password-form.tsx'in initialToken olarak
  // önceden doldurduğu gerçek kodu okur (placeholder değil, gerçek geçerli kod).
  async getAutoFilledPin(): Promise<string> {
    return this.pinInput.inputValue();
  }

  async submitReset(pin: string, newPassword: string, confirmPassword: string) {
    await this.pinInput.fill(pin);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.updatePasswordButton.click();
  }
}
