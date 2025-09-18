"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

// Debounce hook for performance optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

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
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPreviewingRef = useRef(false)

  // Debounce theme preview to avoid excessive DOM updates
  const debouncedPreviewTheme = useDebounce(previewTheme, 150)

  // Store original theme when dropdown opens
  useEffect(() => {
    if (isOpen && !originalTheme.current) {
      originalTheme.current = theme
    }
  }, [isOpen, theme])

  // Apply preview theme with debouncing
  useEffect(() => {
    if (debouncedPreviewTheme && isOpen && isPreviewingRef.current) {
      document.documentElement.setAttribute("data-theme", debouncedPreviewTheme)
      document.documentElement.className =
        document.documentElement.className.replace(/theme-\w+/g, "") +
        ` theme-${debouncedPreviewTheme}`
    }
  }, [debouncedPreviewTheme, isOpen])

  // Memoized function to apply theme to DOM
  const applyThemeToDOM = useCallback((themeName: string) => {
    document.documentElement.setAttribute("data-theme", themeName)
    document.documentElement.className =
      document.documentElement.className.replace(/theme-\w+/g, "") +
      ` theme-${themeName}`
  }, [])

  // Restore original theme when closing dropdown without selection
  const restoreOriginalTheme = useCallback(() => {
    if (originalTheme.current) {
      applyThemeToDOM(originalTheme.current)
    }
  }, [applyThemeToDOM])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) {
      // Clear any pending timeouts
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
        previewTimeoutRef.current = null
      }

      // Only restore if we were previewing and haven't selected a new theme
      if (isPreviewingRef.current && previewTheme !== theme) {
        restoreOriginalTheme()
      }

      // Reset states
      setPreviewTheme(null)
      isPreviewingRef.current = false
      originalTheme.current = null
    }
  }

  const handleThemePreview = (themeName: string) => {
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    isPreviewingRef.current = true
    setPreviewTheme(themeName)
  }

  const handleThemePreviewEnd = () => {
    // Add a small delay before clearing preview to avoid flickering
    previewTimeoutRef.current = setTimeout(() => {
      if (isPreviewingRef.current) {
        setPreviewTheme(null)
        restoreOriginalTheme()
        isPreviewingRef.current = false
      }
    }, 100)
  }

  const handleThemeSelect = (themeName: string) => {
    // Clear any pending timeouts
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }

    // Set the theme permanently
    setTheme(themeName)
    applyThemeToDOM(themeName)

    // Reset states and close dropdown
    setPreviewTheme(null)
    isPreviewingRef.current = false
    originalTheme.current = null
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent, themeName: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleThemeSelect(themeName)
    }
  }

  const handleMouseEnter = (themeName: string) => {
    handleThemePreview(themeName)
  }

  const handleMouseLeave = () => {
    handleThemePreviewEnd()
  }

  const handleFocus = (themeName: string) => {
    handleThemePreview(themeName)
  }

  const handleBlur = () => {
    handleThemePreviewEnd()
  }

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(className)}
              name="Theme Toggler"
              aria-label="Theme Toggler"
            >
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
            onMouseEnter={() => handleMouseEnter(t)}
            onMouseLeave={handleMouseLeave}
            onFocus={() => handleFocus(t)}
            onBlur={handleBlur}
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
