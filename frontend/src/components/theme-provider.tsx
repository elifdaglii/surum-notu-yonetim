import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/**
 * next-themes'in kendi Provider'ını sarmalıyoruz.
 * attribute="class" -> next-themes tema adını <html> etiketine class olarak yazar (ör. <html class="dark">).
 * index.css'teki `.dark { ... }` bloğu ve `@custom-variant dark (&:is(.dark *))` tanımı
 * tam olarak bu class'ı bekliyor, o yüzden strateji "class" olmak zorunda.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  )
}
