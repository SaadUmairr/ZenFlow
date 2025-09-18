"use client"

import { useCallback, useEffect, useState } from "react"
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

const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
})

export function Player({ hidden = false }: { hidden?: boolean }) {
  const currentChannel = useAtomValue(CurrentlyPlayingMediaAtom)
  const volume = useAtomValue(playerVolumeAtom)
  const setVideoProgress = useSetAtom(MediaProgressAtom)
  const [isMediaPlaying, setIsMediaPlaying] = useAtom(isMediaPlayingAtom)

  const [isPlayerReady, setIsPlayerReady] = useState(false)

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

  const handleReady = useCallback(() => {
    setIsPlayerReady(true)
  }, [])

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

  const handlePlay = useCallback(() => {
    setIsMediaPlaying(true)
  }, [setIsMediaPlaying])

  const handlePause = useCallback(() => {
    setIsMediaPlaying(false)
  }, [setIsMediaPlaying])

  const handleChannelChange = useCallback(() => {
    setIsPlayerReady(false)
  }, [])

  // Effect to handle channel changes
  useEffect(() => {
    if (currentChannel) {
      handleChannelChange()
    }
  }, [currentChannel, handleChannelChange])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 md:gap-3">
      <div className="relative min-h-0 flex-1">
        <div
          className={cn(
            "relative h-full w-full overflow-hidden rounded-lg border-4 border-gray-300 shadow-md",
            hidden ? "hidden" : ""
          )}
        >
          {/* Show loading overlay until player is ready */}
          {!isPlayerReady && currentChannel && (
            <div className="bg-background absolute inset-0 z-10 flex items-center justify-center">
              <LoaderFive text="Just a moment..." />
            </div>
          )}

          {currentChannel && (
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
          )}
        </div>
      </div>
      <PlayerControls />
    </div>
  )
}
