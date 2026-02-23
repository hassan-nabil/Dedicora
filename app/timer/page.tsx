"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Pause, Play, ArrowLeft, ArrowRight, CornerUpLeft, Bot } from "lucide-react"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Stickman } from "@/components/stickman"
import { TaskSidebar } from "@/components/task-sidebar"
import { NotesPanel } from "@/components/notes-panel"
import { ChatPanel } from "@/components/chat-panel"
import { useFlow } from "@/components/providers/flow-provider"
import { formatTime, toSeconds } from "@/lib/time"

function TimerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  const {
    taskList, currentTaskIndex, setCurrentTaskIndex, markTaskDone,
    sessionId, setSessionId, loadSession,
  } = useFlow()

  const [isRunning, setIsRunning] = React.useState(true)
  const [isFinished, setIsFinished] = React.useState(false)
  const [remaining, setRemaining] = React.useState(0)
  const [overtime, setOvertime] = React.useState(0)
  const [countingForward, setCountingForward] = React.useState(false)
  const [notesOpen, setNotesOpen] = React.useState(false)
  const [chatOpen, setChatOpen] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  // Track actual time spent on current task
  const actualSecondsRef = React.useRef(0)
  // Guard: last task index we initialized for (prevents re-init on same index)
  const lastInitIndexRef = React.useRef(-1)
  // Per-task timer state map: index → { remaining, overtime, countingForward, actualSeconds, isFinished }
  const taskTimersRef = React.useRef<Map<number, { remaining: number; overtime: number; countingForward: boolean; actualSeconds: number; isFinished: boolean }>>(new Map())

  const currentTask = taskList[currentTaskIndex]
  const allTasksDone = taskList.length > 0 && taskList.every((t) => t.done)

  // Save the current task's timer state into the map
  const saveCurrentTimerState = React.useCallback(() => {
    taskTimersRef.current.set(lastInitIndexRef.current, {
      remaining,
      overtime,
      countingForward,
      actualSeconds: actualSecondsRef.current,
      isFinished,
    })
  }, [remaining, overtime, countingForward, isFinished])

  // Load session from DB if URL has session param
  React.useEffect(() => {
    if (sessionParam && !loaded && !sessionId) {
      setLoaded(true)
      setSessionId(sessionParam)
      loadSession(sessionParam)
    } else if (sessionParam && !sessionId) {
      setSessionId(sessionParam)
    }
  }, [sessionParam, loaded, sessionId, setSessionId, loadSession])

  // Initialize timer when task INDEX changes (not object reference)
  React.useEffect(() => {
    if (!currentTask) return
    if (lastInitIndexRef.current === currentTaskIndex) return // same task, skip
    lastInitIndexRef.current = currentTaskIndex

    // Check for saved state first (restoring after navigation)
    const saved = taskTimersRef.current.get(currentTaskIndex)
    if (saved) {
      setRemaining(saved.remaining)
      setOvertime(saved.overtime)
      setCountingForward(saved.countingForward)
      setIsFinished(saved.isFinished)
      setIsRunning(!saved.isFinished)
      actualSecondsRef.current = saved.actualSeconds
    } else {
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
      actualSecondsRef.current = currentTask.actualSeconds ?? 0
    }
  }, [currentTaskIndex, taskList.length, currentTask])

  // Stop everything when all tasks are done
  React.useEffect(() => {
    if (allTasksDone) {
      setIsRunning(false)
      setCountingForward(false)
    }
  }, [allTasksDone])

  // Countdown timer
  React.useEffect(() => {
    if (!currentTask || !isRunning || countingForward || allTasksDone) return

    const timer = window.setInterval(() => {
      actualSecondsRef.current += 1
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

  // Overtime counter
  React.useEffect(() => {
    if (!currentTask || !isRunning || !countingForward || allTasksDone) return

    const timer = window.setInterval(() => {
      actualSecondsRef.current += 1
      setOvertime((prev) => prev + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, countingForward, currentTask, allTasksDone])

  // Persist timer state to DB every 5 seconds
  React.useEffect(() => {
    const sid = sessionId ?? sessionParam
    if (!sid || !isRunning) return

    const persistTimer = window.setInterval(async () => {
      // Save current task progress
      if (currentTask?.dbId) {
        try {
          await fetch(`/api/tasks/${currentTask.dbId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actual_seconds: actualSecondsRef.current,
              overtime_seconds: overtime,
              status: currentTask.done ? "completed" : "active",
            }),
          })
        } catch {
          // Silently fail
        }
      }

      // Save session aggregate
      const totalActual = taskList.reduce((sum, t, i) => {
        if (i === currentTaskIndex) return sum + actualSecondsRef.current
        return sum + (t.actualSeconds ?? 0)
      }, 0)
      const totalOvertime = taskList.reduce((sum, t, i) => {
        if (i === currentTaskIndex) return sum + overtime
        return sum + (t.overtimeSeconds ?? 0)
      }, 0)

      try {
        await fetch(`/api/sessions/${sid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_task_index: currentTaskIndex,
            total_actual_seconds: totalActual,
            total_overtime_seconds: totalOvertime,
          }),
        })
      } catch {
        // Silently fail
      }
    }, 5000)

    return () => window.clearInterval(persistTimer)
  }, [sessionId, sessionParam, isRunning, currentTask, currentTaskIndex, overtime, taskList])

  const handlePrev = () => {
    if (currentTaskIndex === 0) return
    saveCurrentTimerState()
    lastInitIndexRef.current = -1 // allow re-init for new index
    setCurrentTaskIndex(currentTaskIndex - 1)
  }

  const handleNext = () => {
    if (currentTaskIndex >= taskList.length - 1) return
    saveCurrentTimerState()
    lastInitIndexRef.current = -1
    setCurrentTaskIndex(currentTaskIndex + 1)
  }

  const handlePauseToggle = () => {
    setIsRunning((prev) => !prev)
  }

  const handleEnd = async () => {
    markTaskDone(currentTaskIndex, true)

    // Save completed state for this task
    taskTimersRef.current.set(currentTaskIndex, {
      remaining: 0,
      overtime,
      countingForward: false,
      actualSeconds: actualSecondsRef.current,
      isFinished: true,
    })

    // Persist task completion to DB
    if (currentTask?.dbId) {
      try {
        await fetch(`/api/tasks/${currentTask.dbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actual_seconds: actualSecondsRef.current,
            overtime_seconds: overtime,
            status: "completed",
            completed_at: new Date().toISOString(),
          }),
        })
      } catch {
        // Silently fail
      }
    }

    // Auto-advance to next incomplete task
    const nextIncomplete = taskList.findIndex((t, i) => i > currentTaskIndex && !t.done)
    if (nextIncomplete !== -1) {
      lastInitIndexRef.current = -1
      setCurrentTaskIndex(nextIncomplete)
    } else {
      // No more tasks — stay on current, show finished state
      setIsFinished(true)
      setIsRunning(false)
      setCountingForward(false)
    }
  }

  const handleReport = async () => {
    const sid = sessionId ?? sessionParam

    // Mark session as completed
    if (sid) {
      try {
        const totalActual = taskList.reduce((sum, t, i) => {
          if (i === currentTaskIndex) return sum + actualSecondsRef.current
          return sum + (t.actualSeconds ?? 0)
        }, 0)

        await fetch(`/api/sessions/${sid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: allTasksDone ? "completed" : "paused",
            current_step: "report",
            total_actual_seconds: totalActual,
            completed_at: allTasksDone ? new Date().toISOString() : null,
          }),
        })
      } catch {
        // Continue anyway
      }
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("reportRequested", "true")
    }
    router.push(sid ? `/report?session=${sid}` : "/report")
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
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setChatOpen(true)}
        >
          <Bot className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      <NotesPanel open={notesOpen} onOpenChange={setNotesOpen} />
      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />

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

export default function TimerPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-hero" />}>
      <TimerContent />
    </React.Suspense>
  )
}
