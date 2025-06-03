import { Button } from "@/components/ui/button"

import "@/styles/themes.css"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="bg-[var (--background)] flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <h1 className="text-[var (--foreground)] mb-2 text-6xl font-bold md:text-8xl">
            4<span className="text-[var (--foreground)]">0</span>4
          </h1>
          <div className="text-[var (--muted-foreground)] text-sm tracking-wider uppercase">
            Page Not Found
          </div>
        </div>

        {/* Cute Message */}
        <div className="mx-auto mb-8 max-w-md">
          <h2 className="text-[var (--card-foreground)] mb-3 text-xl font-semibold md:text-2xl">
            Oops! Looks like you wandered off your focus path!
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button>🎯 Back to Focus Sessions</Button>
          </Link>
        </div>

        <div className="text-[var (--muted-foreground)] mt-12 text-xs italic">
          &apos;Every moment is a fresh beginning.&apos; - T.S. Eliot
        </div>
      </div>
    </div>
  )
}
