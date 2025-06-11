"use client"

import { motion } from "motion/react"

interface ZenFlowLogoProps {
  className?: string
}

export function ZenFlowLogo({ className = "" }: ZenFlowLogoProps) {
  return (
    <motion.div
      className={`mr-2 h-8 w-8 rounded-full border-2 border-[var(--border)] bg-[var(--accent)] ${className}`}
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
