import { FileText, History, LogOut, Tag, Users } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export type AdminTab = "users" | "categories";

type AdminSidebarProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  // "Sürüm Notları" bir tab değil, admin panelinden çıkıp arşiv/ana sayfaya dönüyor.
  onNavigateHome: () => void;
  onLogout: () => void;
  // JWT'den decode edilmiş kullanıcı adı - sidebar'ın kendisi token/JWT bilmiyor,
  // sadece görüntülenecek metni prop olarak alıyor.
  username: string;
};

type NavItemProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
};

// Tek bir nav satırı: aktifse dolu pill değil, sol kenarda ince bir vurgu çizgisi (border-l-2)
// + bg-primary/10 zemin + primary renginde metin. border-l-2 her zaman render ediliyor (aktif
// değilken border-transparent) ki aktif/pasif geçişinde genişlik oynayıp satır kaymasın.
function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

/**
 * Admin panelinin sol navigasyonu.
 * `sticky top-0 h-screen`: sayfa içeriği kaydırıldığında sidebar yerinde sabit kalır
 * (position:fixed yerine sticky kullanmamızın sebebi, flex layout içinde otomatik
 * genişlik/konum hesaplanmasının fixed'e göre çok daha az manuel CSS gerektirmesi).
 */
export function AdminSidebar({
  activeTab,
  onTabChange,
  onNavigateHome,
  onLogout,
  username,
}: AdminSidebarProps) {
  const initial = username.charAt(0).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileText className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">SNYS</p>
          <p className="text-xs text-muted-foreground">Admin Paneli</p>
        </div>
      </div>

      {/* "Sürüm Notları" tab değil - tıklanınca admin panelinden çıkıp arşiv sayfasına döner. */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        <NavItem icon={History} label="Sürüm Notları" active={false} onClick={onNavigateHome} />
        <NavItem
          icon={Users}
          label="Kullanıcılar"
          active={activeTab === "users"}
          onClick={() => onTabChange("users")}
        />
        <NavItem
          icon={Tag}
          label="Kategoriler"
          active={activeTab === "categories"}
          onClick={() => onTabChange("categories")}
        />
      </nav>

      <div className="flex flex-col gap-2 border-t p-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>

        {/* Kullanıcı bloğu aynı zamanda dropdown tetikleyici: tıklanınca "Çıkış Yap" açılır.
            Ayrı bir çıkış butonu koymak yerine bu bloğa gömdük - Ana sayfadaki avatar
            dropdown'uyla aynı desen, tutarlı bir etkileşim. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted"
            >
              <Avatar size="sm">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-medium text-foreground">{username}</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{username}</span>
                <span className="text-xs font-normal text-muted-foreground">Admin</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
