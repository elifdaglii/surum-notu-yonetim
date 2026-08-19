// Sürüm notu oluşturan testlerde sabit versiyon numarası kullanmak, art arda
// çalıştırmalarda veritabanında aynı versiyondan birikmesine ve buna bağlı
// locator'ların strict-mode ihlaline (birden fazla eşleşme) yol açıyor.
// Format add-release-note-dialog.tsx'teki VERSION_PATTERN (/^v\d+\.\d+\.\d+$/)
// ile uyumlu kalmalı - bu yüzden her çağrıda benzersiz bir vX.X.X üretiyoruz.
export function uniqueVersion(): string {
  const minor = Date.now() % 1000;
  const patch = Math.floor(Math.random() * 1000);
  return `v9.${minor}.${patch}`;
}
