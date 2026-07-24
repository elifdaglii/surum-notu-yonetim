import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Sağ üstte duracak tema anahtarı.
 * useTheme() next-themes'in hook'u: `theme` şu an aktif olanı, `setTheme` değiştirmeyi sağlıyor.
 * "system" seçeneği, işletim sisteminin light/dark tercihini otomatik takip eder.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* İki ikon aynı anda DOM'da duruyor; CSS ile tema class'ına göre biri gizleniyor, biri gösteriliyor.
              Böylece next-themes hydration tamamlanmadan yanlış ikon "flaş" etmiyor. */}
          <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Temayı değiştir</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Açık</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Koyu</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>Sistem</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
