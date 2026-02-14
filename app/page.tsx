import Link from "next/link"

import { SettingsOptions } from "@/components/settings-options"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-6">
      <main className="flex w-full max-w-4xl flex-col items-center gap-10 rounded-4xl border bg-background/90 px-10 py-16 text-center shadow-(--shadow-strong) backdrop-blur">
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-gradient">
            Welcome!
          </h1>
          <p className="text-base text-muted-foreground">
            Select any of the options:
          </p>
        </div>

        <SettingsOptions />

        <Button asChild className="mt-4 rounded-full px-8 py-6 text-base">
          <Link href="/task" className="flex items-center gap-3">
            Get Started
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </Button>
      </main>
    </div>
  )
}
