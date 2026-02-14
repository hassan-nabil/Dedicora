"use client"

import * as React from "react"

export type ColorBlindMode =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
export type ThemeMode = "light" | "dark"

type SettingsState = {
  audioEnabled: boolean
  colorBlindMode: ColorBlindMode
  themeMode: ThemeMode
  settingsOpen: boolean
  sidebarOpen: boolean
  toggleAudio: () => void
  cycleColorBlindMode: () => void
  toggleTheme: () => void
  setSettingsOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
}

const SettingsContext = React.createContext<SettingsState | null>(null)

const STORAGE_KEY = "dedicora-settings"

const colorBlindModes: ColorBlindMode[] = [
  "normal",
  "protanopia",
  "deuteranopia",
  "tritanopia",
]

export function SettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [audioEnabled, setAudioEnabled] = React.useState(false)
  const [colorBlindMode, setColorBlindMode] = React.useState<ColorBlindMode>(
    "normal"
  )
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("light")
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Partial<SettingsState>
      setAudioEnabled(Boolean(parsed.audioEnabled))
      if (parsed.colorBlindMode) {
        setColorBlindMode(parsed.colorBlindMode)
      }
      if (parsed.themeMode) {
        setThemeMode(parsed.themeMode)
      }
    } catch {
      // Ignore malformed storage.
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const payload = {
      audioEnabled,
      colorBlindMode,
      themeMode,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [audioEnabled, colorBlindMode, themeMode])

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    if (themeMode === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [themeMode])

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    if (colorBlindMode === "normal") {
      root.removeAttribute("data-color-blind")
      return
    }
    root.setAttribute("data-color-blind", colorBlindMode)
  }, [colorBlindMode])

  const toggleAudio = React.useCallback(() => {
    setAudioEnabled((prev) => !prev)
  }, [])

  const cycleColorBlindMode = React.useCallback(() => {
    setColorBlindMode((prev) => {
      const index = colorBlindModes.indexOf(prev)
      return colorBlindModes[(index + 1) % colorBlindModes.length]
    })
  }, [])

  const toggleTheme = React.useCallback(() => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  const value = React.useMemo(
    () => ({
      audioEnabled,
      colorBlindMode,
      themeMode,
      settingsOpen,
      sidebarOpen,
      toggleAudio,
      cycleColorBlindMode,
      toggleTheme,
      setSettingsOpen,
      setSidebarOpen,
    }),
    [
      audioEnabled,
      colorBlindMode,
      themeMode,
      settingsOpen,
      sidebarOpen,
      toggleAudio,
      cycleColorBlindMode,
      toggleTheme,
      setSettingsOpen,
      setSidebarOpen,
    ]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = React.useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
