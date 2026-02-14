"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/components/providers/settings-provider"
import { SettingsOptions } from "@/components/settings-options"

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useSettings()
  const [tab, setTab] = React.useState<"preferences" | "history">(
    "preferences"
  )

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-xl gap-6">
        <DialogHeader className="items-center">
          <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 rounded-full bg-muted p-1">
          <Button
            variant={tab === "preferences" ? "secondary" : "ghost"}
            className="rounded-full"
            onClick={() => setTab("preferences")}
          >
            Preferences
          </Button>
          <Button
            variant={tab === "history" ? "secondary" : "ghost"}
            className="rounded-full"
            onClick={() => setTab("history")}
          >
            History
          </Button>
        </div>

        {tab === "preferences" ? (
          <div className="space-y-6">
            <p className="text-center text-sm text-muted-foreground">
              Select any of the options:
            </p>
            <SettingsOptions variant="modal" />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
            No preference history yet. Start a session to build your timeline.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
