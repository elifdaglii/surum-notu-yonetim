import { Page, Locator } from '@playwright/test';

type UserRole = 'ADMIN' | 'USER';

// AdminPage.tsx: "Kullanıcılar" sekmesindeki liste + "Yeni Kullanıcı Ekle" formu (her
// zaman görünür, modal değil) + EditUserDialog (ayrı bir modal) burada yönetiliyor.
// Sidebar'daki çıkış akışı da (senaryo 5 - USER olarak tekrar giriş yapabilmek için)
// burada, çünkü sidebar sadece admin panelinde var.
export class AdminPanelPage {
  readonly page: Page;
  readonly usersTab: Locator;

  // "Yeni Kullanıcı Ekle" formu.
  readonly newUsernameInput: Locator;
  readonly newPasswordInput: Locator;
  readonly newRoleSelect: Locator;
  readonly addUserButton: Locator;
  // UserManagementService.deleteUser(): son ADMIN korumasına takılınca api/admin.ts'in
  // ürettiği sabit mesaj.
  readonly userDeleteError: Locator;

  // EditUserDialog (modal). "KULLANICI ADI"/"ROL" etiketleri "Yeni Kullanıcı Ekle"
  // formuyla AYNI metni kullanıyor ve o form modal açıkken de arka planda DOM'da kalmaya
  // devam ediyor - bu yüzden strict-mode ihlaline düşmemek için Radix'in dialog role'üne
  // (aria-labelledby -> DialogTitle "Kullanıcıyı Düzenle") daraltıyoruz. "YENİ ŞİFRE"
  // etiketi zaten benzersiz olduğu için onu daraltmaya gerek yok ama tutarlılık için
  // aynı şekilde scoplandı.
  readonly editUserDialog: Locator;
  readonly editUsernameInput: Locator;
  readonly editPasswordInput: Locator;
  readonly editRoleSelect: Locator;
  readonly saveEditButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usersTab = page.getByRole('button', { name: 'Kullanıcılar' });

    this.newUsernameInput = page.getByRole('textbox', { name: 'KULLANICI ADI' });
    this.newPasswordInput = page.getByRole('textbox', { name: 'ŞİFRE' });
    this.newRoleSelect = page.getByRole('combobox', { name: 'ROL' });
    this.addUserButton = page.getByRole('button', { name: 'Kullanıcı Ekle' });
    this.userDeleteError = page.getByText('Sistemde en az bir ADMIN kalmalı, bu kullanıcı silinemez');

    this.editUserDialog = page.getByRole('dialog', { name: 'Kullanıcıyı Düzenle' });
    this.editUsernameInput = this.editUserDialog.getByRole('textbox', { name: 'KULLANICI ADI' });
    this.editPasswordInput = this.editUserDialog.getByRole('textbox', { name: 'YENİ ŞİFRE' });
    this.editRoleSelect = this.editUserDialog.getByRole('combobox', { name: 'ROL' });
    this.saveEditButton = this.editUserDialog.getByRole('button', { name: 'Kaydet' });
  }

  async goto() {
    await this.page.goto('/');
    await this.usersTab.click();
  }

  private async selectRole(trigger: Locator, role: UserRole) {
    await trigger.click();
    await this.page.getByRole('option', { name: role, exact: true }).click();
  }

  async addUser(username: string, password: string, role: UserRole = 'USER') {
    await this.newUsernameInput.fill(username);
    await this.newPasswordInput.fill(password);
    await this.selectRole(this.newRoleSelect, role);
    await this.addUserButton.click();
  }

  // Table gerçek <table>/<tr> render ediyor (bkz. ui/table.tsx) - kullanıcı adı VE rol
  // rozetini aynı satırda birlikte kontrol edebilmek için hücre değil, tüm satırı
  // (CategoryPage.categoryRow'dan farklı olarak) döndürüyoruz.
  userRow(username: string): Locator {
    return this.page.getByRole('row').filter({ hasText: username });
  }

  // AdminPage.tsx: aria-label={`${u.username} kullanıcısını düzenle` / `${u.username} kullanıcısını sil`}
  editButton(username: string): Locator {
    return this.page.getByRole('button', { name: `${username} kullanıcısını düzenle` });
  }

  deleteButton(username: string): Locator {
    return this.page.getByRole('button', { name: `${username} kullanıcısını sil` });
  }

  async openEditDialog(username: string) {
    await this.editButton(username).click();
  }

  async selectEditRole(role: UserRole) {
    await this.selectRole(this.editRoleSelect, role);
  }

  // handleDeleteUser() önce window.confirm(...) native dialog'unu gösteriyor (bkz.
  // AdminPage.tsx) - CategoryPage.deleteCategory()'deki aynı desen: Playwright dialog'ları
  // varsayılan olarak reddettiği için açıkça accept ediyoruz.
  async deleteUser(username: string) {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteButton(username).click();
  }

  // AdminSidebar: alt kısımdaki kullanıcı bloğu (avatar + ad + "Admin" rol etiketi)
  // tıklanınca "Çıkış Yap" seçeneğini içeren bir dropdown açıyor. Erişilebilir isim
  // avatar baş harfi + kullanıcı adı + "Admin" birleşimi olduğu için (ör. "E Elif Admin")
  // sondaki sabit "Admin" etiketiyle eşleştiriyoruz - hangi admin giriş yapmış olursa olsun
  // çalışır, USER için bu sidebar/blok hiç yok zaten (bkz. HomePage.tsx).
  async logout() {
    await this.page.getByRole('button', { name: /Admin$/ }).click();
    await this.page.getByRole('menuitem', { name: 'Çıkış Yap' }).click();
  }
}
