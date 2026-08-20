import { Page, Locator } from "@playwright/test";

export class ReleaseNoteFormPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly versionInput: Locator;
  readonly dateInput: Locator;
  readonly categoryDropdown: Locator;
  readonly contentInput: Locator;
  readonly saveButton: Locator;
  readonly versionErrorMessage: Locator;
  readonly previewPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole("button", {
      name: "+ Yeni Sürüm Notu Ekle",
    });
    this.versionInput = page.getByRole("textbox", { name: "SÜRÜM NUMARASI" });
    // <input type="date">, label'a htmlFor="release-date" ile bağlı - varsayılanı bugünün
    // tarihi (bkz. add-release-note-dialog.tsx getTodayDateInputValue).
    this.dateInput = page.getByLabel("YAYINLANMA TARİHİ");
    this.categoryDropdown = page.getByRole("combobox", { name: "KATEGORİ" });
    this.contentInput = page.getByRole("textbox", { name: "İÇERİK" });
    this.saveButton = page.getByRole("button", { name: "Kaydet" });
    // add-release-note-dialog.tsx: validateVersion() -> setVersionError(...) mesajı
    this.versionErrorMessage = page.getByText("Lütfen vX.X.X formatında yazın");
    // "Önizleme" etiketinin hemen altındaki div - marked.parse() + DOMPurify.sanitize()
    // çıktısının dangerouslySetInnerHTML ile basıldığı canlı önizleme paneli
    // (bkz. add-release-note-dialog.tsx previewHtml).
    this.previewPanel = page.locator('span:text-is("Önizleme") + div');
  }

  async goto() {
    await this.page.goto("/");
  }

  async openForm() {
    await this.addButton.click();
  }

  async selectCategory(categoryName: string) {
    await this.categoryDropdown.click();
    await this.page.getByRole("option", { name: categoryName }).click();
  }

  // releaseDate verilmezse form varsayılanı olan "bugün" kullanılır. "yyyy-MM-dd" formatında
  // beklenir (input type="date" ile uyumlu) - arşivdeki sıralama testlerinde birbirinden
  // farklı, kontrollü tarihli notlar oluşturmak için kullanılıyor.
  async createReleaseNote(
    version: string,
    categoryName: string,
    content: string,
    releaseDate?: string,
  ) {
    await this.openForm();
    await this.versionInput.fill(version);
    if (releaseDate) {
      await this.dateInput.fill(releaseDate);
    }
    await this.selectCategory(categoryName);
    await this.contentInput.fill(content);
    await this.saveButton.click();
  }

  // Kategori bilerek seçilmiyor - KATEGORİ select'i native "required" attribute'una
  // sahip (bkz. add-release-note-dialog.tsx), bu yüzden tarayıcı formu hiç submit
  // etmiyor: handleSubmit hiç çalışmıyor, dialog açık kalıyor, kayıt oluşmuyor.
  async submitWithoutCategory(version: string, content: string) {
    await this.openForm();
    await this.versionInput.fill(version);
    await this.contentInput.fill(content);
    await this.saveButton.click();
  }

  // Arşivdeki kart: release-notes-archive.tsx'te <Card role="button"> olarak render
  // ediliyor, versiyon metnini içeriyor. Kaydetme sonrası ekrandaki geçici "başarı"
  // toast'ı (role="status") da aynı metni içerdiği için (ve toast'ın DOM'a ne zaman
  // girip çıktığı zamanlamaya bağlı olduğu için) role="button" ile daraltmak, toast'la
  // karışmayı zamanlama gerektirmeden kalıcı olarak önlüyor.
  noteCard(version: string): Locator {
    return this.page.getByRole("button").filter({ hasText: version });
  }
}
