"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      {/* Sadece açılış animasyonu (data-open:...) var, kapanış animasyonu YOK - bkz.
          dropdown-menu.tsx/select.tsx/dialog.tsx'teki aynı yorum: Radix'in Presence'ı
          kapanışta animationend event'ini beklediği için bu projede (React 19
          StrictMode + mevcut radix-ui sürümü) o event hiç tetiklenmiyor ve içerik
          "kapandıktan" sonra DOM'da tam opaklıkta, tıklanabilir halde kalıyordu. */}
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
