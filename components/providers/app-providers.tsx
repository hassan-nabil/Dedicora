"use client"

import * as React from "react"

import { FlowProvider } from "@/components/providers/flow-provider"
import { SettingsProvider } from "@/components/providers/settings-provider"
import { SettingsModal } from "@/components/settings-modal"
import { AudioController } from "@/components/audio-controller"
import { PageTransition } from "@/components/page-transition"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <FlowProvider>
        <AudioController />
        <SettingsModal />
        <PageTransition>{children}</PageTransition>
      </FlowProvider>
    </SettingsProvider>
  )
}
