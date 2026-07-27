import { ArrowLeft, LogOut } from "lucide-react";
import { getUsernameFromToken } from "../lib/jwt";

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
            {/* Şimdilik tıklanınca bir şey yapmıyor - içerik ekleme akışı ayrı bir adımda gelecek. */}
            <Button type="button">+ Yeni Sürüm Notu Ekle</Button>

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
        <ReleaseNotesArchive token={token} />
      </main>
    </div>
  );
}

export default HomePage;
