import { useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { getUsernameFromToken } from "../lib/jwt";

import { AddReleaseNoteDialog } from "@/components/add-release-note-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReleaseNotesArchive } from "@/components/release-notes-archive";
import { ThemeToggle } from "@/components/theme-toggle";

type HomePageProps = {
  token: string;
  onLogout: () => void;
};

/**
 * USER'ın gördüğü düz ana sayfa. Artık ADMIN buraya hiç düşmüyor - App.tsx role'e göre
 * doğrudan AdminPage'e yönlendiriyor, bu yüzden burada "role"/"Admin Paneli" linkine
 * gerek yok (tek tutarlı giriş noktası: ADMIN = AdminPage, USER = HomePage).
 * Sidebar YOK - USER hiçbir zaman sidebar görmemeli. Arşiv listesinin kendisi
 * (filtre/arama/kart grid) artık ReleaseNotesArchive'da; burada sadece bu sayfaya
 * özgü header (geri oku, başlık, tema toggle, ekle butonu, avatar dropdown) var.
 */
function HomePage({ token, onLogout }: HomePageProps) {
  const username = getUsernameFromToken(token);
  const initial = username.charAt(0).toUpperCase();

  // Yeni bir sürüm notu kaydedildiğinde ReleaseNotesArchive'ı yeniden çektirmek için
  // artırılıyor (bkz. ReleaseNotesArchive'ın reloadSignal prop'u).
  const [archiveReloadSignal, setArchiveReloadSignal] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Şimdilik hiçbir yere yönlendirmiyor, sadece görsel olarak duruyor. */}
            <Button type="button" variant="ghost" size="icon" aria-label="Geri">
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Geçmiş Sürüm Notları</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AddReleaseNoteDialog
              token={token}
              onCreated={() => setArchiveReloadSignal((n) => n + 1)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full transition-opacity hover:opacity-80">
                  <Avatar>
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="size-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <ReleaseNotesArchive token={token} reloadSignal={archiveReloadSignal} />
      </main>
    </div>
  );
}

export default HomePage;
