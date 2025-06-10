import { PomoBreakOverlay, UserSettingNavButton } from "@/components/overlay"
import { Player } from "@/components/player"
import { Stats } from "@/components/stats"
import { Stopwatch } from "@/components/stopwatch"
import { ThemeDropdown } from "@/components/theme-toggle"
import { Todo } from "@/components/todo"
import { ZenFlowLogo } from "@/components/zen"

import "@/styles/themes.css"

export default function Home() {
  return (
    <div className="bg-[var (--background)] min-h-screen">
      <PomoBreakOverlay />
      <div className="flex h-screen flex-col overflow-hidden lg:overflow-hidden">
        {/* Navbar */}
        <nav className="border-[var (--border)] bg-[var (--card)] flex h-16 shrink-0 items-center border-b px-6">
          <ZenFlowLogo />
          <h1 className="text-[var (--card-foreground)] grow text-xl font-semibold">
            ZEN FLOW
          </h1>
          <div className="ml-auto flex gap-x-4">
            {/* <Github /> */}
            {/* <BeatsContainer /> */}
            <UserSettingNavButton />
            <ThemeDropdown />
          </div>
        </nav>

        {/* Main Content Grid */}
        <main className="bg-[var (--background)] grid flex-1 grid-cols-12 gap-4 overflow-y-auto p-4 lg:min-h-0 lg:overflow-hidden">
          {/* Left Column - Main Content + Stats */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-8 lg:min-h-0">
            {/* Main Content Area */}
            <div className="rounded-[var (--radius)] border-[var (--border)] bg-[var (--card)] h-96 shrink-0 overflow-hidden border-2 border-dashed p-4 lg:h-auto lg:min-h-0 lg:flex-1">
              <div className="h-full overflow-hidden">
                <Player />
              </div>
            </div>

            {/* Stats Section */}
            <div className="rounded-[var (--radius)] border-[var (--border)] bg-[var (--card)] shrink-0 border-2 border-dashed p-4">
              <Stats />
            </div>
          </div>

          {/* Right Column - Todos + Timer */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-4 lg:overflow-hidden">
            {/* Todos Section */}
            <div className="rounded-[var (--radius)] border-[var (--border)] bg-[var (--card)] min-h-96 shrink-0 overflow-hidden border-2 border-dashed p-4 lg:min-h-0 lg:flex-1">
              <div className="h-full overflow-hidden px-2">
                <Todo />
              </div>
            </div>

            {/* Timer Section */}
            <div className="rounded-[var (--radius)] border-[var (--border)] bg-[var (--card)] shrink-0 border-2 border-dashed p-2">
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
