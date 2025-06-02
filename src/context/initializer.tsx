"use client"

import { useEffect } from "react"
import {
  allSessionSavedDataAtom,
  AllVideosListAtom,
  dailyGoalAtom,
} from "@/context/data"
import { LOFI_CHANNELS } from "@/data/lofi"
import {
  getAllVideoList,
  getDailyGoalIDB,
  getSavedSessionDataIDB,
  updateVideoList,
} from "@/utils/idb.util"
import { useSetAtom } from "jotai"

export function JotaiInitializer() {
  const setVideoList = useSetAtom(AllVideosListAtom)
  const setDailyGoal = useSetAtom(dailyGoalAtom)
  const setAllSessions = useSetAtom(allSessionSavedDataAtom)

  useEffect(() => {
    ;(async () => {
      const videosData = await getAllVideoList()
      if (videosData && videosData.length > 0) {
        setVideoList(videosData)
      } else {
        for (const channel of LOFI_CHANNELS) {
          await updateVideoList(channel)
        }
        setVideoList(LOFI_CHANNELS)
      }

      const goalData = await getDailyGoalIDB()
      if (goalData) {
        setDailyGoal(goalData)
      }

      const sessionsData = await getSavedSessionDataIDB()
      if (sessionsData.length > 0) setAllSessions(sessionsData)
    })()
  }, [])

  return null
}
