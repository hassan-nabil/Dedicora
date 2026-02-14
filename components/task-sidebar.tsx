"use client"

import { CheckCircle2, Circle, X } from "lucide-react"

import { useFlow } from "@/components/providers/flow-provider"
import { useSettings } from "@/components/providers/settings-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function TaskSidebar() {
  const { sidebarOpen, setSidebarOpen } = useSettings()
  const { taskTree, taskList, currentTaskIndex } = useFlow()

  if (!sidebarOpen) return null

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close task sidebar"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Task Overview</p>
            <h2 className="text-lg font-semibold">Your Focus List</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-72px)] p-6">
          {taskTree ? (
            <div className="space-y-4">
              <details open className="rounded-2xl border bg-card p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  {taskTree.title}
                </summary>
                <div className="mt-4 space-y-3">
                  {taskList.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      {task.done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p
                          className={
                            index === currentTaskIndex
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {task.title}
                        </p>
                        {task.description ? (
                          <p className="text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tasks yet. Add a task to see it here.
            </p>
          )}
        </ScrollArea>
      </aside>
    </div>
  )
}
