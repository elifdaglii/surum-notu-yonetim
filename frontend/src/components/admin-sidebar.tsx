import { FileText, LogOut, Tag, Users } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export type AdminTab = "users" | "categories";

type AdminSidebarProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
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
//
// Not: Stitch tarifi metin rengi için "primary-foreground" diyor - ama bu token bizde SOLID
// primary buton üzerindeki yazı rengi (light'ta beyaz, dark'ta açık leylak). Neredeyse şeffaf
// bg-primary/10 üzerine light modda beyaz yazı koysak metin okunmaz hale gelirdi. Bunun yerine
// text-primary kullandık: vurgu rengi doğrudan metin rengi oluyor, her iki modda da okunaklı.
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
export function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
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

      <nav className="flex flex-1 flex-col gap-1 p-2">
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
        <Button variant="outline" className="justify-start gap-2" onClick={onLogout}>
          <LogOut className="size-4" />
          Çıkış Yap
        </Button>
      </div>
    </aside>
  );
}
