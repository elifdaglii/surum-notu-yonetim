import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/**
 * Sağ üstte/sidebar altında duracak tema anahtarı.
 * Artık "system/light/dark" seçmeli bir menü değil: tek tıkla iki durum arasında geçiş yapan
 * basit bir toggle. enableSystem kapalı olduğu için `theme` her zaman "light" ya da "dark" -
 * üçüncü bir "system" değeri hiç gelmiyor, o yüzden düz bir üçlü operatör yeterli.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* İki ikon aynı anda DOM'da duruyor; CSS ile tema class'ına göre biri gizleniyor, biri gösteriliyor.
          Böylece next-themes hydration tamamlanmadan yanlış ikon "flaş" etmiyor. */}
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Temayı değiştir</span>
    </Button>
  )
}
