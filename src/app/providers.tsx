"use client"

import { ReactNode } from "react"
import { JotaiInitializer } from "@/context/initializer"
import { Provider as JotaiProvider } from "jotai"

import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <JotaiInitializer />
        {children}
      </ThemeProvider>
    </JotaiProvider>
  )
}
