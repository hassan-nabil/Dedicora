"use client"

import * as React from "react"
import { Bot, Send, X, User, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFlow } from "@/components/providers/flow-provider"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type ChatPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const { mainTask, taskList, currentTaskIndex } = useFlow()
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when panel opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const buildTaskContext = React.useCallback(() => {
    const currentTask = taskList[currentTaskIndex]
    return {
      mainTask: mainTask || "No task set",
      currentTask: currentTask
        ? { title: currentTask.title, description: currentTask.description }
        : undefined,
      allTasks: taskList.map((t) => ({ title: t.title, done: t.done })),
      completedCount: taskList.filter((t) => t.done).length,
      totalCount: taskList.length,
    }
  }, [mainTask, taskList, currentTaskIndex])

  const handleSend = React.useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    }

    const allMessages = [...messages, userMessage]
    setMessages(allMessages)
    setInput("")
    setIsLoading(true)

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          taskContext: buildTaskContext(),
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })
        const current = accumulated
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: current } : m
          )
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: "Sorry, I couldn't process that. Please try again." }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, buildTaskContext])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-3xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
              <Bot className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Dedicora AI</h2>
              <p className="text-xs text-muted-foreground">
                Your focus assistant
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div ref={scrollRef} className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
                  <Bot className="h-8 w-8 text-brand" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">How can I help?</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    I know what you&apos;re working on. Ask me anything about your task — I can explain concepts, suggest approaches, help debug, or break things down further.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {[
                    "How should I approach this?",
                    "Help me get unstuck",
                    "Explain this concept",
                    "What should I do next?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => {
                        setInput(suggestion)
                        setTimeout(() => inputRef.current?.focus(), 0)
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10">
                    <Bot className="h-4 w-4 text-brand" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "bg-brand text-white"
                      : "border bg-card/80"
                  )}
                >
                  {message.role === "assistant" && !message.content && isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div className="chat-message-content whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border bg-card/50 px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your task..."
              className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Dedicora AI knows your current task context and can help you complete it
          </p>
        </div>
      </div>
    </div>
  )
}
