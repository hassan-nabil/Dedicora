"use client"

import { LayoutPanelLeft, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSettings } from "@/components/providers/settings-provider"

export function TopBar({ showSidebar = false }: { showSidebar?: boolean }) {
  const { setSettingsOpen, setSidebarOpen } = useSettings()

  return (
    <div className="absolute right-6 top-6 flex items-center gap-2">
      {showSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border bg-background/70 shadow-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open task sidebar"
        >
          <LayoutPanelLeft className="h-5 w-5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border bg-background/70 shadow-sm"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  )
}
