"use client"

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

const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
})

export function Player({ hidden = false }: { hidden?: boolean }) {
  const currentChannel = useAtomValue(CurrentlyPlayingMediaAtom)
  const volume = useAtomValue(playerVolumeAtom)
  const setVideoProgress = useSetAtom(MediaProgressAtom)
  const [isMediaPlaying, setIsMediaPlaying] = useAtom(isMediaPlayingAtom)

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-2 md:gap-3">
        <div className="relative min-h-0 flex-1">
          <div
            className={cn(
              "relative h-full w-full overflow-hidden rounded-lg border-4 border-gray-300 shadow-md",
              hidden ? "hidden" : ""
            )}
          >
            <ReactPlayer
              loop
              style={{ borderRadius: "var(--radius)", overflow: "hidden" }}
              src={currentChannel}
              width="100%"
              height="100%"
              controls={false}
              playsInline
              wrapper={undefined}
              onPlay={() => setIsMediaPlaying(true)}
              onPause={() => setIsMediaPlaying(false)}
              playing={isMediaPlaying}
              volume={volume[0] / 100}
              onTimeUpdate={(event) => {
                const target = event.target as HTMLMediaElement

                const duration = target.duration
                const currentTime = target.currentTime

                if (!duration || isNaN(duration)) {
                  console.warn("Video duration is not ready yet")
                  return
                }
                const percentage = currentTime / duration
                setVideoProgress(percentage)
              }}
              config={{
                youtube: {
                  playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    disablekb: 0,
                    fs: 1,
                    cc_load_policy: 0,
                  },
                },
              }}
            />
          </div>
        </div>
        <PlayerControls />
      </div>
    </>
  )
}
