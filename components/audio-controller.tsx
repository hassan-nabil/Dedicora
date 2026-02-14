"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { getAudioForPath } from "@/lib/audio-map"
import { useSettings } from "@/components/providers/settings-provider"

export function AudioController() {
  const pathname = usePathname()
  const { audioEnabled } = useSettings()
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    if (!audioEnabled) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      return
    }

    const src = getAudioForPath(pathname)
    if (!src) return

    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const audio = audioRef.current
    audio.pause()
    audio.currentTime = 0
    audio.src = src
    audio.load()

    audio.play().catch(() => {
      // Ignore autoplay restrictions or missing files.
    })

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [audioEnabled, pathname])

  return null
}
