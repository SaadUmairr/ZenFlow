import type { Metadata } from "next"
import { GoogleAnalytics } from "@next/third-parties/google"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import "./globals.css"

import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "ZenFlow",
  description:
    "ZenFlow: Your all-in-one local productivity app. Stream lofi, manage tasks, and master focus with Pomodoro & custom timers. Enhance concentration & organization.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased transition-colors duration-500`}
      >
        <Providers>{children}</Providers>
        <GoogleAnalytics gaId="G-8E8V8R6FZR" />
      </body>
    </html>
  )
}
