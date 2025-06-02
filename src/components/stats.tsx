"use client"

import { useCallback, useEffect, useState } from "react"
import {
  allSessionSavedDataAtom,
  dailyGoalAtom,
  PomodoroDurationsAtom,
} from "@/context/data"
import { useAtomValue } from "jotai"
import {
  BarChart3Icon,
  CalendarIcon,
  ChartAreaIcon,
  ClockIcon,
  FlameIcon,
  TrendingUpIcon,
} from "lucide-react"

import { formatTimeMain } from "@/lib/utils"

import { SessionData } from "./stopwatch"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"

export interface UserStats {
  totalSessions: number
  totalFocusTime: number
  totalBreakTime: number
  averageSessionDuration: number
  stopwatchSessions: number
  pomodoroSessions: number
  completedPomodoros: number
  completedBreaks: number
  longestSession: number
  todaysSessions: number
  todaysTime: number
  currentStreak: number
}

export function Stats() {
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    averageSessionDuration: 0,
    stopwatchSessions: 0,
    pomodoroSessions: 0,
    completedPomodoros: 0,
    completedBreaks: 0,
    longestSession: 0,
    todaysSessions: 0,
    todaysTime: 0,
    currentStreak: 0,
  })
  const [loading, setLoading] = useState<boolean>(false)

  // Gloabl states
  const dailyFocusGoal = useAtomValue(dailyGoalAtom)
  const sessionGlobal = useAtomValue(allSessionSavedDataAtom)
  const pomodoroDurations = useAtomValue(PomodoroDurationsAtom)

  useEffect(() => {
    try {
      setLoading(true)
      if (!sessionGlobal || sessionGlobal.length === 0) return

      const calculatedStats = calculateSession()
      setStats(calculatedStats)
    } catch (error) {
      console.error("Error loading stats: ", (error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [sessionGlobal])

  const calculateSession = (): UserStats => {
    let totalFocusTime = 0
    let totalBreakTime = 0
    let stopwatchSessions = 0
    let pomodoroSessions = 0
    let completedPomodoros = 0
    let completedBreaks = 0
    let longestSession = 0
    let todaysSessions = 0
    let todaysTime = 0

    const now = new Date()
    const today = new Date(now.getDate(), now.getMonth(), now.getFullYear())

    sessionGlobal.forEach((session) => {
      const sessionDate = new Date(session.startTime)
      const totalDuration = session.actualFocusTime

      if (session.mode === "stopwatch" || session.mode === "countdown") {
        stopwatchSessions++
        totalFocusTime += totalDuration
      } else if (session.mode === "pomodoro") {
        pomodoroSessions++
        if (!session.completedFocusSession || !session.completedBreaks) return
        const focusTime = (completedPomodoros +=
          session.completedFocusSession * pomodoroDurations.focus)
        const breakTime = (completedBreaks +=
          session.completedBreaks * pomodoroDurations.break)

        totalFocusTime += focusTime
        totalBreakTime += breakTime
      }

      longestSession = Math.max(longestSession, totalDuration)

      if (loading)
        if (sessionDate === today) {
          // Today's stats
          todaysSessions++
          todaysTime += totalDuration
        }
    })

    const totalSessions = sessionGlobal.length
    const averageSessionDuration =
      totalSessions > 0 ? (totalFocusTime + totalBreakTime) / totalSessions : 0

    const currentStreak = calculateStreak(sessionGlobal)

    return {
      totalSessions,
      totalFocusTime,
      totalBreakTime,
      stopwatchSessions,
      pomodoroSessions,
      completedPomodoros,
      completedBreaks,
      longestSession,
      todaysSessions,
      todaysTime,
      averageSessionDuration,
      currentStreak,
    }
  }

  const calculateStreak = (sessions: SessionData[]): number => {
    if (sessionGlobal.length === 0) return 0
    const sessionDates = new Set(
      sessions.map((session) => {
        const date = new Date(session.startTime)
        return new Date(
          date.getDate(),
          date.getMonth(),
          date.getFullYear()
        ).getTime()
      })
    )
    const sortedDates = Array.from(sessionDates).sort((a, b) => b - a)

    const today = new Date()
    const todayTime = new Date(
      today.getDate(),
      today.getMonth(),
      today.getFullYear()
    ).getTime()

    let streak = 0
    let currentDate = todayTime

    for (const sessionDate of sortedDates) {
      if (sessionDate === currentDate) {
        streak++
        currentDate -= 24 * 60 * 60 * 1000
      } else if (sessionDate < currentDate - 24 * 60 * 60 * 1000) {
        break
      }
    }

    return streak
  }

  const formatTime = useCallback(formatTimeMain, [])

  const formatTimeInHours = useCallback((time: number) => {
    return time / (24 * 60 * 60 * 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading stats...</div>
      </div>
    )
  }

  if (stats.totalSessions === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4">
        <BarChart3Icon className="text-muted-foreground/50 mb-2 h-8 w-8" />
        <div className="mb-1 text-sm font-medium">No Stats Yet</div>
        <div className="text-muted-foreground text-center text-xs">
          Start a timer to see stats here
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="h-full w-full overflow-hidden">
        {/* Mobile Layout - Full Height */}
        <div className="h-full overflow-y-auto p-4 lg:hidden">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            <h3 className="font-semibold">Your Stats</h3>
          </div>

          {/* Key Metrics Grid */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="bg-background rounded-lg p-3 text-center">
              <ClockIcon className="mx-auto mb-1 h-6 w-6 text-blue-500" />
              <div className="text-lg font-bold">
                {formatTime(stats.totalFocusTime)}
              </div>
              <div className="text-muted-foreground text-xs">Focus Time</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <TrendingUpIcon className="mx-auto mb-1 h-6 w-6 text-green-500" />
              <div className="text-lg font-bold">{stats.totalSessions}</div>
              <div className="text-muted-foreground text-xs">Sessions</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <FlameIcon className="mx-auto mb-1 h-6 w-6 text-orange-500" />
              <div className="text-lg font-bold">{stats.currentStreak}</div>
              <div className="text-muted-foreground text-xs">Day Streak</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <CalendarIcon className="mx-auto mb-1 h-6 w-6 text-purple-500" />
              <div className="text-lg font-bold">
                {formatTime(stats.todaysTime)}
              </div>
              <div className="text-muted-foreground text-xs">Today</div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Session Breakdown</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stopwatch:</span>
                  <span>{stats.stopwatchSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pomodoro:</span>
                  <span>{stats.pomodoroSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{stats.completedPomodoros}</span>
                </div>
                {/* <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Pauses:
                                    </span>
                                    <span>{stats.totalPauses}</span>
                                </div> */}
              </div>
            </div>

            {stats.todaysTime > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daily Progress</span>
                  <span>{formatTime(stats.todaysTime)}</span>
                </div>
                <div className="bg-secondary h-1.5 w-full rounded-full">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (stats.todaysTime / (2 * 60 * 60 * 1000)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-muted-foreground text-center text-xs">
                  Goal: {formatTimeInHours(dailyFocusGoal)} daily
                </div>
              </div>
            )}
            <div className="flex w-full justify-between px-4">
              <Button variant="ghost" size="icon">
                <ChartAreaIcon /> Graph
              </Button>
              {/* <DailyGoalDrawerTrigger name /> */}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Compact Single Row */}
        <div className="hidden lg:flex lg:h-full lg:items-center lg:justify-between lg:px-4">
          {/* Key Metrics - Horizontal */}

          <div className="flex flex-1 items-center gap-6">
            <div className="text-center">
              <div className="mb-1 flex items-center gap-1">
                <ClockIcon className="h-3 w-3 text-blue-500" />
                <div className="text-lg font-bold">
                  {formatTime(stats.totalFocusTime)}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">Focus</div>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center gap-1">
                <TrendingUpIcon className="h-3 w-3 text-green-500" />
                <div className="text-lg font-bold">{stats.totalSessions}</div>
              </div>
              <div className="text-muted-foreground text-xs">Sessions</div>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center gap-1">
                <FlameIcon className="h-3 w-3 text-orange-500" />
                <div className="text-lg font-bold">{stats.currentStreak}</div>
              </div>
              <div className="text-muted-foreground text-xs">Streak</div>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-purple-500" />
                <div className="text-lg font-bold">
                  {formatTime(stats.todaysTime)}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">Today</div>
            </div>
          </div>

          <div className="mx-4 flex gap-x-4">
            <Button variant="ghost" size="icon">
              <ChartAreaIcon />
            </Button>
            {/* <DailyGoalDrawerTrigger /> */}
          </div>

          {/* Today's Progress Bar */}
          {stats.todaysTime > 0 && (
            <div className="w-32 shrink-0">
              <div className="text-muted-foreground mb-1 text-center text-xs">
                Daily Goal: {formatTimeInHours(dailyFocusGoal)} hours
              </div>
              <div className="bg-secondary h-2 w-full rounded-full">
                <Progress
                  value={Math.min(
                    100,
                    (stats.todaysTime / (2 * 60 * 60 * 1000)) * 100
                  )}
                />
              </div>
              <div className="text-muted-foreground mt-1 text-center text-xs">
                {Math.round((stats.todaysTime / (2 * 60 * 60 * 1000)) * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
