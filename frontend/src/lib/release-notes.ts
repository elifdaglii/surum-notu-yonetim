import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

// ReleaseNotesArchive (kart grid) ve ReleaseNoteDetailDialog (detay modalı) aynı
// kategori->renk ve tarih formatı kurallarını paylaşıyor - tek yerde tutuluyor.
export function categoryBadgeVariant(categoryName: string): BadgeVariant {
  if (categoryName === "Özellik") return "feature";
  if (categoryName === "Hata Çözümü") return "bugfix";
  if (categoryName === "Altyapı") return "chore";
  return "outline";
}

export function formatReleaseDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
