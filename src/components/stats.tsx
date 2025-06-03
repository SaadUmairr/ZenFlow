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

import { formatDuration, formatTimeMain } from "@/lib/utils"

import { DailyGoalDrawerTrigger } from "./overlay"
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
    let totalFocus = 0,
      totalBreak = 0
    let swSessions = 0,
      pomoSessions = 0
    let compPomo = 0,
      compBreaks = 0
    let longest = 0,
      todayCount = 0,
      todayMs = 0

    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()

    for (const session of sessionGlobal) {
      const start = new Date(session.startTime)
      const duration = session.actualFocusTime
      longest = Math.max(longest, duration)

      // count stopwatch/countdown
      if (session.mode === "stopwatch" || session.mode === "countdown") {
        swSessions++
        totalFocus += duration
      } else if (session.mode === "pomodoro") {
        pomoSessions++
        if (!session.completedFocusSession || !session.completedBreaks) {
          continue
        }
        compPomo += session.completedFocusSession
        compBreaks += session.completedBreaks
        totalFocus += session.completedFocusSession * pomodoroDurations.focus
        totalBreak += session.completedBreaks * pomodoroDurations.break
      }

      // today’s stats
      const sessionDay = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      ).getTime()
      if (sessionDay === todayStart) {
        todayCount++
        todayMs += duration
      }
    }

    const totalSessions = sessionGlobal.length
    const avgMs =
      totalSessions > 0
        ? Math.floor((totalFocus + totalBreak) / totalSessions)
        : 0

    return {
      totalSessions,
      totalFocusTime: totalFocus,
      totalBreakTime: totalBreak,
      stopwatchSessions: swSessions,
      pomodoroSessions: pomoSessions,
      completedPomodoros: compPomo,
      completedBreaks: compBreaks,
      longestSession: longest,
      todaysSessions: todayCount,
      todaysTime: todayMs,
      averageSessionDuration: avgMs,
      currentStreak: calculateStreak(sessionGlobal),
    }
  }

  function calculateStreak(sessions: SessionData[]) {
    const dates = new Set(
      sessions.map((s) => {
        const d = new Date(s.startTime)
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      })
    )

    const today = new Date()
    let current = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime()

    let streak = 0
    // walk backwards day by day
    while (dates.has(current)) {
      streak++
      current -= 24 * 60 * 60 * 1000
    }
    return streak
  }

  const formatTime = useCallback(formatTimeMain, [])

  const formatTimeInHours = useCallback((time: number) => {
    return time / (60 * 60 * 1000)
  }, [])

  const formatDurationCB = useCallback(formatDuration, [])

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
                {formatDurationCB(stats.totalFocusTime)}
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
                {formatDurationCB(stats.todaysTime)}
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
              </div>
            </div>

            {stats.todaysTime > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daily Progress</span>
                  <span> {formatDurationCB(stats.todaysTime)}</span>
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
                  Goal: {formatTimeInHours(dailyFocusGoal)} hours daily
                </div>
              </div>
            )}
            <div className="flex w-full justify-between px-4">
              <Button variant="ghost" size="icon">
                <ChartAreaIcon /> Graph
              </Button>
              <DailyGoalDrawerTrigger name />
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
                  {formatDurationCB(stats.totalFocusTime)}
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
                  {formatDurationCB(stats.todaysTime)}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">Today</div>
            </div>
          </div>

          <div className="mx-4 flex gap-x-4">
            <Button variant="ghost" size="icon">
              <ChartAreaIcon />
            </Button>
            <DailyGoalDrawerTrigger />
          </div>

          {/* Today's Progress Bar */}
          {stats.todaysTime > 0 && (
            <div className="w-32 shrink-0">
              <div className="text-muted-foreground text-center text-xs">
                Goal: {formatTimeInHours(dailyFocusGoal)} hours daily
              </div>
              <div className="bg-secondary h-2 w-full rounded-full">
                <Progress
                  value={Math.min(
                    100,
                    (stats.todaysTime / dailyFocusGoal) * 100
                  )}
                />
              </div>
              <div className="text-muted-foreground mt-1 text-center text-xs">
                {Math.min(
                  100,
                  Math.round((stats.todaysTime / dailyFocusGoal) * 100)
                )}
                %
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
