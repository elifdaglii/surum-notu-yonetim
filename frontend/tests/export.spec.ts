import { test, expect, Download } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from './pages/LoginPage';
import { ArchivePage } from './pages/ArchivePage';
import { ReleaseNoteFormPage } from './pages/ReleaseNoteFormPage';
import { uniqueVersion } from './utils/testData';

// download.path() Playwright'ın kendi yönettiği, testler arasında otomatik temizlenen
// geçici dosya konumunu döner (Chromium/Firefox/WebKit'te, remote olmayan bağlamlarda
// desteklenir - bkz. playwright.config.ts, tek proje "chromium"). Kendi scratch dizinimizi
// yönetmek yerine bunu kullanmak, testin hangi makinede çalışırsa çalışsın taşınabilir
// kalmasını sağlıyor.
async function downloadedFilePath(download: Download): Promise<string> {
  const filePath = await download.path();
  if (!filePath) {
    throw new Error('İndirilen dosyanın yolu alınamadı (download.path() null döndü)');
  }
  return filePath;
}

test.describe('Sürüm Notu Dışa Aktarma (PDF/HTML)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Elif', 'TestSifre123');
  });

  test('normal içerik PDF export', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();

    await formPage.createReleaseNote(version, 'Özellik', '## PDF export testi\n\nBu bir deneme içeriğidir.');
    await expect(formPage.noteCard(version)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.pdfDownloadButton(version).click(),
    ]);

    const filePath = await downloadedFilePath(download);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('normal içerik HTML export', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();

    await formPage.createReleaseNote(version, 'Özellik', '## HTML export testi\n\nBu bir deneme içeriğidir.');
    await expect(formPage.noteCard(version)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.htmlDownloadButton(version).click(),
    ]);

    const filePath = await downloadedFilePath(download);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });

  // NOT: Playwright bir PDF'in görsel sayfa düzenini (satırların/paragrafların fiziksel
  // sayfa sınırını taşıp taşmadığını) inceleyemiyor - PDF ikili bir format, DOM/erişilebilirlik
  // ağacı yok. Bu test bu yüzden yalnızca "uzun içerikle export hatasız tamamlanıyor ve
  // boş olmayan bir PDF üretiliyor" seviyesinde kalıyor; sayfa taşması/kırılma noktalarının
  // gerçekten doğru olduğu görsel bir inceleme (ör. üretilen PDF'i elle açıp bakmak) gerektirir.
  test('uzun içerikte sayfa taşması olmamalı', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();

    const longContent = [
      '## Uzun İçerik Testi',
      'Bu paragraf, PDF export sırasında birden fazla sayfaya yayılmasını sağlayacak kadar uzun tutuldu. '.repeat(6),
      'İkinci paragraf da benzer uzunlukta - gerçek dünyadaki kapsamlı bir sürüm notuna yakın bir senaryo oluşturuyor. '.repeat(6),
      'Üçüncü paragraf, içerik sayfa sonu civarında bölünürken bir hataya yol açmadığından emin olmak için ekleniyor. '.repeat(6),
      'Dördüncü ve son paragraf, toplam içeriği iyice uzatıp gerçek bir sayfa taşması senaryosunu tetikliyor. '.repeat(6),
    ].join('\n\n');

    await formPage.createReleaseNote(version, 'Özellik', longContent);
    await expect(formPage.noteCard(version)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.pdfDownloadButton(version).click(),
    ]);

    const filePath = await downloadedFilePath(download);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('Türkçe karakter export', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();
    const turkishMarker = 'şğıöüç ŞĞİÖÜÇ Türkçe karakter testi';
    const content = `## Türkçe Karakter Testi\n\n${turkishMarker} içeren bir paragraf.`;

    await formPage.createReleaseNote(version, 'Özellik', content);
    await expect(formPage.noteCard(version)).toBeVisible();

    // PDF: ikili format olduğu için içeriği metin olarak okuyup karşılaştıramıyoruz -
    // sadece dosyanın Türkçe karakterli içerikle de hatasız/boş olmayan şekilde üretildiğini
    // doğruluyoruz.
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.pdfDownloadButton(version).click(),
    ]);
    const pdfPath = await downloadedFilePath(pdfDownload);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);

    // HTML: düz metin (UTF-8) olduğu için dosyayı okuyup Türkçe karakterlerin mojibake
    // olmadan (ör. "ş" -> "Å" gibi bozulma olmadan) aynen geçtiğini doğrulayabiliyoruz.
    const [htmlDownload] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.htmlDownloadButton(version).click(),
    ]);
    const htmlPath = await downloadedFilePath(htmlDownload);
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    expect(htmlContent).toContain(turkishMarker);
  });

  test('dosya adı/uzantısı doğru', async ({ page }) => {
    const archivePage = new ArchivePage(page);
    const formPage = new ReleaseNoteFormPage(page);
    const version = uniqueVersion();

    await formPage.createReleaseNote(version, 'Özellik', '## dosya adı testi');
    await expect(formPage.noteCard(version)).toBeVisible();

    // releaseNotes.ts: triggerBrowserDownload(blob, `surum-notu-${version}.pdf|html`) -
    // dosya adını backend'in Content-Disposition header'ı değil, frontend'in kendi
    // ürettiği `download` attribute'u belirliyor (bkz. api/releaseNotes.ts yorumu).
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.pdfDownloadButton(version).click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toBe(`surum-notu-${version}.pdf`);

    const [htmlDownload] = await Promise.all([
      page.waitForEvent('download'),
      archivePage.htmlDownloadButton(version).click(),
    ]);
    expect(htmlDownload.suggestedFilename()).toBe(`surum-notu-${version}.html`);
  });
});
