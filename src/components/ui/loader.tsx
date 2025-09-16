"use client"

import { motion } from "motion/react"

export const LoaderFive = ({ text }: { text: string }) => {
  return (
    <div className="font-medium tracking-wide">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.08,
            ease: "easeInOut",
            repeatDelay: 1,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  )
}
