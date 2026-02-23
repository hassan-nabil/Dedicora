"use client"

import * as React from "react"
import { toSeconds } from "@/lib/time"

export type TaskDuration = {
  hours: number
  minutes: number
  seconds: number
}

export type TaskNode = {
  id: string
  title: string
  description?: string
  duration: TaskDuration
  done: boolean
  children?: TaskNode[]
  /** DB fields for persistence */
  dbId?: string
  actualSeconds?: number
  overtimeSeconds?: number
}

export type FlowMode = "single" | "breakdown"

type FlowState = {
  mainTask: string
  mode: FlowMode
  taskTree: TaskNode | null
  taskList: TaskNode[]
  currentTaskIndex: number
  sessionId: string | null
  setMainTask: (value: string) => void
  setMode: (value: FlowMode) => void
  setTaskTree: (tree: TaskNode | null) => void
  setTaskList: (list: TaskNode[]) => void
  setCurrentTaskIndex: (index: number) => void
  setSessionId: (id: string | null) => void
  markTaskDone: (index: number, done: boolean) => void
  updateTask: (index: number, updates: Partial<Pick<TaskNode, "title" | "description" | "duration">>) => void
  removeTask: (index: number) => void
  removeCompletedTasks: () => void
  resetFlow: () => void
  /** Persist tasks to DB for current session */
  saveTasksToDb: () => Promise<void>
  /** Update session state in DB */
  updateSessionInDb: (updates: Record<string, unknown>) => Promise<void>
  /** Load a session from DB by ID */
  loadSession: (sessionId: string) => Promise<void>
}

const FlowContext = React.createContext<FlowState | null>(null)

const defaultTask = ""

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [mainTask, setMainTask] = React.useState(defaultTask)
  const [mode, setMode] = React.useState<FlowMode>("single")
  const [taskTree, setTaskTree] = React.useState<TaskNode | null>(null)
  const [taskList, setTaskList] = React.useState<TaskNode[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = React.useState(0)
  const [sessionId, setSessionId] = React.useState<string | null>(null)

  const markTaskDone = React.useCallback(
    (index: number, done: boolean) => {
      setTaskList((prev) =>
        prev.map((task, taskIndex) =>
          taskIndex === index ? { ...task, done } : task
        )
      )
    },
    []
  )

  const updateTask = React.useCallback(
    (index: number, updates: Partial<Pick<TaskNode, "title" | "description" | "duration">>) => {
      setTaskList((prev) =>
        prev.map((task, taskIndex) =>
          taskIndex === index ? { ...task, ...updates } : task
        )
      )
    },
    []
  )

  const removeTask = React.useCallback(
    (index: number) => {
      setTaskList((prev) => prev.filter((_, i) => i !== index))
      setCurrentTaskIndex((prevIndex) => {
        if (prevIndex >= index && prevIndex > 0) return prevIndex - 1
        return prevIndex
      })
    },
    []
  )

  const removeCompletedTasks = React.useCallback(() => {
    setTaskList((prev) => {
      const remaining = prev.filter((t) => !t.done)
      return remaining
    })
    setCurrentTaskIndex(0)
  }, [])

  const resetFlow = React.useCallback(() => {
    setMainTask(defaultTask)
    setMode("single")
    setTaskTree(null)
    setTaskList([])
    setCurrentTaskIndex(0)
    setSessionId(null)
  }, [])

  const saveTasksToDb = React.useCallback(async () => {
    if (!sessionId) return
    try {
      await fetch(`/api/sessions/${sessionId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: taskList.map((t) => ({
            title: t.title,
            description: t.description ?? "",
            estimated_seconds: toSeconds(t.duration.hours, t.duration.minutes, t.duration.seconds),
          })),
        }),
      })
    } catch {
      // Silently fail — local state is the source of truth during a session
    }
  }, [sessionId, taskList])

  const updateSessionInDb = React.useCallback(
    async (updates: Record<string, unknown>) => {
      if (!sessionId) return
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
      } catch {
        // Silently fail
      }
    },
    [sessionId]
  )

  const loadSession = React.useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (!res.ok) return

      const data = await res.json()

      setSessionId(id)
      setMainTask(data.title ?? "")
      setMode(data.mode ?? "single")
      setCurrentTaskIndex(data.current_task_index ?? 0)

      if (data.tasks && Array.isArray(data.tasks)) {
        const loaded: TaskNode[] = data.tasks.map((t: {
          id: string
          title: string
          description?: string
          estimated_seconds: number
          actual_seconds: number
          overtime_seconds: number
          status: string
          order_index: number
        }) => ({
          id: `task-${t.order_index}`,
          dbId: t.id,
          title: t.title,
          description: t.description ?? "",
          duration: {
            hours: Math.floor(t.estimated_seconds / 3600),
            minutes: Math.floor((t.estimated_seconds % 3600) / 60),
            seconds: t.estimated_seconds % 60,
          },
          done: t.status === "completed",
          actualSeconds: t.actual_seconds,
          overtimeSeconds: t.overtime_seconds,
        }))
        setTaskList(loaded)

        // Set task tree
        const tree: TaskNode = {
          id: "root",
          title: data.title,
          description: "",
          duration: { hours: 0, minutes: 0, seconds: 0 },
          done: false,
          children: loaded,
        }
        setTaskTree(tree)
      }
    } catch {
      // Failed to load from DB — continue with local state
    }
  }, [])

  const value = React.useMemo(
    () => ({
      mainTask,
      mode,
      taskTree,
      taskList,
      currentTaskIndex,
      sessionId,
      setMainTask,
      setMode,
      setTaskTree,
      setTaskList,
      setCurrentTaskIndex,
      setSessionId,
      markTaskDone,
      updateTask,
      removeTask,
      removeCompletedTasks,
      resetFlow,
      saveTasksToDb,
      updateSessionInDb,
      loadSession,
    }),
    [
      mainTask,
      mode,
      taskTree,
      taskList,
      currentTaskIndex,
      sessionId,
      setMainTask,
      setMode,
      setTaskTree,
      setTaskList,
      setCurrentTaskIndex,
      setSessionId,
      markTaskDone,
      updateTask,
      removeTask,
      removeCompletedTasks,
      resetFlow,
      saveTasksToDb,
      updateSessionInDb,
      loadSession,
    ]
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

export function useFlow() {
  const context = React.useContext(FlowContext)
  if (!context) {
    throw new Error("useFlow must be used within FlowProvider")
  }
  return context
}
