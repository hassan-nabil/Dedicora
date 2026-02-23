"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useFlow } from "@/components/providers/flow-provider"

const sampleTask = "Complete math and science homework before dinner"

export default function TaskPage() {
  const router = useRouter()
  const { mainTask, setMainTask, setMode, setSessionId } = useFlow()
  const [creating, setCreating] = React.useState(false)

  const handleNavigate = async (mode: "single" | "breakdown") => {
    if (!mainTask.trim()) return
    setMode(mode)
    setCreating(true)

    try {
      // Create session in DB
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: mainTask.trim(), mode }),
      })

      if (res.ok) {
        const session = await res.json()
        setSessionId(session.id)
        router.push(`/assign?mode=${mode}&session=${session.id}`)
      } else {
        // Fallback: local-only mode
        router.push(`/assign?mode=${mode}`)
      }
    } catch {
      // Fallback: local-only mode
      router.push(`/assign?mode=${mode}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero px-6">
      <TopBar />
      <main className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-semibold text-foreground">
          What is your task?
        </h1>
        <div className="mt-10 rounded-3xl border bg-card/80 p-6 shadow-(--shadow-soft)">
          <Textarea
            value={mainTask}
            onChange={(event) => setMainTask(event.target.value)}
            placeholder={sampleTask}
            className="min-h-35 text-base"
          />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="outline"
            className="rounded-full px-8"
            onClick={() => handleNavigate("single")}
            disabled={creating || !mainTask.trim()}
          >
            {creating ? "Creating..." : "Only This"}
          </Button>
          <Button
            className="rounded-full px-8"
            onClick={() => handleNavigate("breakdown")}
            disabled={creating || !mainTask.trim()}
          >
            {creating ? "Creating..." : "Break It Down"}
          </Button>
        </div>
      </main>
    </div>
  )
}
