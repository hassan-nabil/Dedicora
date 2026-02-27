"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Pause, Play, ArrowLeft, ArrowRight, CornerUpLeft, Bot, Coffee, SkipForward, X, Plus } from "lucide-react"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Stickman } from "@/components/stickman"
import { TaskSidebar } from "@/components/task-sidebar"
import { NotesPanel } from "@/components/notes-panel"
import { ChatPanel } from "@/components/chat-panel"
import { useFlow } from "@/components/providers/flow-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { useSettings } from "@/components/providers/settings-provider"
import { formatTime, toSeconds } from "@/lib/time"

const breakSuggestions = [
  "Stand up and stretch your arms overhead 🙆",
  "Drink a glass of water — stay hydrated 💧",
  "Close your eyes and take 5 deep breaths 🧘",
  "Look at something 20 feet away for 20 seconds 👀",
  "Roll your shoulders and neck gently 🔄",
  "Walk around the room for a minute 🚶",
  "Do 10 quick squats to get blood flowing 🏋️",
  "Grab a healthy snack — your brain needs fuel 🍎",
]

function TimerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  const {
    taskList, currentTaskIndex, setCurrentTaskIndex, markTaskDone,
    sessionId, setSessionId, loadSession,
  } = useFlow()
  const { isGuest } = useAuth()
  const { breakMinutes } = useSettings()

  const [isRunning, setIsRunning] = React.useState(true)
  const [isFinished, setIsFinished] = React.useState(false)
  const [remaining, setRemaining] = React.useState(0)
  const [overtime, setOvertime] = React.useState(0)
  const [countingForward, setCountingForward] = React.useState(false)
  const [notesOpen, setNotesOpen] = React.useState(false)
  const [chatOpen, setChatOpen] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  // Break state
  const [isOnBreak, setIsOnBreak] = React.useState(false)
  const [breakRemaining, setBreakRemaining] = React.useState(0)
  const [showCongrats, setShowCongrats] = React.useState(true)
  const [breakSuggestion, setBreakSuggestion] = React.useState("")
  const pendingNextIndexRef = React.useRef<number | null>(null)

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
    if (!sessionParam || loaded) return
    setLoaded(true)
    if (!sessionId) setSessionId(sessionParam)
    loadSession(sessionParam)
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

  // Stop everything when all tasks are done and mark session completed
  React.useEffect(() => {
    if (allTasksDone) {
      setIsRunning(false)
      setCountingForward(false)
      setShowCongrats(true)

      // Mark session as completed in DB — skip for guests
      const sid = sessionId ?? sessionParam
      if (sid && !isGuest) {
        const totalActual = taskList.reduce((sum, t, i) => {
          if (i === currentTaskIndex) return sum + actualSecondsRef.current
          return sum + (t.actualSeconds ?? 0)
        }, 0)

        fetch(`/api/sessions/${sid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "completed",
            total_actual_seconds: totalActual,
            completed_at: new Date().toISOString(),
          }),
        }).catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Persist timer state to DB every 5 seconds — skip for guests
  React.useEffect(() => {
    const sid = sessionId ?? sessionParam
    if (!sid || !isRunning || isGuest) return

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
  }, [sessionId, sessionParam, isRunning, currentTask, currentTaskIndex, overtime, taskList, isGuest])

  // Start a break before advancing to the next task
  const startBreak = React.useCallback((nextIndex: number) => {
    pendingNextIndexRef.current = nextIndex
    setBreakSuggestion(breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)])
    setBreakRemaining(breakMinutes * 60)
    setIsOnBreak(true)
    setIsRunning(false)
  }, [breakMinutes])

  // Skip or finish break — advance to next task
  const finishBreak = React.useCallback(() => {
    setIsOnBreak(false)
    setBreakRemaining(0)
    const nextIdx = pendingNextIndexRef.current
    pendingNextIndexRef.current = null
    if (nextIdx !== null && nextIdx < taskList.length) {
      lastInitIndexRef.current = -1
      setCurrentTaskIndex(nextIdx)
      setIsRunning(true)
    }
  }, [taskList.length, setCurrentTaskIndex])

  // Break countdown timer
  React.useEffect(() => {
    if (!isOnBreak || breakRemaining <= 0) {
      if (isOnBreak && breakRemaining <= 0) finishBreak()
      return
    }

    const timer = window.setInterval(() => {
      setBreakRemaining((prev) => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isOnBreak, breakRemaining, finishBreak])

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

    // Persist task completion to DB — skip for guests
    if (currentTask?.dbId && !isGuest) {
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

    // Auto-advance to next incomplete task (via break)
    const nextIncomplete = taskList.findIndex((t, i) => i > currentTaskIndex && !t.done)
    if (nextIncomplete !== -1) {
      startBreak(nextIncomplete)
    } else {
      // No more tasks — stay on current, show finished state
      setIsFinished(true)
      setIsRunning(false)
      setCountingForward(false)
    }
  }

  const handleReport = async () => {
    // Guest mode: redirect to sign-up prompt
    if (isGuest) {
      router.push("/login?from=guest")
      return
    }

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
      <div className="absolute left-4 top-16 flex flex-col items-start gap-2 sm:left-6 sm:top-6 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => router.push("/task")}
        >
          <CornerUpLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back to Tasks</span>
          <span className="sm:hidden">Tasks</span>
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setNotesOpen(true)}
        >
          Notes
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setChatOpen(true)}
        >
          <Bot className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="sm:hidden">AI</span>
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
      ) : isOnBreak ? (
        /* Break screen — shown between tasks */
        <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
          <div className="space-y-6 rounded-4xl border border-brand/30 bg-card/80 p-6 shadow-(--shadow-strong) sm:p-12">
            <Stickman state="break" />
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-brand">
                <Coffee className="h-6 w-6" />
                <h1 className="text-3xl font-bold">Take a Break</h1>
              </div>
              <div className="rounded-2xl border bg-card/70 px-4 py-4 text-3xl font-semibold tracking-[0.15em] text-brand shadow-(--shadow-soft) sm:px-8 sm:text-5xl">
                {formatTime(breakRemaining)}
              </div>
              <p className="mx-auto max-w-sm text-base text-muted-foreground">
                {breakSuggestion}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                className="rounded-full px-8"
                onClick={finishBreak}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip Break
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => setBreakRemaining((prev) => prev + 60)}
              >
                +1 min
              </Button>
            </div>
          </div>
        </main>
      ) : allTasksDone && showCongrats ? (
        /* Congratulations screen — shown only when ALL tasks are complete */
        <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
          <div className="relative space-y-6 rounded-4xl border bg-card/80 p-6 shadow-(--shadow-strong) sm:p-12">
            <button
              onClick={() => setShowCongrats(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <Stickman state="done" />
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gradient sm:text-4xl">
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
              {isGuest ? (
                <>
                  <Button className="rounded-full px-8" onClick={() => router.push("/login?from=guest")}>
                    Sign up for full features
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full px-6"
                    onClick={() => router.push("/task")}
                  >
                    Try another session
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
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
              <div className="rounded-4xl border bg-card/70 px-6 py-8 text-4xl font-semibold tracking-[0.15em] text-brand shadow-(--shadow-strong) sm:px-10 sm:text-6xl">
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
                <Button
                  variant="outline"
                  className="h-12 rounded-full px-4 gap-1 text-sm"
                  onClick={() => {
                    setRemaining((prev) => prev + 300)
                    setCountingForward(false)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  5 min
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button className="rounded-full px-8" onClick={isGuest ? () => router.push("/login?from=guest") : handleReport}>
              {isGuest ? "Sign up for full features" : "Check my productivity"}
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
