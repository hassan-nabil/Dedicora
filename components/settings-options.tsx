"use client"

import * as React from "react"
import { Eye, Moon, Sun, Volume2, VolumeX } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSettings } from "@/components/providers/settings-provider"

const colorBlindLabels: Record<string, string> = {
  normal: "Normal",
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
  tritanopia: "Tritanopia",
}

type OptionCardProps = {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}

function OptionCard({ label, active, onClick, children }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-28 flex-col items-center gap-3 rounded-2xl px-4 py-5 text-sm font-semibold transition",
        "bg-card/80 shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1",
        "dark:bg-white/5",
        active && "ring-2 ring-brand"
      )}
      aria-pressed={active}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
        {children}
      </span>
      <span>{label}</span>
    </button>
  )
}

type SettingsOptionsProps = {
  className?: string
  variant?: "grid" | "modal"
}

export function SettingsOptions({ className, variant = "grid" }: SettingsOptionsProps) {
  const {
    audioEnabled,
    colorBlindMode,
    themeMode,
    toggleAudio,
    cycleColorBlindMode,
    toggleTheme,
  } = useSettings()

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-6",
        variant === "modal" && "gap-5",
        className
      )}
    >
      <OptionCard
        label={audioEnabled ? "Audio On" : "Audio Off"}
        active={audioEnabled}
        onClick={toggleAudio}
      >
        {audioEnabled ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
      </OptionCard>
      <OptionCard
        label={colorBlindLabels[colorBlindMode] ?? "Normal"}
        active={colorBlindMode !== "normal"}
        onClick={cycleColorBlindMode}
      >
        <Eye className="h-5 w-5" />
      </OptionCard>
      <OptionCard
        label={themeMode === "dark" ? "Dark" : "Light"}
        active={themeMode === "dark"}
        onClick={toggleTheme}
      >
        {themeMode === "dark" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </OptionCard>
    </div>
  )
}
