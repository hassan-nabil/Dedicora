"use client"

import * as React from "react"

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
}

export type FlowMode = "single" | "breakdown"

type FlowState = {
  mainTask: string
  mode: FlowMode
  taskTree: TaskNode | null
  taskList: TaskNode[]
  currentTaskIndex: number
  setMainTask: (value: string) => void
  setMode: (value: FlowMode) => void
  setTaskTree: (tree: TaskNode | null) => void
  setTaskList: (list: TaskNode[]) => void
  setCurrentTaskIndex: (index: number) => void
  markTaskDone: (index: number, done: boolean) => void
  updateTask: (index: number, updates: Partial<Pick<TaskNode, "title" | "description" | "duration">>) => void
  removeTask: (index: number) => void
  removeCompletedTasks: () => void
  resetFlow: () => void
}

const FlowContext = React.createContext<FlowState | null>(null)

const defaultTask = ""

const defaultDuration: TaskDuration = {
  hours: 0,
  minutes: 20,
  seconds: 0,
}

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [mainTask, setMainTask] = React.useState(defaultTask)
  const [mode, setMode] = React.useState<FlowMode>("single")
  const [taskTree, setTaskTree] = React.useState<TaskNode | null>(null)
  const [taskList, setTaskList] = React.useState<TaskNode[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = React.useState(0)

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
    setMode("single")
    setTaskTree(null)
    setTaskList([])
    setCurrentTaskIndex(0)
  }, [])

  const value = React.useMemo(
    () => ({
      mainTask,
      mode,
      taskTree,
      taskList,
      currentTaskIndex,
      setMainTask,
      setMode,
      setTaskTree,
      setTaskList,
      setCurrentTaskIndex,
      markTaskDone,
      updateTask,
      removeTask,
      removeCompletedTasks,
      resetFlow,
    }),
    [
      mainTask,
      mode,
      taskTree,
      taskList,
      currentTaskIndex,
      setMainTask,
      setMode,
      setTaskTree,
      setTaskList,
      setCurrentTaskIndex,
      markTaskDone,
      updateTask,
      removeTask,
      removeCompletedTasks,
      resetFlow,
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
