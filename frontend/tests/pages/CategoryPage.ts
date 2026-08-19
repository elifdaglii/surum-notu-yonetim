import { Page, Locator } from '@playwright/test';

export class CategoryPage {
  readonly page: Page;
  readonly categoriesTab: Locator;
  readonly categoryNameInput: Locator;
  readonly addCategoryButton: Locator;
  readonly categoryFormError: Locator;
  // CategoryService.delete() -> CategoryInUseException mesajı (backend, ASCII):
  // "Bu kategoriye bagli N surum notu var, once onlari baska bir kategoriye tasiyin veya silin"
  readonly categoryDeleteError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categoriesTab = page.getByRole('button', { name: 'Kategoriler' });
    this.categoryNameInput = page.getByRole('textbox', { name: 'KATEGORİ ADI' });
    this.addCategoryButton = page.getByRole('button', { name: 'Kategori Ekle' });
    this.categoryFormError = page.getByText('Kategori oluşturulamadı. Kategori adını kontrol edin');
    this.categoryDeleteError = page.getByText(/Bu kategoriye bagli \d+ surum notu var/);
  }

  // AdminPage.tsx: ADMIN girişinde varsayılan tab "releaseNotes" - buraya gelince
  // sidebar'dan "Kategoriler" tab'ına geçiyoruz.
  async goto() {
    await this.page.goto('/');
    await this.categoriesTab.click();
  }

  async addCategory(name: string) {
    await this.categoryNameInput.fill(name);
    await this.addCategoryButton.click();
  }

  // Kategoriler tablosundaki <td> hücresi (Table gerçek <table>/<td> render ediyor,
  // bkz. ui/table.tsx) - kategori adının listede göründüğünü doğrulamak için.
  categoryRow(name: string): Locator {
    return this.page.getByRole('cell', { name, exact: true });
  }

  // AdminPage.tsx: aria-label={`${c.name} kategorisini sil`}
  deleteButton(name: string): Locator {
    return this.page.getByRole('button', { name: `${name} kategorisini sil` });
  }

  // handleDeleteCategory() önce window.confirm(...) native tarayıcı dialog'unu
  // gösteriyor - onaylanmazsa delete isteği hiç atılmıyor. Playwright dialog'ları
  // varsayılan olarak otomatik reddettiği için burada açıkça accept ediyoruz.
  async deleteCategory(name: string) {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteButton(name).click();
  }
}
