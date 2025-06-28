// components/ThemeDropdown.tsx
"use client"

import { Check, PaletteIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { themes } from "@/styles/themes"

export function ThemeDropdown({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  const { setTheme, theme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(className)}>
          <PaletteIcon absoluteStrokeWidth />
          {label?.trim() ? (
            <p className="text-muted-foreground">{label}</p>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              "flex items-center justify-between capitalize",
              theme === t && "bg-[var(--primary)]/50"
            )}
          >
            {<p className={cn(theme === t && "font-bold")}>{t}</p>}
            {theme === t && <Check className="h-4 w-4 text-[var(--accent)]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
