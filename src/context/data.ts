import { LOFI_CHANNELS, VideoItem } from "@/data/lofi"
import { atom } from "jotai"

import { SessionData } from "@/components/stopwatch"

interface PomodoroDurationType {
  focus: number
  break: number
}

const ONE_HOUR = 60 * 60 * 1000

export const playerVolumeAtom = atom<number[]>([50])

export const isMediaPlayingAtom = atom<boolean>(false)

export const MediaProgressAtom = atom<number>(0)

export const AllVideosListAtom = atom<VideoItem[]>(LOFI_CHANNELS)

export const CurrentlyPlayingMediaAtom = atom<string>(LOFI_CHANNELS[0].url)

export const dailyGoalAtom = atom<number>(2 * ONE_HOUR)

export const timerAtom = atom<number>(0)

export const isPomodoroBreakAtom = atom<boolean>(false)

export const PomodoroDurationsAtom = atom<PomodoroDurationType>({
  focus: 25 * 60 * 1000,
  break: 5 * 60 * 1000,
})

export const allSessionSavedDataAtom = atom<SessionData[]>([])

export const showAbsoluteFocusAtom = atom<boolean>(false)

export const openAmbientDrawerAtom = atom<boolean>(false)
