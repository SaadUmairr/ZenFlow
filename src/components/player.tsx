// REFACTORED WITH GPT-5
"use client"

import { useCallback } from "react"
import dynamic from "next/dynamic"
import {
  CurrentlyPlayingMediaAtom,
  isMediaPlayingAtom,
  MediaProgressAtom,
  playerVolumeAtom,
} from "@/context/data"
import { useAtom, useAtomValue, useSetAtom } from "jotai"

import { cn } from "@/lib/utils"

import { PlayerControls } from "./controls"
import { LoaderFive } from "./ui/loader"

// Import ReactPlayer with proper typing
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoaderFive text="Just a moment" />
    </div>
  ),
})

export function Player({ hidden = false }: { hidden?: boolean }) {
  const currentChannel = useAtomValue(CurrentlyPlayingMediaAtom)
  const volume = useAtomValue(playerVolumeAtom)
  const setVideoProgress = useSetAtom(MediaProgressAtom)
  const [isMediaPlaying, setIsMediaPlaying] = useAtom(isMediaPlayingAtom)

  // Handle progress updates using standard React event
  const handleTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const target = event.target as HTMLVideoElement
      const duration = target.duration
      const currentTime = target.currentTime

      if (!duration || isNaN(duration)) {
        console.warn("Video duration is not ready yet")
        return
      }

      const percentage = currentTime / duration
      setVideoProgress(percentage)
    },
    [setVideoProgress]
  )

  // Handle ready state
  const handleReady = useCallback(() => {
    console.log("Player is ready")
  }, [])

  // Handle errors with comprehensive postMessage error filtering
  // eslint-disable-next-line
  const handleError = useCallback((error: any) => {
    console.error("Player error:", error)

    // Comprehensive postMessage error detection and handling
    const errorMessage = error?.message || error?.toString() || ""
    const isPostMessageError =
      errorMessage.includes("postMessage") ||
      errorMessage.includes("target origin") ||
      errorMessage.includes("DOMWindow") ||
      errorMessage.includes("origin provided") ||
      errorMessage.includes("recipient window's origin")

    if (isPostMessageError) {
      console.warn(
        "PostMessage/Origin error detected - this is typically safe to ignore in development:",
        errorMessage
      )
      return
    }
  }, [])

  // Handle play/pause events
  const handlePlay = useCallback(() => {
    setIsMediaPlaying(true)
  }, [setIsMediaPlaying])

  const handlePause = useCallback(() => {
    setIsMediaPlaying(false)
  }, [setIsMediaPlaying])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 md:gap-3">
      <div className="relative min-h-0 flex-1">
        <div
          className={cn(
            "relative h-full w-full overflow-hidden rounded-lg border-4 border-gray-300 shadow-md",
            hidden ? "hidden" : ""
          )}
        >
          <ReactPlayer
            src={currentChannel}
            width="100%"
            height="100%"
            playing={isMediaPlaying}
            volume={volume[0] / 100}
            loop
            controls={false}
            playsInline
            muted={false}
            // Event handlers
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onError={handleError}
            config={{
              youtube: {
                disablekb: 0,
                rel: 0,
                fs: 1,
                iv_load_policy: 3,
                enablejsapi: 1,
              },
            }}
            // Styling
            style={{
              borderRadius: "var(--radius)",
              overflow: "hidden",
            }}
          />
        </div>
      </div>
      <PlayerControls />
    </div>
  )
}
