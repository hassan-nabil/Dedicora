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
  resetFlow: () => void
}

const FlowContext = React.createContext<FlowState | null>(null)

const defaultTask = "Complete math and science homework before dinner"

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

  React.useEffect(() => {
    if (!taskTree) {
      setTaskTree({
        id: "task-root",
        title: mainTask,
        description: "Complete the task step by step.",
        duration: defaultDuration,
        done: false,
      })
      setTaskList([
        {
          id: "task-0",
          title: mainTask,
          description: "Stay focused and complete the task with care.",
          duration: defaultDuration,
          done: false,
        },
      ])
    }
  }, [mainTask, taskTree])

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
