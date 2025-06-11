"use client"

import Image from "next/image"
import Link from "next/link"

import GitHubLogo from "../../public/github.svg"
import { Button } from "./ui/button"

export function Github() {
  return (
    <Link
      href="https://github.com/SaadUmairr/ZenFlow"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button
        variant="ghost"
        size="icon"
        className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
      >
        <Image
          src={GitHubLogo}
          alt="GitHub"
          width={20}
          height={20}
          className="github-icon transition-all duration-300"
        />
      </Button>
    </Link>
  )
}
