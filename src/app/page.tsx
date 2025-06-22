import { AudioManager } from "@/components/beats"
import {
  AbsoluteFocusButton,
  AbsoluteFocusOverlay,
  MobileNavbar,
  PomoBreakOverlay,
  UserSettingNavButton,
} from "@/components/overlay"
import { Player } from "@/components/player"
import { Stats } from "@/components/stats"
import { Stopwatch } from "@/components/stopwatch"
import { ThemeDropdown } from "@/components/theme-toggle"
import { Todo } from "@/components/todo"
import { ZenFlowLogo } from "@/components/zen"

import "@/styles/themes.css"

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-geist-sans)]">
      <PomoBreakOverlay />
      <AbsoluteFocusOverlay />
      <div className="flex h-screen flex-col overflow-hidden lg:overflow-hidden">
        {/* Navbar */}
        <nav className="flex h-16 shrink-0 items-center border-b border-[var(--border)] bg-[var(--card)] px-6">
          <ZenFlowLogo />
          <h1 className="grow text-xl font-semibold text-[var(--card-foreground)]">
            ZEN FLOW
          </h1>
          <div className="ml-auto hidden items-center gap-x-4 lg:flex">
            {/* <Github /> */}
            <AbsoluteFocusButton />
            <AudioManager />
            <UserSettingNavButton />
            <ThemeDropdown />
          </div>
          {/* Mobile Navbar */}
          <MobileNavbar />
        </nav>

        {/* Main Content Grid */}
        <main className="grid flex-1 grid-cols-12 gap-4 overflow-y-auto bg-[var(--background)] p-4 lg:min-h-0 lg:overflow-hidden">
          {/* Left Column - Main Content + Stats */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-8 lg:min-h-0">
            {/* Main Content Area */}
            <div className="h-96 shrink-0 overflow-hidden rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-4 lg:h-auto lg:min-h-0 lg:flex-1">
              <div className="h-full overflow-hidden">
                <Player />
              </div>
            </div>

            {/* Stats Section */}
            <div className="shrink-0 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-4">
              <Stats />
            </div>
          </div>

          {/* Right Column - Todos + Timer */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-4 lg:overflow-hidden">
            {/* Todos Section */}
            <div className="min-h-96 shrink-0 overflow-hidden rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-4 lg:min-h-0 lg:flex-1">
              <div className="h-full overflow-hidden px-2">
                <Todo />
              </div>
            </div>

            {/* Timer Section */}
            <div className="shrink-0 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-2">
              <div className="overflow-hidden">
                <Stopwatch />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
