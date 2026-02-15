"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Repeat2 } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/top-bar"
import { TimeBox } from "@/components/time-box"
import { useFlow, type TaskDuration, type TaskNode } from "@/components/providers/flow-provider"

const defaultDuration: TaskDuration = { hours: 0, minutes: 20, seconds: 0 }

type DraftTask = {
  id: string
  title: string
  description?: string
  duration: TaskDuration
}

type GeminiTaskResponse = {
  summary: string
  description: string
  steps: Array<{
    title: string
    description: string
    duration: TaskDuration
  }>
}

export default function AssignPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const modeParam = searchParams.get("mode")
  const mode = modeParam === "breakdown" ? "breakdown" : "single"

  const { mainTask, setMode, setTaskTree, setTaskList } = useFlow()

  const [loading, setLoading] = React.useState(mode === "breakdown")
  const [summary, setSummary] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [tasks, setTasks] = React.useState<DraftTask[]>([])

  React.useEffect(() => {
    setMode(mode)

    const loadTasks = async () => {
      setLoading(true)
      setTasks([])
      try {
        const response = await fetch("/api/gemini/task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: mainTask, mode }),
        })
        const data = (await response.json()) as GeminiTaskResponse
        const steps = data.steps?.length
          ? data.steps
          : [
              {
                title: mainTask,
                description: data.description ?? "Focus on this task.",
                duration: defaultDuration,
              },
            ]

        const normalized = mode === "single" ? [steps[0]] : steps

        setSummary(data.summary ?? "")
        setDescription(data.description ?? "")
        setTasks(
          normalized.map((step, index) => ({
            id: `task-${index}`,
            title: step.title,
            description: step.description,
            duration: step.duration ?? defaultDuration,
          }))
        )
      } catch {
        const fallbackSteps =
          mode === "single"
            ? [
                {
                  title: mainTask,
                  description: "Work through this task with full focus.",
                  duration: defaultDuration,
                },
              ]
            : [
                {
                  title: `Plan and outline: ${mainTask}`,
                  description: "Understand the requirements and plan your approach.",
                  duration: { hours: 0, minutes: 10, seconds: 0 },
                },
                {
                  title: `Work on: ${mainTask}`,
                  description: "Execute the main work for this task.",
                  duration: { hours: 0, minutes: 25, seconds: 0 },
                },
                {
                  title: `Review and finish: ${mainTask}`,
                  description: "Review your work and wrap up.",
                  duration: { hours: 0, minutes: 10, seconds: 0 },
                },
              ]

        setSummary(mainTask)
        setDescription(
          mode === "single"
            ? "Focus on completing this task."
            : `Break down "${mainTask}" into manageable steps and tackle them one at a time.`
        )
        setTasks(
          fallbackSteps.map((step, index) => ({
            id: `task-${index}`,
            title: step.title,
            description: step.description,
            duration: step.duration ?? defaultDuration,
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    void loadTasks()
  }, [mainTask, mode, setMode])

  const updateDuration = (index: number, field: keyof TaskDuration, value: number) => {
    setTasks((prev) =>
      prev.map((task, taskIndex) =>
        taskIndex === index
          ? { ...task, duration: { ...task.duration, [field]: value } }
          : task
      )
    )
  }

  const handleStart = () => {
    const tree: TaskNode = {
      id: "root",
      title: mainTask,
      description: summary,
      duration: defaultDuration,
      done: false,
      children: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        duration: task.duration,
        done: false,
      })),
    }

    setTaskTree(tree)
    setTaskList(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        duration: task.duration,
        done: false,
      }))
    )

    router.push("/timer")
  }

  const handleRedo = () => {
    setTasks((prev) => {
      const duplicate = prev.map((task, index) => ({
        ...task,
        id: `${task.id}-redo-${index}`,
        title: `${task.title} (redo)`
      }))
      return [...prev, ...duplicate]
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-hero px-6 py-10">
      <TopBar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Assign Task and Timer
          </p>
          <h1 className="text-3xl font-semibold">{mainTask}</h1>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>

        {mode === "breakdown" && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card/80 p-4 text-sm text-muted-foreground shadow-(--shadow-soft)">
              {loading ? "Generating your breakdown..." : description}
            </div>
            <div className="rounded-2xl border bg-card/60 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Task Tree
              </p>
              <div className="mt-3">
                <p className="font-semibold">{mainTask}</p>
                <div className="ml-4 border-l border-muted pl-4">
                  {tasks.map((task) => (
                    <p key={`tree-${task.id}`} className="py-1 text-muted-foreground">
                      {task.title}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">
          <ScrollArea className="h-95 pr-4">
            <div className="space-y-6">
              {loading && tasks.length === 0 ? (
                <div className="rounded-3xl border bg-card/70 p-6 text-sm text-muted-foreground shadow-sm">
                  Preparing your task breakdown...
                </div>
              ) : null}
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="rounded-3xl border bg-card/70 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-55">
                      <p className="text-sm text-muted-foreground">
                        Task {index + 1}
                      </p>
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      {task.description ? (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <TimeBox
                        label="Hours"
                        value={task.duration.hours}
                        onChange={(value) => updateDuration(index, "hours", value)}
                      />
                      <TimeBox
                        label="Minutes"
                        value={task.duration.minutes}
                        onChange={(value) => updateDuration(index, "minutes", value)}
                      />
                      <TimeBox
                        label="Seconds"
                        value={task.duration.seconds}
                        onChange={(value) => updateDuration(index, "seconds", value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="sticky bottom-6 flex flex-wrap items-center justify-center gap-4">
          {mode === "breakdown" && (
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={handleRedo}
            >
              <Repeat2 className="mr-2 h-4 w-4" /> Redo
            </Button>
          )}
          <Button
            className="rounded-full px-8"
            onClick={handleStart}
            disabled={tasks.length === 0}
          >
            Start
          </Button>
        </div>
      </main>
    </div>
  )
}
