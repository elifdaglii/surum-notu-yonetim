-- Playwright testlerinin oluşturduğu verileri temizler.
-- SADECE aşağıdaki işaretlerle eşleşen kayıtları siler - gerçek veriye (admin hesabı,
-- Elif/Emre/furkan/test2 gibi gerçek kullanıcılar, Özellik/Hata Çözümü/Backend/Altyapı
-- gibi gerçek kategoriler, gerçek sürüm notları) DOKUNMAZ.
--
-- Silme sırası release_notes -> categories -> users: release_notes hem category_id hem
-- created_by'a FK ile bağlı (ON DELETE CASCADE YOK, bkz. entity/ReleaseNote.java), bu
-- yüzden önce onları temizlemeden categories/users'tan silmeye çalışmak FK ihlaline
-- (constraint violation) çarpar.
--
-- Test verisi işaretleri (hepsi frontend/tests/utils/testData.ts'ten gelir):
--   - Kullanıcı adları: "pwtest_" ile BAŞLAYAN (uniqueTestUsername()).
--   - Kategori adları: "pwtest_" ile BAŞLAYAN (uniqueTestCategoryName()).
--   - Sürüm notları: versiyonu "v999." ile başlayan (uniqueVersion()). Sürüm notunda
--     önek alabilecek bir başlık alanı yok ve versiyon vX.X.X formatına zorlanıyor, bu
--     yüzden işaret testlere ayrılmış 999 majör versiyonu. Ayrıca pwtest_ kullanıcısının
--     yazdığı ya da pwtest_ kategorisine bağlı notlar da silinir (yoksa o kullanıcı/
--     kategori FK yüzünden silinemez).
--
-- LIKE içinde "_" tek karakter joker'idir - 'pwtest\_%' ESCAPE '\' ile gerçek alt çizgi
-- aranıyor, yani "pwtestX..." gibi bir isim EŞLEŞMEZ.
--
-- Çalıştırma (Postgres bu projede Docker container'ında çalışıyor, bkz. `docker ps` ->
-- postgres-surumnotu):
--   docker exec -i postgres-surumnotu psql -U postgres -d surumnotu -v ON_ERROR_STOP=1 < backend/scripts/cleanup_test_data.sql
--
-- Bu script frontend/tests/global-teardown.ts tarafından her Playwright suite'i
-- bittiğinde otomatik de çalıştırılıyor - elle çalıştırmak sadece opsiyonel/manuel
-- bir temizlik istediğinde gerekir.

BEGIN;

DELETE FROM release_notes
WHERE version LIKE 'v999.%'
   OR created_by IN (
        SELECT id FROM users
        WHERE username LIKE 'pwtest\_%' ESCAPE '\'
      )
   OR category_id IN (
        SELECT id FROM categories
        WHERE name LIKE 'pwtest\_%' ESCAPE '\'
      );

DELETE FROM categories
WHERE name LIKE 'pwtest\_%' ESCAPE '\';

DELETE FROM users
WHERE username LIKE 'pwtest\_%' ESCAPE '\';

COMMIT;
