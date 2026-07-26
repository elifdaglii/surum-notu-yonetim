import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/**
 * next-themes'in kendi Provider'ını sarmalıyoruz.
 * attribute="class" -> next-themes tema adını <html> etiketine class olarak yazar (ör. <html class="dark">).
 * index.css'teki `.dark { ... }` bloğu ve `@custom-variant dark (&:is(.dark *))` tanımı
 * tam olarak bu class'ı bekliyor, o yüzden strateji "class" olmak zorunda.
 *
 * enableSystem={false} + defaultTheme="light": artık "system" diye üçüncü bir durum yok,
 * uygulama her zaman light ile açılıyor; kullanıcı sadece light<->dark arasında geçiş yapabiliyor.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} {...props}>
      {children}
    </NextThemesProvider>
  )
}
