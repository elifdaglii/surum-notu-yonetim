import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Playwright, testDir altındaki TÜM proje/worker'lar bittikten sonra bunu BİR KEZ
// çalıştırır (bkz. playwright.config.ts globalTeardown ve
// https://playwright.dev/docs/test-configuration#global-setup-and-teardown).
// Amaç: testlerin oluşturduğu "pwtest_" önekli kullanıcı/kategori kayıtlarını ve
// "v999." versiyonlu sürüm notlarını, backend/scripts/cleanup_test_data.sql'deki AYNI
// sorguyla otomatik temizlemek - böylece her `npx playwright test` sonrası elle
// temizlik yapmaya gerek kalmıyor.
//
// Postgres bu projede Docker container'ında çalışıyor (bkz. `docker ps` ->
// postgres-surumnotu) - o yüzden sorguyu doğrudan container içindeki psql'e stdin
// üzerinden gönderiyoruz (dosya host'ta olduğu için `-f` yerine input kullanıyoruz,
// container'ın kendi dosya sistemine host yolunu veremeyiz). Container bu isimle
// YOKSA (ör. Postgres native kurulup farklı çalıştırılırsa) temizlik atlanır ve
// sadece bir uyarı basılır - burada ASLA throw etmiyoruz, çünkü bir temizlik
// hatasının test SONUÇLARINI (zaten tamamlanmış suite'i) etkilemesini istemiyoruz.
const CONTAINER_NAME = 'postgres-surumnotu';
const DB_NAME = 'surumnotu';
const DB_USER = 'postgres';

export default function globalTeardown(): void {
  const sqlPath = path.resolve(import.meta.dirname, '../../backend/scripts/cleanup_test_data.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    execFileSync(
      'docker',
      ['exec', '-i', CONTAINER_NAME, 'psql', '-U', DB_USER, '-d', DB_NAME, '-v', 'ON_ERROR_STOP=1'],
      { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
    );
    console.log('[global-teardown] Test verisi temizlendi (pwtest_ önekli kullanıcı/kategoriler ve v999. sürüm notları silindi).');
  } catch (error) {
    console.warn(
      `[global-teardown] Test verisi temizliği atlandı - "${CONTAINER_NAME}" adlı Docker ` +
        `container'ına ulaşılamadı ya da psql hata verdi. Elle temizlemek için: ` +
        `backend/scripts/cleanup_test_data.sql. Hata: ${(error as Error).message}`,
    );
  }
}
