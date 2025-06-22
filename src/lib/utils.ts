import { clsx, type ClassValue } from "clsx"
import { intervalToDuration } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeMain(milliseconds: number) {
  const abs = Math.abs(milliseconds)
  const totalSeconds = Math.floor(abs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
}
export function formatDuration(ms: number): string {
  if (ms < 0) return "Invalid Duration"

  const duration = intervalToDuration({ start: 0, end: ms })

  const { years, months, days, hours, minutes, seconds } = duration

  // Helper to ensure numbers are not undefined, defaulting to 0
  const getVal = (num: number | undefined): number => num || 0

  if (years && years > 0) {
    return `${getVal(years)}Yr ${getVal(months)}M`
  } else if (months && months > 0) {
    return `${getVal(months)}M ${getVal(days)}D`
  } else if (days && days > 0) {
    return `${getVal(days)}D ${getVal(hours)}H`
  } else if (hours && hours > 0) {
    const paddedHours = String(getVal(hours)).padStart(2, "0")
    const paddedMinutes = String(getVal(minutes)).padStart(2, "0")
    return `${paddedHours}h ${paddedMinutes}m`
  } else if (minutes && minutes > 0) {
    const paddedMinutes = String(getVal(minutes)).padStart(2, "0")
    const paddedSeconds = String(getVal(seconds)).padStart(2, "0")
    return `${paddedMinutes}m ${paddedSeconds}s`
  } else {
    return `${getVal(seconds)}s`
  }
}
