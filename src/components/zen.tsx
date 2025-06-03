"use client"

import { motion } from "motion/react"

interface ZenFlowLogoProps {
  className?: string
}

export function ZenFlowLogo({ className = "" }: ZenFlowLogoProps) {
  return (
    <motion.div
      className={`border-[var (--border)] bg-[var (--foreground)] mr-2 h-8 w-8 rounded-full border-2 ${className}`}
      whileHover={{
        scale: [1, 1.1, 1, 1.05, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    />
  )
}
