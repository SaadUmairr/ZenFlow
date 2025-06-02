import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeMain(milliseconds: number) {
  const minutes = Math.floor(Math.abs(milliseconds) / 60000)
  const seconds = Math.floor((Math.abs(milliseconds) % 60000) / 1000)
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}
