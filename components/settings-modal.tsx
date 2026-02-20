"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSettings } from "@/components/providers/settings-provider"
import { SettingsOptions } from "@/components/settings-options"

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useSettings()

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-xl gap-6">
        <DialogHeader className="items-center">
          <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-center text-sm text-muted-foreground">
            Select any of the options:
          </p>
          <SettingsOptions variant="modal" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
