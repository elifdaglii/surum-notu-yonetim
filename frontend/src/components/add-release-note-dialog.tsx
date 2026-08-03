import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { fetchCategories } from "@/api/categories";
import { createReleaseNote, updateReleaseNote } from "@/api/releaseNotes";
import type { Category, ReleaseNote } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AddReleaseNoteDialogProps = {
  token: string;
  // Kaydetme/güncelleme başarılı olduğunda çağrılıyor - çağıran sayfa bunu
  // ReleaseNotesArchive'ı yenilemek (reloadSignal'i artırmak) için kullanıyor.
  onSaved?: () => void;
  // "create" (varsayılan): kendi "+ Yeni Sürüm Notu Ekle" tetikleyici butonunu render eder,
  // açık/kapalı state'ini kendi içinde tutar. "edit": tetikleyici butonu YOK, dışarıdan
  // (ReleaseNoteDetailDialog'daki "Düzenle" butonu) open/onOpenChange ile kontrol edilir
  // ve formu `note`nun mevcut değerleriyle önceden doldurur.
  mode?: "create" | "edit";
  note?: ReleaseNote;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// SemVer'in "v" önekli hali bekleniyor: v1.2.0, v0.10.3 gibi. Sadece major.minor.patch,
// pre-release/build metadata (v1.2.0-beta vs.) şimdilik desteklenmiyor.
const VERSION_PATTERN = /^v\d+\.\d+\.\d+$/;

const SUCCESS_MESSAGE_DURATION_MS = 4000;

function getTodayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * "+ Yeni Sürüm Notu Ekle" butonu + açtığı modal form. Hem HomePage (USER) hem
 * AdminPage (ADMIN) header'ında aynı şekilde kullanılıyor, bu yüzden tetikleyici
 * buton da bu component'in içinde - çağıran sayfa sadece token'ı geçiyor.
 *
 * Aynı form, `mode="edit"` ile ReleaseNotesArchive tarafından (detay modalındaki
 * "Düzenle" butonu üzerinden) dışarıdan kontrollü şekilde de açılıyor - ayrı bir
 * component yazmak yerine başlık/buton metni/istek (POST vs PUT) mode'a göre değişiyor.
 *
 * İçerik alanı sol/sağ split görünümde: solda ham Markdown textarea'sı, sağda
 * marked ile render edilip DOMPurify'dan geçirilmiş canlı önizleme (bkz. previewHtml).
 */
export function AddReleaseNoteDialog({
  token,
  onSaved,
  mode = "create",
  note,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AddReleaseNoteDialogProps) {
  const isEdit = mode === "edit";

  // "edit" modunda open/onOpenChange her zaman dışarıdan (ReleaseNotesArchive) geliyor;
  // "create" modunda kendi iç state'ini + tetikleyici butonunu kullanıyor.
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const [version, setVersion] = useState("");
  const [versionError, setVersionError] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState(getTodayDateInputValue);
  const [categoryId, setCategoryId] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // marked ham Markdown'ı HTML'e çeviriyor, DOMPurify o HTML'i innerHTML olarak
  // basmadan önce temizliyor (script tag'leri vs. çalıştırılmasın diye - SNYS-20).
  // İkisi de senkron çalışıyor, bu yüzden her tuş vuruşunda yeniden hesaplamak
  // (useMemo ile gereksiz tekrarları önleyerek) yeterli, ayrı bir debounce gerekmiyor.
  const previewHtml = useMemo(() => {
    if (contentMarkdown.trim() === "") {
      return "";
    }
    const rawHtml = marked.parse(contentMarkdown, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [contentMarkdown]);

  useEffect(() => {
    loadCategories();
  }, []);

  // "edit" modunda modal açıldığında formu düzenlenen notun mevcut değerleriyle doldur.
  useEffect(() => {
    if (open && isEdit && note) {
      setVersion(note.version);
      setVersionError(null);
      setReleaseDate(note.releaseDate);
      setCategoryId(note.category ? String(note.category.id) : "");
      setContentMarkdown(note.contentMarkdown);
      setSubmitError(null);
    }
  }, [open, isEdit, note]);

  // Başarı mesajı birkaç saniye sonra kendiliğinden kayboluyor (kapanan modalın
  // arkasında sonsuza kadar durmasın diye).
  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [successMessage]);

  async function loadCategories() {
    setLoadingCategories(true);
    setCategoryLoadError(null);
    try {
      setCategories(await fetchCategories(token));
    } catch (err) {
      setCategoryLoadError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoadingCategories(false);
    }
  }

  function resetForm() {
    setVersion("");
    setVersionError(null);
    setReleaseDate(getTodayDateInputValue());
    setCategoryId("");
    setContentMarkdown("");
    setSubmitError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setInternalOpen(nextOpen);
    setControlledOpen?.(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  // Boş/dokunulmamış alanda format hatası GÖSTERMİYORUZ - sadece kullanıcı bir şey
  // yazıp alandan çıktığında ya da kaydet'e bastığında. Bu önemli: Radix Dialog
  // açılışta ilk odaklanabilir elemana (bu input'a) otomatik focus veriyor; kullanıcı
  // hiç yazmadan başka bir alana geçerse input blur oluyor ve boş değerle çağrılıyor -
  // o durumda regex zaten eşleşmeyeceği için hatalı şekilde format hatası çıkıyordu.
  // Zorunluluk (boş bırakılamaz) kontrolü zaten native "required" attribute'unda var.
  function validateVersion(value: string): boolean {
    if (value.trim() === "") {
      setVersionError(null);
      return false;
    }
    const isValid = VERSION_PATTERN.test(value);
    setVersionError(isValid ? null : "Lütfen vX.X.X formatında yazın");
    return isValid;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isVersionValid = validateVersion(version);
    if (!isVersionValid) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const input = {
        version,
        releaseDate,
        categoryId: Number(categoryId),
        contentMarkdown,
      };

      if (isEdit) {
        await updateReleaseNote(token, note!.id, input);
      } else {
        await createReleaseNote(token, input);
      }

      const savedVersion = version;
      handleOpenChange(false);
      setSuccessMessage(isEdit ? `${savedVersion} güncellendi.` : `${savedVersion} sürüm notu kaydedildi.`);
      onSaved?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!isEdit && (
          <DialogTrigger asChild>
            <Button type="button">+ Yeni Sürüm Notu Ekle</Button>
          </DialogTrigger>
        )}

        {/* Varsayılan max-w-md (~448px) sol/sağ split editör+önizleme için çok dar -
            genişlik override'ı twMerge sayesinde (cn()) taban class'ın yerine geçiyor. */}
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Sürüm Notunu Düzenle" : "Yeni Sürüm Notu Ekle"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Sürüm notu bilgilerini güncelleyin." : "Yayınlanacak sürüm için bilgileri girin."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="release-version"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Sürüm Numarası
              </label>
              <Input
                id="release-version"
                type="text"
                placeholder="v1.2.0"
                value={version}
                onChange={(e) => {
                  setVersion(e.target.value);
                  if (versionError) {
                    setVersionError(null);
                  }
                }}
                onBlur={(e) => validateVersion(e.target.value)}
                aria-invalid={versionError !== null}
                required
              />
              {versionError && <p className="text-xs text-destructive">{versionError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="release-date"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Yayınlanma Tarihi
              </label>
              <Input
                id="release-date"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="release-category"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Kategori
              </label>
              <select
                id="release-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories || categories.length === 0}
                required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="" disabled>
                  {loadingCategories ? "Yükleniyor..." : "Kategori seçin"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoryLoadError && (
                <p className="text-xs text-destructive">{categoryLoadError}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="release-content"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                İçerik
              </label>
              {/* Sol/sağ split - üst üste DEĞİL. Sol: ham Markdown yazılan düz textarea
                  (syntax highlighting yok, bilinçli olarak). Sağ: marked + DOMPurify ile
                  her tuş vuruşunda yeniden hesaplanan canlı önizleme (bkz. previewHtml). */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Yaz</span>
                  <textarea
                    id="release-content"
                    value={contentMarkdown}
                    onChange={(e) => setContentMarkdown(e.target.value)}
                    required
                    rows={10}
                    className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Önizleme</span>
                  <div
                    className="h-[15.25rem] overflow-y-auto rounded-lg border border-input bg-muted/30 p-2.5 text-sm [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:mb-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                  >
                    {previewHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <p className="text-muted-foreground">Yazdıkça önizleme burada görünecek...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  İptal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || loadingCategories || categories.length === 0}>
                {submitting ? (isEdit ? "Güncelleniyor..." : "Kaydediliyor...") : isEdit ? "Güncelle" : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {successMessage && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm text-card-foreground ring-1 ring-foreground/10 shadow-lg"
        >
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
          {successMessage}
        </div>
      )}
    </>
  );
}
