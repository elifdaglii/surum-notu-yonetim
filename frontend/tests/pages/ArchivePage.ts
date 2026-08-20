import { Page, Locator } from '@playwright/test';

// Kategori filtre pilleri (release-notes-archive.tsx) hem HomePage'de hem AdminPage'in
// "Sürüm Notları" tab'ında aynı ReleaseNotesArchive component'i üzerinden görünüyor -
// kategori yönetiminden ayrı bir kaygı olduğu için CategoryPage.ts'e değil, kendi
// dosyasına koydum.
export class ArchivePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly filtersButton: Locator;
  // "Sıralama" bölümündeki iki yön butonu - popover her zaman render ediyor (authors/months
  // gibi veriye bağlı koşullu değil), bu yüzden "popover açık mı" kontrolü için de kullanılabilir.
  readonly sortDescButton: Locator;
  readonly sortAscButton: Locator;
  // "Yazan" Select'inin tetikleyici butonu - Radix Select.Root DOM'a hiçbir şey basmıyor,
  // bu yüzden SelectTrigger (bir <button>) doğrudan "Yazan" span'ının bir sonraki kardeşi
  // oluyor. Aynı yaklaşım ReleaseNoteFormPage.previewPanel'de de kullanılıyor.
  readonly authorFilterTrigger: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Sürüm notlarında ara...');
    this.filtersButton = page.getByRole('button', { name: /Filtreler/ });
    this.sortDescButton = page.getByRole('button', { name: 'Yeni → Eski' });
    this.sortAscButton = page.getByRole('button', { name: 'Eski → Yeni' });
    this.authorFilterTrigger = page.locator('span:text-is("Yazan") + button');
    // release-notes-archive.tsx: notes.length > 0 && filteredNotes.length === 0 durumunda
    // gösterilen mesaj (notes tamamen boşsa farklı bir mesaj çıkıyor, o burada değil).
    this.noResultsMessage = page.getByText('Bu filtreye uyan sürüm notu bulunamadı.');
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

  // Kart grid'i: her kart release-notes-archive.tsx'te <Card role="button"> olarak render
  // ediliyor ve shadcn'in Card component'i data-slot="card" basıyor - Tailwind grid
  // class'larıyla (kırılgan, arbitrary-value içeriyor) eşleştirmek yerine bunu kullanıyoruz.
  // DOM sırası = o an ekrandaki sıralama (filteredNotes.map sırası), bu yüzden sıralama
  // testlerinde doğrudan güvenilir bir kaynak.
  get cards(): Locator {
    return this.page.locator('[data-slot="card"]');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.fill('');
  }

  // Popover zaten açıksa tekrar tıklamak onu kapatır (Radix toggle davranışı) - "Sıralama"
  // her zaman render edildiği için sortDescButton'ın görünürlüğünü "açık mı" göstergesi
  // olarak kullanıp gereksiz kapatmayı önlüyoruz.
  async openFilters() {
    const alreadyOpen = await this.sortDescButton.isVisible().catch(() => false);
    if (!alreadyOpen) {
      await this.filtersButton.click();
    }
  }

  async setSortAscending() {
    await this.openFilters();
    await this.sortAscButton.click();
    await this.page.keyboard.press('Escape');
  }

  async setSortDescending() {
    await this.openFilters();
    await this.sortDescButton.click();
    await this.page.keyboard.press('Escape');
  }

  async filterByAuthor(username: string) {
    await this.openFilters();
    await this.authorFilterTrigger.click();
    await this.page.getByRole('option', { name: username, exact: true }).click();
    await this.page.keyboard.press('Escape');
  }

  // Kartın sağ üst köşesindeki PDF/HTML indirme ikonları (aria-label'lı) - kartın kendisi
  // de role="button" olduğu için (detay modalını açan tıklama alanı), doğru butonu bulmak
  // adına önce version metnini içeren KARTA daralıyoruz, sonra içindeki aria-label'a göre
  // arıyoruz. release-notes-archive.tsx: handleDownloadPdf/handleDownloadHtml.
  pdfDownloadButton(version: string): Locator {
    return this.cards.filter({ hasText: version }).getByRole('button', { name: 'PDF indir' });
  }

  htmlDownloadButton(version: string): Locator {
    return this.cards.filter({ hasText: version }).getByRole('button', { name: 'HTML indir' });
  }
}
