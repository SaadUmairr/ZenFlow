"use client"

import { useEffect, useRef, useState } from "react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { themes } from "@/styles/themes"

export function ThemeDropdown({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  const { setTheme, theme } = useTheme()
  const [previewTheme, setPreviewTheme] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const originalTheme = useRef<string | undefined>(null)

  useEffect(() => {
    if (isOpen) {
      originalTheme.current = theme
    }
  }, [isOpen, theme])

  useEffect(() => {
    if (previewTheme && isOpen) {
      document.documentElement.setAttribute("data-theme", previewTheme)
      document.documentElement.className =
        document.documentElement.className.replace(/theme-\w+/g, "") +
        ` theme-${previewTheme}`
    }
  }, [previewTheme, isOpen])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      if (previewTheme && originalTheme.current) {
        document.documentElement.setAttribute(
          "data-theme",
          originalTheme.current
        )
        document.documentElement.className =
          document.documentElement.className.replace(/theme-\w+/g, "") +
          ` theme-${originalTheme.current}`
      }
      setPreviewTheme(null)
    }
  }

  const handleThemePreview = (themeName: string) => {
    setPreviewTheme(themeName)
  }

  const handleThemeSelect = (themeName: string) => {
    setTheme(themeName)
    setPreviewTheme(null)
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent, themeName: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleThemeSelect(themeName)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={cn(className)}>
              <PaletteIcon absoluteStrokeWidth />
              {label?.trim() ? (
                <p className="text-muted-foreground">{label}</p>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Themes</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => handleThemeSelect(t)}
            onMouseEnter={() => handleThemePreview(t)}
            onMouseLeave={() => setPreviewTheme(null)}
            onFocus={() => handleThemePreview(t)}
            onBlur={() => setPreviewTheme(null)}
            onKeyDown={(e) => handleKeyDown(e, t)}
            className={cn(
              "flex cursor-pointer items-center justify-between capitalize",
              theme === t && "bg-[var(--primary)]/50"
            )}
          >
            <p className={cn(theme === t && "font-bold")}>{t}</p>
            {theme === t && <Check className="h-4 w-4 text-[var(--accent)]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
