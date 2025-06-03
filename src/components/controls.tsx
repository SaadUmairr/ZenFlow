"use client"

import { useEffect, useState } from "react"
import {
  AllVideosListAtom,
  CurrentlyPlayingMediaAtom,
  isMediaPlayingAtom,
  MediaProgressAtom,
  playerVolumeAtom,
} from "@/context/data"
import { useAtom, useAtomValue } from "jotai"
import {
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  VolumeOffIcon,
  VolumeXIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { AllVideoPanel } from "./overlay"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"

export function PlayerControls() {
  const [isPlaying, setIsPlaying] = useAtom(isMediaPlayingAtom)
  const [volume, setVolume] = useAtom(playerVolumeAtom)
  const videoProgress = useAtomValue(MediaProgressAtom)
  const [currentlyPlayingMedia, setCurrentlyPlayingMedia] = useAtom(
    CurrentlyPlayingMediaAtom
  )
  const allVideosList = useAtomValue(AllVideosListAtom)

  const [isHoveringVolume, setIsHoveringVolume] = useState<boolean>(false)
  const [previousVolume, setPreviousVolume] = useState<number>(volume[0])
  const [isMuted, setIsMuted] = useState<boolean>(volume[0] === 0)

  // Update muted state when volume changes
  useEffect(() => {
    if (volume[0] === 0 && !isMuted) {
      setIsMuted(true)
    } else if (volume[0] > 0 && isMuted) {
      setIsMuted(false)
    }
  }, [volume, isMuted])

  const handleChannelChange = (direction: "next" | "prev") => {
    const currentIndex = allVideosList.findIndex(
      (video) => video.url === currentlyPlayingMedia
    )
    if (currentIndex === -1) {
      setCurrentlyPlayingMedia(allVideosList[0].url)
      return
    }
    let nextIndex = 0
    if (direction === "next")
      nextIndex =
        currentIndex === allVideosList.length - 1 ? 0 : currentIndex + 1
    else
      nextIndex =
        currentIndex === 0 ? allVideosList.length - 1 : currentIndex - 1

    const nextVideo = allVideosList[nextIndex].url
    setCurrentlyPlayingMedia(nextVideo)
  }

  const handleVolumeChange = (direction: "up" | "down") => {
    const currentVol = volume[0]
    if (direction === "up" && currentVol < 100) {
      const newVolume = Math.min(100, currentVol + 10)
      setVolume([newVolume])
      if (newVolume > 0) {
        setPreviousVolume(newVolume)
      }
    } else if (direction === "down" && currentVol > 0) {
      const newVolume = Math.max(0, currentVol - 10)
      setVolume([newVolume])
      if (newVolume > 0) {
        setPreviousVolume(newVolume)
      }
    }
  }

  const handleMuteToggle = () => {
    if (isMuted || volume[0] === 0) {
      // Unmute: restore previous volume or set to 50 if no previous volume
      const restoreVolume = previousVolume > 0 ? previousVolume : 50
      setVolume([restoreVolume])
      setIsMuted(false)
    } else {
      // Mute: save current volume and set to 0
      setPreviousVolume(volume[0])
      setVolume([0])
      setIsMuted(true)
    }
  }

  const handleSliderChange = (newVolume: number[]) => {
    setVolume(newVolume)
    if (newVolume[0] > 0) {
      setPreviousVolume(newVolume[0])
      setIsMuted(false)
    } else {
      setIsMuted(true)
    }
  }

  return (
    <div className="shrink-0">
      {/* Large screen single row */}
      <div className="hidden items-center justify-between gap-3 px-1 lg:flex">
        <div className="flex w-full items-center justify-between gap-1">
          {/* Left side controls */}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              onClick={() => handleChannelChange("prev")}
              className="h-8 w-8"
            >
              <SkipBackIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-9 w-9"
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleChannelChange("next")}
              className="h-8 w-8"
            >
              <SkipForwardIcon className="h-3 w-3" />
            </Button>
          </div>

          {/* Volume Control with Expanded Area */}
          <div className="relative flex shrink-0 items-center">
            <div
              className="relative flex items-center"
              onMouseEnter={() => setIsHoveringVolume(true)}
              onMouseLeave={() => setIsHoveringVolume(false)}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={handleMuteToggle}
                className="relative z-10 transition-all duration-300 hover:scale-105"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isMuted ? 1.1 : 1,
                    rotate: isMuted ? [0, -10, 10, 0] : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {volume[0] === 0 ? (
                    <VolumeOffIcon className="h-4 w-4" />
                  ) : volume[0] < 50 ? (
                    <VolumeXIcon className="h-4 w-4" />
                  ) : (
                    <Volume2Icon className="h-4 w-4" />
                  )}
                </motion.div>
              </Button>

              <AnimatePresence>
                {isHoveringVolume && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: -20,
                      scale: 0.9,
                      filter: "blur(4px)",
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                      scale: 0.9,
                      filter: "blur(4px)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      duration: 0.3,
                    }}
                    className="bg-background/95 absolute left-full z-20 ml-2 flex items-center gap-3 rounded-lg border p-3 shadow-xl backdrop-blur-md"
                    style={{
                      backdropFilter: "blur(12px)",
                      background: "rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVolumeChange("down")}
                      className="h-7 w-7 transition-all duration-200 hover:scale-110 hover:bg-red-50"
                    >
                      <MinusIcon className="h-3 w-3" />
                    </Button>

                    <div className="flex min-w-[140px] items-center gap-3">
                      <VolumeXIcon className="text-muted-foreground h-3 w-3 shrink-0" />
                      <Slider
                        value={volume}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <motion.span
                        className="text-muted-foreground min-w-[32px] shrink-0 text-xs font-medium"
                        key={volume[0]}
                        initial={{
                          scale: 1.2,
                          color: "#3b82f6",
                        }}
                        animate={{
                          scale: 1,
                          color: "#6b7280",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {volume[0]}%
                      </motion.span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVolumeChange("up")}
                      className="h-7 w-7 transition-all duration-200 hover:scale-110 hover:bg-green-50"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side controls with responsive behavior */}
          <motion.div
            className="flex min-w-0 flex-1 items-center gap-4"
            animate={{
              x: isHoveringVolume ? 200 : 0,
              opacity: isHoveringVolume ? 0.7 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.3,
            }}
          >
            {/* Progress Slider */}
            <motion.div
              className="min-w-0 flex-1"
              animate={{
                scale: isHoveringVolume ? 0.95 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Slider
                value={[videoProgress * 100]}
                max={100}
                step={0.1}
                className="w-full"
              />
            </motion.div>

            {/* All Videos Panel */}
            <motion.div
              animate={{
                scale: isHoveringVolume ? 0.95 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <AllVideoPanel />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mobile/Small screen layout */}
      <div className="flex flex-col gap-2 lg:hidden">
        {/* Top row - Main controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChannelChange("prev")}
              className="h-8 w-8"
            >
              <SkipBackIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-9 w-9"
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChannelChange("next")}
              className="h-8 w-8"
            >
              <SkipForwardIcon className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleMuteToggle}
              className="h-8 w-8"
            >
              {volume[0] === 0 ? (
                <VolumeOffIcon className="h-3 w-3" />
              ) : (
                <Volume2Icon className="h-3 w-3" />
              )}
            </Button>
            <AllVideoPanel />
          </div>
        </div>

        {/* Bottom row - Progress and volume */}
        <div className="flex items-center gap-2">
          <Slider
            value={[videoProgress * 100]}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <div className="flex min-w-[120px] items-center gap-1">
            <Slider
              value={volume}
              onValueChange={handleSliderChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-muted-foreground min-w-[28px] text-xs">
              {volume[0]}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
