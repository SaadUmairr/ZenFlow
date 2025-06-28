"use client"

import { useRef, useState } from "react"
import dynamic from "next/dynamic"
import { SOUND_SCENES, SoundScene } from "@/data/sounds"
import { AudioLines, Play, Square } from "lucide-react"
import { ReactPlayerProps } from "react-player"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

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
  const playerRefs = useRef<Map<string, ReactPlayerProps>>(new Map())

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
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            variant={activeSounds.size > 0 ? "default" : "ghost"}
            size="icon"
            className={cn(className)}
          >
            <AudioLines className="h-4 w-4" />
            {label?.trim() ? (
              <p className="text-muted-foreground">{label}</p>
            ) : null}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex max-h-[80vh] flex-col">
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

          <div className="flex-1 overflow-y-auto px-6 pb-6">
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
                  <Play className="h-4 w-4" />
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
            ref={(player: ReactPlayerProps) => {
              if (player) playerRefs.current.set(scene.id, player)
            }}
            url={scene.url}
            playing={activeSounds.has(scene.id)}
            loop
            volume={0.7}
            width="1px"
            height="1px"
            onReady={() => handlePlayerReady(scene.id)}
            onStart={() => handlePlayerStart(scene.id)}
            onBuffer={() => {
              if (activeSounds.has(scene.id)) {
                setLoadingSounds((prev) => new Set(prev).add(scene.id))
              }
            }}
            onBufferEnd={() => {
              setLoadingSounds((prev) => {
                const next = new Set(prev)
                next.delete(scene.id)
                return next
              })
            }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 0,
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  iv_load_policy: 3,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                },
              },
            }}
          />
        ))}
      </div>
    </div>
  )
}
