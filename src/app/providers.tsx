"use client"

import { ReactNode } from "react"
import { JotaiInitializer } from "@/context/initializer"
import { Provider as JotaiProvider } from "jotai"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <JotaiInitializer />
      {children}
    </JotaiProvider>
  )
}
