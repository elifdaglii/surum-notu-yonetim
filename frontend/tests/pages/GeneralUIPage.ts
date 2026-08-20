import { Page, Locator } from '@playwright/test';

// ThemeToggle (theme-toggle.tsx) hem AdminSidebar'da hem HomePage header'ında aynı
// component olarak kullanılıyor - ADMIN'e ya da USER'a özgü bir Page Object'e değil,
// hangi sayfada olursak olalım geçerli olan bu genel dosyaya ait. Logout, AdminPanelPage
// içinde zaten (sidebar'daki kullanıcı bloğu üzerinden) implemente edildiği için burada
// tekrarlanmadı - security-ui.spec.ts onu doğrudan AdminPanelPage'den kullanıyor.
export class GeneralUIPage {
  readonly page: Page;
  readonly themeToggleButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // theme-toggle.tsx: <span className="sr-only">Temayı değiştir</span> - erişilebilir isim.
    this.themeToggleButton = page.getByRole('button', { name: 'Temayı değiştir' });
  }

  async toggleTheme() {
    await this.themeToggleButton.click();
  }

  // theme-provider.tsx: attribute="class" -> next-themes çözümlenen temayı doğrudan
  // <html> etiketinin class'ına yazıyor (ör. <html class="dark">).
  async isDarkMode(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.classList.contains('dark'));
  }

  // next-themes'e özel bir storageKey verilmediği için (bkz. theme-provider.tsx)
  // varsayılan "theme" anahtarı localStorage'da kullanılıyor.
  async storedTheme(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('theme'));
  }
}
