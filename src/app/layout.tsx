import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"

import "./globals.css"

import { Providers } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-500`}
      >
        <Providers>{children}</Providers>
        <GoogleAnalytics gaId="G-8E8V8R6FZR" />
      </body>
    </html>
  )
}
