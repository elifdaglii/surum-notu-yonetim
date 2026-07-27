import { useEffect, useState } from "react";
import { fetchReleaseNotes } from "../api/releaseNotes";
import type { ReleaseNote, Role } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

type HomePageProps = {
  token: string;
  role: Role;
  onOpenAdmin: () => void;
  onLogout: () => void;
};

function formatReleaseDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function HomePage({ token, role, onOpenAdmin, onLogout }: HomePageProps) {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Geçmiş Sürüm Notları</h1>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Admin paneline giden buton sadece ADMIN rolüne render ediliyor -
                AdminPage'e geçişteki route guard mantığıyla aynı: USER rolündeki
                biri bu linki hiç görmüyor. */}
            {role === "ADMIN" && (
              <Button variant="outline" onClick={onOpenAdmin}>
                Admin Paneli
              </Button>
            )}
            <Button variant="outline" onClick={onLogout}>
              Çıkış Yap
            </Button>
            {/* Şimdilik sadece görünüyor; tıklama davranışı ayrı bir adımda gelecek. */}
            <Button type="button">+ Yeni Sürüm Notu Ekle</Button>
          </div>
        </header>

        {loading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && notes.length === 0 && (
          <div className="flex justify-center py-16">
            <p className="text-sm text-muted-foreground">Henüz sürüm notu eklenmedi</p>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground">{note.version}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatReleaseDate(note.releaseDate)}
                    </span>
                  </div>
                  {note.category && <Badge variant="outline">{note.category.name}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
