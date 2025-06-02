import { PaletteIcon } from "lucide-react"

import { PomoBreakOverlay, UserSettingNavButton } from "@/components/overlay"
import { Player } from "@/components/player"
import { Stats } from "@/components/stats"
import { Stopwatch } from "@/components/stopwatch"
import { Todo } from "@/components/todo"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <>
      <PomoBreakOverlay />
      <div className="flex h-screen flex-col overflow-hidden lg:overflow-hidden">
        {/* Navbar */}
        <nav className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-6">
          <h1 className="grow text-xl font-semibold text-gray-800">
            ZEN FLOW
          </h1>
          <div className="ml-auto flex gap-x-4">
            <UserSettingNavButton />
            <Button variant="ghost" size="icon">
              <PaletteIcon absoluteStrokeWidth />
            </Button>
          </div>
        </nav>

        {/* Main Content Grid */}
        <main className="grid flex-1 grid-cols-12 gap-4 overflow-y-auto p-4 lg:min-h-0 lg:overflow-hidden">
          {/* Left Column - Main Content + Stats */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-8 lg:min-h-0">
            {/* Main Content Area */}
            <div className="h-96 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 lg:h-auto lg:min-h-0 lg:flex-1">
              <div className="h-full overflow-hidden">
                <Player />
              </div>
            </div>

            {/* Stats Section */}
            <div className="shrink-0 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
              <Stats />
            </div>
          </div>

          {/* Right Column - Todos + Timer */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-4 lg:overflow-hidden">
            {/* Todos Section */}
            <div className="min-h-96 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 lg:min-h-0 lg:flex-1">
              <div className="h-full overflow-hidden">
                <Todo />
              </div>
            </div>

            {/* Timer Section */}
            <div className="shrink-0 rounded-lg border-2 border-dashed border-gray-300 bg-white p-2">
              <div className="overflow-hidden">
                <Stopwatch />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
