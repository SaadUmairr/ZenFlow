"use client"

import { useRef, useState } from "react"
import dynamic from "next/dynamic"
import { openAmbientDrawerAtom } from "@/context/data"
import { SOUND_SCENES, SoundScene } from "@/data/sounds"
import { useAtom } from "jotai"
import { AudioLines, PlayIcon, Square } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
})

type BeatCardProps = {
  scene: SoundScene
  isActive: boolean
  isLoading: boolean
  onToggle: () => void
}

function BeatCard({ scene, isActive, isLoading, onToggle }: BeatCardProps) {
  const Icon = scene.icon

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-24 w-full rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105",
        isActive
          ? `bg-gradient-to-br ${scene.activeColor} border-current shadow-lg`
          : `bg-gradient-to-br ${scene.color} border-border/50 hover:border-border`
      )}
      onClick={onToggle}
      disabled={isLoading}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Icon
            className={cn(
              "h-8 w-8 transition-colors",
              isActive ? scene.iconColor : "text-muted-foreground"
            )}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          )}
          {isActive && !isLoading && (
            <div className="absolute -top-1 -right-1">
              <div className="h-3 w-3 animate-pulse rounded-full bg-current" />
            </div>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {scene.name}
        </span>
      </div>
    </Button>
  )
}

export function AudioManager({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set())
  const [loadingSounds, setLoadingSounds] = useState<Set<string>>(new Set())
  const [readySounds, setReadySounds] = useState<Set<string>>(new Set())

  const playerRefs = useRef<Map<string, unknown>>(new Map())

  const [drawerOpen, setDrawerOpen] = useAtom(openAmbientDrawerAtom)

  const toggleSound = (sceneId: string) => {
    const isActive = activeSounds.has(sceneId)

    if (isActive) {
      setActiveSounds((prev) => {
        const next = new Set(prev)
        next.delete(sceneId)
        return next
      })
      setReadySounds((prev) => {
        const next = new Set(prev)
        next.delete(sceneId)
        return next
      })
    } else {
      setLoadingSounds((prev) => new Set(prev).add(sceneId))
      setActiveSounds((prev) => new Set(prev).add(sceneId))
    }
  }

  const stopAllSounds = () => {
    setActiveSounds(new Set())
    setLoadingSounds(new Set())
    setReadySounds(new Set())
  }

  const handlePlayerReady = (sceneId: string) => {
    setLoadingSounds((prev) => {
      const next = new Set(prev)
      next.delete(sceneId)
      return next
    })
    setReadySounds((prev) => new Set(prev).add(sceneId))
  }

  const handlePlayerStart = (sceneId: string) => {
    setLoadingSounds((prev) => {
      const next = new Set(prev)
      next.delete(sceneId)
      return next
    })
    setReadySounds((prev) => new Set(prev).add(sceneId))
  }

  return (
    <div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DrawerTrigger asChild>
              <Button
                variant={activeSounds.size > 0 ? "default" : "ghost"}
                size="icon"
                className={cn(className)}
                name="Beats"
                aria-label="Beats"
              >
                <AudioLines className="h-4 w-4" />
                {label?.trim() ? (
                  <p className="text-muted-foreground">{label}</p>
                ) : null}
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Beats</p>
          </TooltipContent>
        </Tooltip>
        <DrawerContent
          className="pointer-events-auto fixed inset-x-0 bottom-0 z-[100] mt-24 flex max-h-[96vh] flex-col"
          style={{
            touchAction: "pan-y",
          }}
        >
          <DrawerHeader className="relative flex-shrink-0">
            <DrawerTitle className="text-center text-2xl font-bold">
              Ambient Sounds
            </DrawerTitle>
            <div className="text-muted-foreground mb-6 text-center">
              Mix and match sounds to create your perfect atmosphere
            </div>
            {activeSounds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopAllSounds}
                className="absolute top-4 right-4 gap-2"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
          </DrawerHeader>

          {/* SCROLLABLE AREA */}
          <div
            className="min-h-0 flex-1 overscroll-y-contain px-6 pb-6"
            style={{
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {SOUND_SCENES.map((scene) => (
                <BeatCard
                  key={scene.id}
                  scene={scene}
                  isActive={activeSounds.has(scene.id)}
                  isLoading={
                    loadingSounds.has(scene.id) && !readySounds.has(scene.id)
                  }
                  onToggle={() => toggleSound(scene.id)}
                />
              ))}
            </div>

            {activeSounds.size > 0 && (
              <div className="bg-muted/50 mt-6 rounded-lg p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <PlayIcon className="h-4 w-4" />
                  <span>
                    Playing: &nbsp;
                    {Array.from(activeSounds)
                      .map((id) => SOUND_SCENES.find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Hidden audio players */}
      <div className="hidden">
        {SOUND_SCENES.map((scene) => (
          <ReactPlayer
            key={scene.id}
            ref={(player) => {
              if (player) playerRefs.current.set(scene.id, player)
            }}
            src={scene.url}
            playing={activeSounds.has(scene.id)}
            loop
            volume={0.7}
            width="1px"
            height="1px"
            wrapper={undefined}
            onReady={() => {
              handlePlayerReady(scene.id)
            }}
            onPlay={() => handlePlayerStart(scene.id)}
            onWaiting={() => {
              if (activeSounds.has(scene.id)) {
                setLoadingSounds((prev) => new Set(prev).add(scene.id))
              }
            }}
            onPlaying={() => {
              setLoadingSounds((prev) => {
                const next = new Set(prev)
                next.delete(scene.id)
                return next
              })
            }}
            config={{
              youtube: {
                disablekb: 0,
                rel: 0,
                fs: 1,
                iv_load_policy: 3,
              },
            }}
          />
        ))}
      </div>
    </div>
  )
}
