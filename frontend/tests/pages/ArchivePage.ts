import { Page, Locator } from '@playwright/test';

// Kategori filtre pilleri (release-notes-archive.tsx) hem HomePage'de hem AdminPage'in
// "Sürüm Notları" tab'ında aynı ReleaseNotesArchive component'i üzerinden görünüyor -
// kategori yönetiminden ayrı bir kaygı olduğu için CategoryPage.ts'e değil, kendi
// dosyasına koydum.
export class ArchivePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  // Her kategori için ayrı bir filtre pili (<button onClick={() => setActiveFilter(...)}>),
  // tıklanınca not listesi client-side (activeFilter state'i) filtreleniyor.
  filterPill(categoryName: string): Locator {
    return this.page.getByRole('button', { name: categoryName, exact: true });
  }

  async filterByCategory(categoryName: string) {
    await this.filterPill(categoryName).click();
  }
}
