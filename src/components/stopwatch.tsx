"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  allSessionSavedDataAtom,
  isPomodoroBreakAtom,
  PomodoroDurationsAtom,
  timerAtom,
} from "@/context/data"
import { saveSessionDataIDB } from "@/utils/idb.util"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  ChevronDownIcon,
  ClockIcon,
  HourglassIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  StopCircleIcon,
  TimerIcon,
} from "lucide-react"

import { formatTimeMain } from "@/lib/utils"

import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

type Mode = "stopwatch" | "pomodoro" | "countdown"
type PomodoroPhase = "focus" | "break"

export interface PomodoroStats {
  completedFocusSession: number
  completedBreaks: number
  pomoFocusTime: number
  cycleStartTime: number
  cycleEndTime: number
}

export interface SessionData extends Partial<PomodoroStats> {
  id: string
  mode: Mode
  date: string
  startTime: number
  endTime: number
  wasCompleted: boolean
  totalPauseTime?: number
  actualFocusTime: number
}

const COUNTDOWN_OPTIONS = [
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "15 minutes", value: 15 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "45 minutes", value: 45 * 60 * 1000 },
  { label: "60 minutes", value: 60 * 60 * 1000 },
]

export function Stopwatch() {
  // Global states
  const setPomoBreak = useSetAtom(isPomodoroBreakAtom)
  const setSaveAllSession = useSetAtom(allSessionSavedDataAtom)
  const pomodoroDuration = useAtomValue(PomodoroDurationsAtom)

  const POMO_FOCUS_DURATION = pomodoroDuration.focus
  const POMO_BREAK_DURATION = pomodoroDuration.break

  // STATES
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [time, setTime] = useAtom(timerAtom)
  const [mode, setMode] = useState<Mode>("stopwatch")
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("focus")
  const [isTransitioning, setIsTransitionging] = useState<boolean>(false)

  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null)
  const [totalPauseTime, setTotalPauseTime] = useState(0)

  // Session States
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats>({
    completedFocusSession: 0,
    completedBreaks: 0,
    pomoFocusTime: pomodoroDuration.focus,
    cycleStartTime: 0,
    cycleEndTime: 0,
  })

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const phaseTransitionRef = useRef<boolean>(false)

  // Functions

  const startNewSession = useCallback(async () => {
    try {
      const now = Date.now()

      const newSessionId = `${mode}_${now}_${Math.random()
        .toString(36)
        .slice(2, 11)}`

      // Setting the session states
      setSessionId(newSessionId)
      setSessionStartTime(now)

      // Reset pause tracking for new session
      setTotalPauseTime(0)
      setPauseStartTime(null)
      setIsPaused(false)

      if (mode === "pomodoro") {
        setPomodoroStats({
          completedFocusSession: 0,
          completedBreaks: 0,
          pomoFocusTime: pomodoroDuration.focus,
          cycleStartTime: now,
          cycleEndTime: 0,
        })
      }
    } catch {
      console.error("Error starting new session")
    }
  }, [mode])

  const endCurrentSession = useCallback(
    async (wasCompleted: boolean = false) => {
      if (!sessionId || !sessionStartTime) return

      try {
        const now = Date.now()
        let finalPauseTime = totalPauseTime

        if (isPaused && pauseStartTime) finalPauseTime += now - pauseStartTime

        let actualFocusTime = 0
        const totalSessionDuration = now - sessionStartTime

        actualFocusTime = Math.max(0, totalSessionDuration - finalPauseTime)

        const sessionData: SessionData = {
          id: sessionId,
          mode,
          date: new Date(now).toISOString().split("T")[0],
          startTime: sessionStartTime,
          endTime: now,
          wasCompleted,
          totalPauseTime: finalPauseTime,
          actualFocusTime: Math.max(0, actualFocusTime),
        }

        if (mode === "pomodoro") {
          sessionData.completedFocusSession =
            pomodoroStats.completedFocusSession
          sessionData.completedBreaks = pomodoroStats.completedBreaks
          sessionData.cycleStartTime = pomodoroStats.cycleStartTime
          sessionData.cycleEndTime = pomodoroStats.cycleEndTime
        }

        await saveSessionDataIDB(sessionData)

        setSaveAllSession((prev) => {
          const filteredPrev = prev.filter((s) => s.id !== sessionId)
          return [...filteredPrev, sessionData]
        })

        console.log("SAVING: ", sessionData)
      } catch (error) {
        console.error("Error ending session:", error)
      } finally {
        // Reset session state
        setSessionId(null)
        setSessionStartTime(null)
        setTotalPauseTime(0)
        setPauseStartTime(null)
        setIsPaused(false)
      }
    },
    [
      sessionId,
      sessionStartTime,
      totalPauseTime,
      isPaused,
      pauseStartTime,
      mode,
      pomodoroStats,
      POMO_FOCUS_DURATION,
      pomodoroPhase,
      isTimerRunning,
      time,
      setSaveAllSession,
    ]
  )

  // const endCurrentSession = useCallback(
  //   async (wasCompleted: boolean = false) => {
  //     if (!sessionId || !sessionStartTime) return

  //     try {
  //       const now = Date.now()

  //       // Calculate final pause time if currently paused
  //       let finalPauseTime = totalPauseTime
  //       if (isPaused && pauseStartTime) {
  //         finalPauseTime += now - pauseStartTime
  //       }

  //       let actualFocusTime = 0

  //       if (mode === "pomodoro") {
  //         actualFocusTime =
  //           pomodoroStats.completedFocusSession * POMO_FOCUS_DURATION

  //         if (pomodoroPhase === "focus" && isTimerRunning) {
  //           const currentPhaseTime = POMO_FOCUS_DURATION - time
  //           if (currentPhaseTime > 0) {
  //             actualFocusTime += currentPhaseTime
  //           }
  //         }
  //       } else {
  //         const totalSessionDuration = now - sessionStartTime
  //         actualFocusTime = Math.max(0, totalSessionDuration - finalPauseTime)
  //       }

  //       const sessionData: SessionData = {
  //         id: sessionId,
  //         mode,
  //         date: new Date(now).toISOString().split("T")[0],
  //         startTime: sessionStartTime,
  //         endTime: now,
  //         wasCompleted,
  //         totalPauseTime: finalPauseTime,
  //         actualFocusTime: Math.max(0, actualFocusTime),
  //       }

  //       // Add Pomodoro stats if in Pomodoro mode
  //       if (mode === "pomodoro") {
  //         sessionData.completedFocusSession =
  //           pomodoroStats.completedFocusSession
  //         sessionData.completedBreaks = pomodoroStats.completedBreaks
  //         sessionData.cycleStartTime = pomodoroStats.cycleStartTime
  //         sessionData.cycleEndTime = now
  //       }

  //       await saveSessionDataIDB(sessionData)
  //       setSaveAllSession((prev) => {
  //         // Remove any existing session with same ID (to prevent duplicates)
  //         const filteredPrev = prev.filter((s) => s.id !== sessionId)
  //         return [...filteredPrev, sessionData]
  //       })

  //       console.log("SAVING SESSION: ", sessionData)
  //     } catch (error) {
  //       console.error("Error ending session:", error)
  //     } finally {
  //       // Reset session state
  //       setSessionId(null)
  //       setSessionStartTime(null)
  //       setTotalPauseTime(0)
  //       setPauseStartTime(null)
  //       setIsPaused(false)
  //     }
  //   },
  //   [
  //     sessionId,
  //     sessionStartTime,
  //     totalPauseTime,
  //     isPaused,
  //     pauseStartTime,
  //     mode,
  //     pomodoroStats,
  //     POMO_FOCUS_DURATION,
  //     pomodoroPhase,
  //     isTimerRunning,
  //     time,
  //     setSaveAllSession,
  //   ]
  // )

  const startStopwatch = useCallback(async () => {
    try {
      if (sessionId) return

      await startNewSession()
      setIsTimerRunning(true)
      setMode("stopwatch")
      setTime(0)
      phaseTransitionRef.current = false
    } catch (error) {
      console.error("Error starting stopwatch:", error)
    }
  }, [sessionId, startNewSession])

  const handleStop = useCallback(async () => {
    try {
      setIsTimerRunning(false)

      // End current session before resetting states
      if (sessionId) await endCurrentSession(false)

      const now = Date.now()

      if (mode === "stopwatch") {
        setTime(0)
      } else if (mode === "countdown") {
        setTime(0)
      } else {
        setTime(POMO_FOCUS_DURATION)
        setPomodoroPhase("focus")
        setPomodoroStats((prev) => ({ ...prev, cycleEndTime: now }))
        setIsTransitionging(false)
        phaseTransitionRef.current = false
      }

      setIsPaused(false)
      setPauseStartTime(null)
      setTotalPauseTime(0)
    } catch (error) {
      console.error("Error in handleStop:", error)
    }
  }, [sessionId, mode, endCurrentSession, POMO_FOCUS_DURATION])

  const handleStartPause = useCallback(async () => {
    if (!isTimerRunning || !sessionId) return

    const now = Date.now()

    try {
      if (isPaused) {
        // Resuming from pause
        if (pauseStartTime) {
          const pauseDuration = now - pauseStartTime
          setTotalPauseTime((prev) => prev + pauseDuration)
        }
        setIsPaused(false)
        setPauseStartTime(null)
      } else {
        // Starting pause
        setIsPaused(true)
        setPauseStartTime(now)
      }
    } catch (error) {
      console.error("Error in handleStartPause:", error)
    }
  }, [isTimerRunning, sessionId, isPaused, pauseStartTime])

  const startPomodoro = useCallback(async () => {
    if (sessionId && mode !== "pomodoro") await endCurrentSession(false)

    setMode("pomodoro")
    setPomodoroPhase("focus")
    setTime(POMO_FOCUS_DURATION)

    await startNewSession()
    setIsTimerRunning(true)
  }, [sessionId, mode, endCurrentSession, POMO_FOCUS_DURATION, startNewSession])

  const startCountdown = useCallback(
    async (duration: number) => {
      try {
        if (sessionId && mode !== "countdown") await endCurrentSession(false)

        setMode("countdown")
        setTime(duration)

        await startNewSession()
        setIsTimerRunning(true)
      } catch (error) {
        console.error("Error starting countdown:", error)
      }
    },
    [sessionId, mode, endCurrentSession, startNewSession]
  )

  // NEW: Skip Phase Function
  const handleSkipPhase = useCallback(() => {
    if (mode !== "pomodoro" || !isTimerRunning || isTransitioning) return

    // Force phase transition by setting time to 0
    setTime(0)
  }, [mode, isTimerRunning, isTransitioning])

  const handlePomodoroPhaseEnd = useCallback(async () => {
    if (isTransitioning || phaseTransitionRef.current) return

    setIsTransitionging(true)
    phaseTransitionRef.current = true

    try {
      if (pomodoroPhase === "focus") {
        // Increment completed focus sessions
        setPomodoroStats((prev) => ({
          ...prev,
          completedFocusSession: prev.completedFocusSession + 1,
        }))

        setPomoBreak(true)
        setPomodoroPhase("break")
        setTime(POMO_BREAK_DURATION)
      } else if (pomodoroPhase === "break") {
        // Increment completed breaks
        setPomodoroStats((prev) => ({
          ...prev,
          completedBreaks: prev.completedBreaks + 1,
        }))

        setPomoBreak(false)
        setPomodoroPhase("focus")
        setTime(POMO_FOCUS_DURATION)
      }

      // NOTE: Removed session saving here to prevent double counting
      // Session will only be saved when the entire pomodoro session ends
    } catch (error) {
      console.error("Error in phase transition:", error)
    } finally {
      setTimeout(() => {
        setIsTransitionging(false)
        phaseTransitionRef.current = false
      }, 750)
    }
  }, [
    pomodoroPhase,
    isTransitioning,
    POMO_BREAK_DURATION,
    POMO_FOCUS_DURATION,
    setPomoBreak,
  ])

  const handleCountdownEnd = useCallback(async () => {
    try {
      setIsTimerRunning(false)
      if (sessionId) await endCurrentSession(true)
      setTime(0)
    } catch (error) {
      console.error("Error ending countdown:", error)
    }
  }, [sessionId, endCurrentSession])

  const formatTime = useCallback(formatTimeMain, [])

  const getTimerTransitionStatus = useCallback(() => {
    if (isTransitioning) return "Transitioning..."
    if (mode === "stopwatch")
      return isTimerRunning
        ? "Stopwatch Running"
        : isPaused
          ? "Stopwatch Paused"
          : "Stopwatch Stopped"
    if (mode === "countdown")
      return isTimerRunning ? "Countdown Active" : "Countdown stopped"
    const pomoPhase = pomodoroPhase === "focus" ? "Focus" : "Break"
    const stateText = isTimerRunning ? "Active" : "Paused"
    return `Pomodoro ${pomoPhase} ${stateText}`
  }, [mode, isTimerRunning, pomodoroPhase, isTransitioning])

  // Timer Effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!isTimerRunning || isTransitioning || isPaused) return

    intervalRef.current = setInterval(() => {
      setTime((prevTime) => {
        try {
          if (mode === "countdown" || mode === "pomodoro") {
            const newTime = prevTime - 1000
            if (newTime <= 0) {
              if (mode === "pomodoro") {
                setTimeout(() => {
                  handlePomodoroPhaseEnd()
                }, 250)
                return 0
              } else if (mode === "countdown") {
                setTimeout(() => {
                  handleCountdownEnd()
                }, 250)
                return 0
              }
            }
            return newTime
          } else {
            return prevTime + 1000
          }
        } catch (error) {
          console.error("Timer error:", error)
          return prevTime
        }
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    mode,
    isTimerRunning,
    isPaused,
    isTransitioning,
    handlePomodoroPhaseEnd,
    handleCountdownEnd,
  ])

  return (
    <>
      <div className="flex h-full w-full items-center justify-center">
        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:w-full lg:items-center lg:justify-between lg:gap-4 lg:px-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-2xl font-bold xl:text-3xl">
              {formatTime(time)}
            </div>
          </div>
          {(isTimerRunning && (
            <div className="flex shrink-0 gap-1">
              <Button
                onClick={handleStartPause}
                variant="outline"
                size="sm"
                disabled={isTransitioning}
                className="h-10 w-10"
              >
                {isPaused ? (
                  <PlayIcon className="h-4 w-4" />
                ) : (
                  <PauseIcon className="h-4 w-4" />
                )}
              </Button>

              {/* Skip Phase Button - Only show for Pomodoro */}
              {mode === "pomodoro" && (
                <Button
                  onClick={handleSkipPhase}
                  variant="outline"
                  size="sm"
                  disabled={isTransitioning}
                  className="h-10 w-10"
                  title={`Skip ${pomodoroPhase === "focus" ? "Focus" : "Break"}`}
                >
                  <SkipForwardIcon className="h-4 w-4" />
                </Button>
              )}

              <Button
                onClick={handleStop}
                variant={isTimerRunning ? "destructive" : "outline"}
                size="sm"
                disabled={isTransitioning}
                className="h-10 w-10"
              >
                {isTimerRunning ? (
                  <StopCircleIcon className="h-4 w-4" />
                ) : (
                  <RotateCcwIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          )) || (
            <div className="flex grow justify-end gap-2">
              {/* Stopwatch Button */}
              <Button
                onClick={startStopwatch}
                variant="outline"
                disabled={isTransitioning}
                title="Start Stopwatch"
                className="group relative overflow-hidden transition-all duration-200 hover:pr-12"
              >
                <div className="flex items-center">
                  <TimerIcon className="h-4 w-4" />
                </div>
              </Button>

              {/* Countdown Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isTransitioning}
                    title="Start Countdown"
                    className="group relative overflow-hidden transition-all duration-200 hover:pr-12"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4" />
                      <ChevronDownIcon className="ml-1 h-3 w-3" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {COUNTDOWN_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => startCountdown(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pomodoro Button */}
              <Button
                onClick={startPomodoro}
                variant="outline"
                disabled={isTransitioning}
                title="Start Pomodoro"
                className="group relative overflow-hidden transition-all duration-200 hover:pr-12"
              >
                <div className="flex items-center">
                  <HourglassIcon className="h-4 w-4" />
                </div>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="mx-auto w-full max-w-md px-4 lg:hidden">
          {/* Timer Display */}
          <div className="mb-8 text-center">
            <div className="mb-3 font-mono text-4xl font-bold md:text-5xl">
              {formatTime(time)}
            </div>
            <div className="text-muted-foreground text-sm">
              {getTimerTransitionStatus()}
            </div>
          </div>

          {/* Control Buttons when timer is running */}
          {isTimerRunning && (
            <div className="mb-6 flex justify-center gap-3">
              <Button
                onClick={handleStartPause}
                variant="outline"
                size="lg"
                disabled={isTransitioning}
                className="flex items-center gap-2"
              >
                {isPaused ? (
                  <>
                    <PlayIcon className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <PauseIcon className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>

              {/* Skip Phase Button - Only show for Pomodoro */}
              {mode === "pomodoro" && (
                <Button
                  onClick={handleSkipPhase}
                  variant="outline"
                  size="lg"
                  disabled={isTransitioning}
                  className="flex items-center gap-2"
                >
                  <SkipForwardIcon className="h-4 w-4" />
                  Skip
                </Button>
              )}

              <Button
                onClick={handleStop}
                variant="destructive"
                size="lg"
                disabled={isTransitioning}
                className="flex items-center gap-2"
              >
                <StopCircleIcon className="h-4 w-4" />
                Stop
              </Button>
            </div>
          )}

          {/* Start Buttons when timer is not running */}
          {!isTimerRunning && (
            <div className="space-y-3">
              {/* First Row: Stopwatch and Countdown */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={startStopwatch}
                  variant="outline"
                  size="lg"
                  disabled={isTransitioning}
                  className="flex h-12 items-center justify-center gap-2"
                >
                  <TimerIcon className="h-4 w-4" />
                  <span>Stopwatch</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={isTransitioning}
                      className="flex h-12 items-center justify-center gap-2"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span>Countdown</span>
                      <ChevronDownIcon className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {COUNTDOWN_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => startCountdown(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Second Row: Pomodoro */}
              <Button
                onClick={startPomodoro}
                variant="outline"
                size="lg"
                disabled={isTransitioning}
                className="flex h-12 w-full items-center justify-center gap-2"
              >
                <HourglassIcon className="h-4 w-4" />
                <span>Pomodoro</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
