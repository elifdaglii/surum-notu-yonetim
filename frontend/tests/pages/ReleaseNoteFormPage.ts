import { Page, Locator } from "@playwright/test";

export class ReleaseNoteFormPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly versionInput: Locator;
  readonly categoryDropdown: Locator;
  readonly contentInput: Locator;
  readonly saveButton: Locator;
  readonly versionErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole("button", {
      name: "+ Yeni Sürüm Notu Ekle",
    });
    this.versionInput = page.getByRole("textbox", { name: "SÜRÜM NUMARASI" });
    this.categoryDropdown = page.getByRole("combobox", { name: "KATEGORİ" });
    this.contentInput = page.getByRole("textbox", { name: "İÇERİK" });
    this.saveButton = page.getByRole("button", { name: "Kaydet" });
    // add-release-note-dialog.tsx: validateVersion() -> setVersionError(...) mesajı
    this.versionErrorMessage = page.getByText("Lütfen vX.X.X formatında yazın");
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

  async createReleaseNote(
    version: string,
    categoryName: string,
    content: string,
  ) {
    await this.openForm();
    await this.versionInput.fill(version);
    await this.selectCategory(categoryName);
    await this.contentInput.fill(content);
    await this.saveButton.click();
  }
}
