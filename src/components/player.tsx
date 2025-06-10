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

const ReactPlayer = dynamic(() => import("react-player/youtube"), {
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
              url={currentChannel}
              width="100%"
              height="100%"
              controls={false}
              onPlay={() => setIsMediaPlaying(true)}
              onPause={() => setIsMediaPlaying(false)}
              playing={isMediaPlaying}
              volume={volume[0] / 100}
              onProgress={({ played }) => {
                setVideoProgress(played)
              }}
              progressInterval={500}
              config={{
                playerVars: {
                  controls: 0,
                  playing: 1,
                  modestbranding: 1,
                  iv_load_policy: 3,
                  rel: 0,
                  showinfo: 0,
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
