// Sürüm notu oluşturan testlerde sabit versiyon numarası kullanmak, art arda
// çalıştırmalarda veritabanında aynı versiyondan birikmesine ve buna bağlı
// locator'ların strict-mode ihlaline (birden fazla eşleşme) yol açıyor.
// Format add-release-note-dialog.tsx'teki VERSION_PATTERN (/^v\d+\.\d+\.\d+$/)
// ile uyumlu kalmalı - bu yüzden her çağrıda benzersiz bir vX.X.X üretiyoruz.
//
// ÖNEMLİ: majör versiyon HER ZAMAN sabit "999" - sürüm notlarında "pwtest_" öneki
// alabilecek bir başlık alanı yok ve versiyon alanı vX.X.X formatına zorlanıyor, bu
// yüzden testlerin oluşturduğu sürüm notlarını gerçek verilerden ayırt eden işaret
// bu majör versiyon (backend/scripts/cleanup_test_data.sql "v999.%" desenini arıyor).
// Gerçek bir sürüm notu için asla v999.x.x kullanma; bu majör versiyon testler için
// ayrılmış. (Önceden "9" idi - gerçek verilerde v8.8.8 olduğu için çakışmaya fazla yakındı.)
export function uniqueVersion(): string {
  const minor = Date.now() % 1000;
  const patch = Math.floor(Math.random() * 1000);
  return `v999.${minor}.${patch}`;
}

// Testlerin oluşturduğu HER kullanıcı adı bu fonksiyondan geçmeli - "pwtest_" öneki,
// backend/scripts/cleanup_test_data.sql'in gerçek kullanıcılardan (admin, Elif, vb.)
// ayırt edebilmesi için gereken tek tutarlı işaret. `label`, aynı dosyadaki farklı
// senaryoları (ör. "adminpanel", "duzenlenecek") birbirinden ayırt etmeye devam eder,
// sadece önek artık her yerde aynı.
export function uniqueTestUsername(label: string): string {
  return `pwtest_${label}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// addCategory() ile oluşturulan test kategorileri için aynı mantık - "pwtest_" öneki
// cleanup script'inin gerçek kategorilerden (Özellik, Hata Çözümü, ...) ayırt etmesini
// sağlıyor.
export function uniqueTestCategoryName(): string {
  return `pwtest_${Date.now()}`;
}
