// ReleaseNotesArchive (kart grid + filtre pilleri) ve ReleaseNoteDetailDialog (detay
// modalı) aynı kategori->renk ve tarih formatı kurallarını paylaşıyor - tek yerde tutuluyor.
export type CategoryColor = {
  // Filtre pilindeki küçük renkli nokta.
  dotClassName: string;
  // Arşiv kartının sol kenar çizgisi: dinlenme durumunda ince (2px) + soluk (%30 opaklık),
  // hover'da kalın (4px) + tam doygun renk. Genişlik/renk/opaklık geçişi kartın kendi
  // className'indeki "transition-all duration-200" ile yumuşatılıyor (bkz. release-notes-archive.tsx).
  cardBorderClassName: string;
  // Badge'e variant="outline" üzerine eklenen border/text rengi (bkz. badge.tsx - outline
  // varyantı zaten border+text class'ı veriyor, buradaki class'lar twMerge ile onun üzerine yazıyor).
  badgeClassName: string;
};

// Uygulamanın üç "bilinen" kategorisi sabit renklerini koruyor (kullanıcı bunlara alıştı).
const KNOWN_CATEGORY_COLORS: Record<string, CategoryColor> = {
  "Özellik": {
    dotClassName: "bg-green-500",
    cardBorderClassName:
      "border-l-2 border-l-green-600/30 hover:border-l-4 hover:border-l-green-600 dark:border-l-green-400/30 dark:hover:border-l-green-400",
    badgeClassName: "border-green-600/50 text-green-700 dark:border-green-400/50 dark:text-green-400",
  },
  "Hata Çözümü": {
    dotClassName: "bg-destructive",
    cardBorderClassName: "border-l-2 border-l-destructive/30 hover:border-l-4 hover:border-l-destructive",
    badgeClassName: "border-destructive/50 text-destructive",
  },
  "Altyapı": {
    dotClassName: "bg-primary",
    cardBorderClassName: "border-l-2 border-l-primary/30 hover:border-l-4 hover:border-l-primary",
    badgeClassName: "border-primary/50 text-primary",
  },
};

// Admin'in sonradan eklediği "bilinmeyen" kategoriler için sabit bir renk paleti. Admin'e
// renk seçtirmek yerine kategori adının hash'ine göre paletten deterministik bir renk
// seçiyoruz - aynı kategori adı her zaman aynı rengi alır, iki farklı tarayıcıda/oturumda
// tutarlı kalır.
const FALLBACK_PALETTE: CategoryColor[] = [
  {
    dotClassName: "bg-blue-500",
    cardBorderClassName:
      "border-l-2 border-l-blue-600/30 hover:border-l-4 hover:border-l-blue-600 dark:border-l-blue-400/30 dark:hover:border-l-blue-400",
    badgeClassName: "border-blue-600/50 text-blue-700 dark:border-blue-400/50 dark:text-blue-400",
  },
  {
    dotClassName: "bg-amber-500",
    cardBorderClassName:
      "border-l-2 border-l-amber-600/30 hover:border-l-4 hover:border-l-amber-600 dark:border-l-amber-400/30 dark:hover:border-l-amber-400",
    badgeClassName: "border-amber-600/50 text-amber-700 dark:border-amber-400/50 dark:text-amber-400",
  },
  {
    dotClassName: "bg-pink-500",
    cardBorderClassName:
      "border-l-2 border-l-pink-600/30 hover:border-l-4 hover:border-l-pink-600 dark:border-l-pink-400/30 dark:hover:border-l-pink-400",
    badgeClassName: "border-pink-600/50 text-pink-700 dark:border-pink-400/50 dark:text-pink-400",
  },
  {
    dotClassName: "bg-cyan-500",
    cardBorderClassName:
      "border-l-2 border-l-cyan-600/30 hover:border-l-4 hover:border-l-cyan-600 dark:border-l-cyan-400/30 dark:hover:border-l-cyan-400",
    badgeClassName: "border-cyan-600/50 text-cyan-700 dark:border-cyan-400/50 dark:text-cyan-400",
  },
  {
    dotClassName: "bg-indigo-500",
    cardBorderClassName:
      "border-l-2 border-l-indigo-600/30 hover:border-l-4 hover:border-l-indigo-600 dark:border-l-indigo-400/30 dark:hover:border-l-indigo-400",
    badgeClassName: "border-indigo-600/50 text-indigo-700 dark:border-indigo-400/50 dark:text-indigo-400",
  },
  {
    dotClassName: "bg-orange-500",
    cardBorderClassName:
      "border-l-2 border-l-orange-600/30 hover:border-l-4 hover:border-l-orange-600 dark:border-l-orange-400/30 dark:hover:border-l-orange-400",
    badgeClassName: "border-orange-600/50 text-orange-700 dark:border-orange-400/50 dark:text-orange-400",
  },
];

// Basit bir string hash (djb2 varyantı) - kriptografik değil, sadece kategori adını
// FALLBACK_PALETTE üzerinde deterministik bir indekse eşlemek için yeterli.
function hashCategoryName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getCategoryColor(categoryName: string): CategoryColor {
  const known = KNOWN_CATEGORY_COLORS[categoryName];
  if (known) return known;
  return FALLBACK_PALETTE[hashCategoryName(categoryName) % FALLBACK_PALETTE.length];
}

export function formatReleaseDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
