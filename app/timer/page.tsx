"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pause, Play, ArrowLeft, ArrowRight, CornerUpLeft } from "lucide-react"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Stickman } from "@/components/stickman"
import { TaskSidebar } from "@/components/task-sidebar"
import { NotesPanel } from "@/components/notes-panel"
import { useFlow } from "@/components/providers/flow-provider"
import { formatTime, toSeconds } from "@/lib/time"

export default function TimerPage() {
  const router = useRouter()
  const { taskList, currentTaskIndex, setCurrentTaskIndex, markTaskDone } =
    useFlow()

  const [isRunning, setIsRunning] = React.useState(true)
  const [isFinished, setIsFinished] = React.useState(false)
  const [remaining, setRemaining] = React.useState(0)
  const [overtime, setOvertime] = React.useState(0)
  const [countingForward, setCountingForward] = React.useState(false)
  const [notesOpen, setNotesOpen] = React.useState(false)

  const currentTask = taskList[currentTaskIndex]
  const allTasksDone = taskList.length > 0 && taskList.every((t) => t.done)

  React.useEffect(() => {
    if (!currentTask) return
    const initialSeconds = toSeconds(
      currentTask.duration.hours,
      currentTask.duration.minutes,
      currentTask.duration.seconds
    )
    setRemaining(initialSeconds)
    setOvertime(0)
    setCountingForward(false)
    setIsRunning(true)
    setIsFinished(false)
  }, [currentTask])

  // Stop everything when all tasks are done
  React.useEffect(() => {
    if (allTasksDone) {
      setIsRunning(false)
      setCountingForward(false)
    }
  }, [allTasksDone])

  React.useEffect(() => {
    if (!currentTask || !isRunning || countingForward || allTasksDone) return

    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          markTaskDone(currentTaskIndex, true)
          setIsFinished(true)
          setCountingForward(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, countingForward, currentTaskIndex, currentTask, markTaskDone, allTasksDone])

  React.useEffect(() => {
    if (!currentTask || !isRunning || !countingForward || allTasksDone) return

    const timer = window.setInterval(() => {
      setOvertime((prev) => prev + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, countingForward, currentTask, allTasksDone])

  const handlePrev = () => {
    if (currentTaskIndex === 0) return
    setCurrentTaskIndex(currentTaskIndex - 1)
  }

  const handleNext = () => {
    if (currentTaskIndex >= taskList.length - 1) return
    setCurrentTaskIndex(currentTaskIndex + 1)
  }

  const handlePauseToggle = () => {
    setIsRunning((prev) => !prev)
  }

  const handleEnd = () => {
    markTaskDone(currentTaskIndex, true)
    setIsFinished(true)
    setIsRunning(false)
    setCountingForward(false)
  }

  const handleReport = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("reportRequested", "true")
    }
    router.push("/report")
  }

  const stickmanState = allTasksDone
    ? "done"
    : isFinished
      ? "working"
      : isRunning
        ? "working"
        : "break"
  const displayTime = countingForward
    ? `+${formatTime(overtime)}`
    : formatTime(remaining)

  return (
    <div className="relative min-h-screen bg-hero px-6 py-10">
      <TopBar showSidebar />
      <TaskSidebar />

      {/* Persistent navigation buttons - always visible */}
      <div className="absolute left-6 top-6 flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => router.push("/task")}
        >
          <CornerUpLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setNotesOpen(true)}
        >
          My Notes
        </Button>
      </div>

      <NotesPanel open={notesOpen} onOpenChange={setNotesOpen} />

      {!currentTask ? (
        <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center text-center">
          <div className="space-y-4 rounded-3xl border bg-card/80 p-8 shadow-(--shadow-soft)">
            <h1 className="text-2xl font-semibold">No tasks found</h1>
            <p className="text-sm text-muted-foreground">
              Add a task first, then return to the timer.
            </p>
            <Button className="rounded-full px-6" onClick={() => router.push("/task")}>
              Add a task
            </Button>
          </div>
        </main>
      ) : allTasksDone ? (
        /* Congratulations screen — shown only when ALL tasks are complete */
        <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
          <div className="space-y-6 rounded-4xl border bg-card/80 p-12 shadow-(--shadow-strong)">
            <Stickman state="done" />
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gradient">
                Congratulations! 🎉
              </h1>
              <p className="text-lg text-muted-foreground">
                You&apos;ve completed all your tasks!
              </p>
              <p className="text-sm text-muted-foreground">
                {taskList.length} task{taskList.length !== 1 ? "s" : ""} finished. Great work staying focused!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button className="rounded-full px-8" onClick={handleReport}>
                Check my productivity
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => router.push("/task")}
              >
                Start new session
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <main className="mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col items-center justify-center gap-8 text-center">
          <div className="flex w-full flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold">{currentTask.title}</h1>
            <p className="text-sm text-muted-foreground">
              Complete this task step by step
            </p>
          </div>

          <div className="grid w-full gap-10 lg:grid-cols-[1fr_2fr]">
            <div className="flex items-center justify-center">
              <Stickman state={stickmanState} />
            </div>
            <div className="flex flex-col items-center gap-8">
              <div className="rounded-4xl border bg-card/70 px-10 py-8 text-6xl font-semibold tracking-[0.15em] text-brand shadow-(--shadow-strong)">
                {displayTime}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  disabled={currentTaskIndex === 0}
                  onClick={handlePrev}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handlePauseToggle}
                >
                  {isRunning ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 rounded-full px-6"
                  onClick={handleEnd}
                >
                  End
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  disabled={currentTaskIndex >= taskList.length - 1}
                  onClick={handleNext}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button className="rounded-full px-8" onClick={handleReport}>
              Check my productivity
            </Button>
          </div>
        </main>
      )}
    </div>
  )
}
