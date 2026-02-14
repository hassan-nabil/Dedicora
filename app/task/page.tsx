"use client"

import { useRouter } from "next/navigation"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useFlow } from "@/components/providers/flow-provider"

const sampleTask = "Complete math and science homework before dinner"

export default function TaskPage() {
  const router = useRouter()
  const { mainTask, setMainTask, setMode } = useFlow()

  const handleNavigate = (mode: "single" | "breakdown") => {
    setMode(mode)
    router.push(`/assign?mode=${mode}`)
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
          >
            Only This
          </Button>
          <Button
            className="rounded-full px-8"
            onClick={() => handleNavigate("breakdown")}
          >
            Break It Down
          </Button>
        </div>
      </main>
    </div>
  )
}
