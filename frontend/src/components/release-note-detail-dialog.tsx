import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { deleteReleaseNote } from "@/api/releaseNotes";
import { getCategoryColor, formatReleaseDate } from "@/lib/release-notes";
import type { ReleaseNote } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReleaseNoteDetailDialogProps = {
  token: string;
  // null iken modal kapalı sayılır (open=false olduğunda içerik zaten render edilmiyor,
  // bu sadece kapanış animasyonu sırasında undefined erişimini önlüyor).
  note: ReleaseNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // true ise Düzenle/Sil butonları görünür: ADMIN her zaman, USER sadece bu notun
  // sahibiyse (bkz. ReleaseNotesArchive - role === "ADMIN" || note.createdByUsername
  // === currentUsername). Backend PUT/DELETE'te aynı kuralı zaten uyguluyor, burada
  // sadece yetkisiz kullanıcıya 403 ile sonuçlanacak butonlar gösterilmesin diye
  // aynı mantığı tekrarlıyoruz.
  canManage: boolean;
  // "Düzenle"ye basılınca çağrılıyor - çağıran taraf (ReleaseNotesArchive) bu modalı
  // kapatıp AddReleaseNoteDialog'u edit modunda bu notla açıyor.
  onEditRequested: (note: ReleaseNote) => void;
  // Silme başarılı olduğunda çağrılıyor - çağıran taraf arşiv listesini yeniden çekiyor.
  onDeleted: () => void;
};

const SUCCESS_MESSAGE_DURATION_MS = 4000;

/**
 * Karta tıklayınca açılan sürüm notu detay modalı: tam içerik (markdown render edilmiş
 * hâliyle) + yetkili kullanıcı için (ADMIN ya da notun sahibi) Düzenle/Sil aksiyonları.
 * "Sil" tek tıkla silmiyor, ayrı küçük bir onay dialog'u açıyor (gerçek versiyon
 * numarasını göstererek).
 */
export function ReleaseNoteDetailDialog({
  token,
  note,
  open,
  onOpenChange,
  canManage,
  onEditRequested,
  onDeleted,
}: ReleaseNoteDetailDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Detay modalı her kapandığında onay dialog'u ve hata state'i sıfırlansın - bir
  // sonraki açılışta (farklı bir nota) eski state sızmasın.
  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setDeleteError(null);
    }
  }, [open]);

  // Başarı mesajı birkaç saniye sonra kendiliğinden kayboluyor (add-release-note-dialog
  // ile aynı desen).
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const previewHtml = useMemo(() => {
    if (!note || note.contentMarkdown.trim() === "") return "";
    const rawHtml = marked.parse(note.contentMarkdown, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [note]);

  async function handleConfirmDelete() {
    if (!note) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteReleaseNote(token, note.id);
      const deletedVersion = note.version;
      setConfirmOpen(false);
      onOpenChange(false);
      setSuccessMessage(`${deletedVersion} silindi.`);
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          {note && (
            <>
              <DialogHeader>
                <DialogTitle>{note.version}</DialogTitle>
                <DialogDescription>{formatReleaseDate(note.releaseDate)}</DialogDescription>
              </DialogHeader>

              {note.category && (
                <div>
                  <Badge variant="outline" className={getCategoryColor(note.category.name).badgeClassName}>
                    {note.category.name}
                  </Badge>
                </div>
              )}

              <div className="max-h-[22rem] overflow-y-auto rounded-lg border border-input bg-muted/30 p-3 text-sm [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:mb-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                {previewHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <p className="text-muted-foreground">İçerik yok.</p>
                )}
              </div>

              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

              {canManage && (
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onEditRequested(note)}>
                    <Pencil className="size-4" />
                    Düzenle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
                    <Trash2 className="size-4" />
                    Sil
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Silme onayı - ayrı, küçük bir dialog. Radix nested dialog'ları destekliyor,
          bu yüzden detay modalının üzerinde açılabiliyor. Kırmızı SADECE "Evet, Sil"
          butonunda - genel tema (near-black, violet, rounded-lg) burada da korunuyor. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sürüm notunu sil</DialogTitle>
            <DialogDescription>
              {note && <span className="font-semibold text-foreground">{note.version}</span>}
              {note && " "}
              sürüm notunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Vazgeç
            </Button>
            {/* Not: token tablosundaki --destructive koyu temada AÇIK somon tonuna dönüyor
                (sadece hover/metin rengi için tasarlanmış, dolu buton zemini için değil -
                bkz. index.css). Beyaz yazıyla birlikte koyu temada okunaksız olurdu, bu
                yüzden burada bilinçli olarak sabit bir kırmızı kullanıyoruz (lib/release-notes.ts'teki
                kategori renk paleti gibi, bu kod tabanında token dışı sabit renk kullanımı zaten var). */}
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/50"
            >
              {deleting ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
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
