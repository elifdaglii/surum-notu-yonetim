import { useEffect, useMemo, useState } from "react";
import { FileCode, FileDown, Search } from "lucide-react";
import { fetchReleaseNotes } from "@/api/releaseNotes";
import { categoryBadgeVariant, formatReleaseDate } from "@/lib/release-notes";
import type { ReleaseNote, Role } from "@/types";

import { AddReleaseNoteDialog } from "@/components/add-release-note-dialog";
import { ReleaseNoteDetailDialog } from "@/components/release-note-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ReleaseNotesArchiveProps = {
  token: string;
  // Değiştiğinde (örn. yeni bir sürüm notu kaydedildiğinde) listeyi yeniden çeker.
  // Filtre/arama state'ini korumak için component'i remount etmek yerine (key prop)
  // bunu bir useEffect bağımlılığı olarak kullanıyoruz.
  reloadSignal?: number;
  // Giriş yapmış kullanıcının rolü ve kullanıcı adı - detay modalındaki Düzenle/Sil
  // butonlarının hangi notlarda görüneceğini belirlemek için (ADMIN her notu, USER
  // sadece kendi oluşturduğu notu yönetebilir). Backend PUT/DELETE'te aynı kuralı
  // zaten uyguluyor (bkz. ReleaseNoteService.assertCanManage), burada sadece USER'a
  // başkasının notunda işlevsiz/403 ile sonuçlanacak butonlar gösterilmesin diye
  // aynı mantığı tekrarlıyoruz.
  role: Role;
  currentUsername: string;
};

// Uygulamanın sabit üç kategorisi (yeni özellik / hata çözümü / altyapı temizliği).
// Category entity'miz aslında serbest metin (admin panelinden herhangi bir isimle
// oluşturulabiliyor); bu üçü dışında bir kategori adı gelirse (örn. eski test verisi)
// filtre pillerinde karşılığı olmaz ama "Tümü" içinde yine görünür.
const CATEGORY_FILTERS: { label: string; dotClassName: string }[] = [
  { label: "Özellik", dotClassName: "bg-green-500" },
  { label: "Hata Çözümü", dotClassName: "bg-destructive" },
  { label: "Altyapı", dotClassName: "bg-primary" },
];

// contentMarkdown düz bir metin/markdown alanı - veri modelimizde ayrı bir "özet" alanı yok.
// Kart önizlemesi için: boş satırları at, madde işareti/numara/başlık işaretlerini temizle,
// ilk birkaç satırı göster.
function getPreviewLines(markdown: string, maxLines = 3): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").replace(/^#+\s*/, ""))
    .filter((line) => line.length > 0)
    .slice(0, maxLines);
}

/**
 * Sürüm notu arşivi: filtre pilleri + arama + kart grid.
 * Hem USER'ın gördüğü düz ana sayfada (HomePage) hem ADMIN'in sidebar shell'i
 * içindeki "Sürüm Notları" sekmesinde (AdminPage) aynen kullanılıyor - kod tekrarı
 * olmasın diye başlık/header'dan bağımsız, tek bir yerde tutuluyor. Header (başlık,
 * geri oku, tema toggle, avatar vs.) her iki bağlamda farklı olduğu için bu component'in
 * dışında, çağıran sayfada kalıyor.
 */
export function ReleaseNotesArchive({ token, reloadSignal, role, currentUsername }: ReleaseNotesArchiveProps) {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detay modalında gösterilen not (kart tıklanınca set edilir, null ise modal kapalı).
  const [selectedNote, setSelectedNote] = useState<ReleaseNote | null>(null);
  // "Düzenle"ye basılınca detay modalı kapanıp bu doluyor - AddReleaseNoteDialog'u
  // edit modunda, bu notun değerleriyle önceden dolu açıyor.
  const [editingNote, setEditingNote] = useState<ReleaseNote | null>(null);

  useEffect(() => {
    loadNotes();
  }, [reloadSignal]);

  async function loadNotes() {
    setLoading(true);
    setError(null);
    try {
      setNotes(await fetchReleaseNotes(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // Backend'e ayrıca bir "arama/filtre" isteği atmıyoruz: liste zaten tek seferde
  // çekiliyor, kategori/metin filtresi client-side. Not sayısı büyüdükçe bu backend'e
  // taşınabilir ama şu an için gereksiz bir round-trip'ten kaçınıyoruz.
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesFilter = !activeFilter || note.category?.name === activeFilter;
      const matchesSearch =
        !query ||
        note.version.toLowerCase().includes(query) ||
        note.contentMarkdown.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [notes, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={
              activeFilter === null
                ? "rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                : "rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
            }
          >
            Tümü
          </button>
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setActiveFilter(filter.label)}
              className={
                activeFilter === filter.label
                  ? "flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  : "flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
              }
            >
              <span className={`size-2 rounded-full ${filter.dotClassName}`} />
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Sürüm notlarında ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && notes.length === 0 && (
        <div className="flex justify-center py-24">
          <p className="text-sm text-muted-foreground">Henüz sürüm notu eklenmedi.</p>
        </div>
      )}

      {!loading && !error && notes.length > 0 && filteredNotes.length === 0 && (
        <div className="flex justify-center py-24">
          <p className="text-sm text-muted-foreground">Bu filtreye uyan sürüm notu bulunamadı.</p>
        </div>
      )}

      {!loading && !error && filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNote(note)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedNote(note);
                }
              }}
              className="group relative cursor-pointer border-l-2 border-l-transparent transition-colors hover:border-l-primary hover:bg-muted/30"
            >
              {/* PDF/HTML indirme ikonları - şimdilik işlevsiz, her zaman görünür.
                  stopPropagation: tıklanınca kartın onClick'i (detay modalını açan)
                  tetiklenmesin. */}
              <div className="absolute top-3 right-3 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="PDF indir"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="HTML indir"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileCode className="size-3.5" />
                </Button>
              </div>

              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 pr-14">
                  <span className="font-bold text-foreground">{note.version}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatReleaseDate(note.releaseDate)}
                  </span>
                </div>

                {note.category && (
                  <div>
                    <Badge variant={categoryBadgeVariant(note.category.name)}>
                      {note.category.name}
                    </Badge>
                  </div>
                )}

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {getPreviewLines(note.contentMarkdown).map((line, index) => (
                    <p key={index} className="flex gap-1.5">
                      <span className="text-primary">•</span>
                      <span className="line-clamp-1">{line}</span>
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReleaseNoteDetailDialog
        token={token}
        note={selectedNote}
        open={selectedNote !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNote(null);
        }}
        canManage={role === "ADMIN" || selectedNote?.createdByUsername === currentUsername}
        onEditRequested={(note) => {
          setSelectedNote(null);
          setEditingNote(note);
        }}
        onDeleted={() => {
          setSelectedNote(null);
          loadNotes();
        }}
      />

      <AddReleaseNoteDialog
        token={token}
        mode="edit"
        note={editingNote ?? undefined}
        open={editingNote !== null}
        onOpenChange={(open) => {
          if (!open) setEditingNote(null);
        }}
        onSaved={() => {
          setEditingNote(null);
          loadNotes();
        }}
      />
    </div>
  );
}
