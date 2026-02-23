"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useFlow } from "@/components/providers/flow-provider"

const NOTES_KEY = "dedicora-notes"

type NotesPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotesPanel({ open, onOpenChange }: NotesPanelProps) {
  const [notes, setNotes] = React.useState("")
  const { sessionId } = useFlow()
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load notes from DB or localStorage
  React.useEffect(() => {
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/notes`)
        .then((r) => r.json())
        .then((data: { content?: string }) => {
          if (data.content) setNotes(data.content)
        })
        .catch(() => {
          const saved = typeof window !== "undefined" ? window.localStorage.getItem(NOTES_KEY) : null
          if (saved) setNotes(saved)
        })
    } else {
      if (typeof window === "undefined") return
      const saved = window.localStorage.getItem(NOTES_KEY)
      if (saved) setNotes(saved)
    }
  }, [sessionId])

  const saveNotes = React.useCallback(
    (value: string) => {
      // Always save to localStorage as fallback
      if (typeof window !== "undefined") {
        window.localStorage.setItem(NOTES_KEY, value)
      }

      // Save to DB with debounce
      if (sessionId) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          fetch(`/api/sessions/${sessionId}/notes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: value }),
          }).catch(() => {})
        }, 1000)
      }
    },
    [sessionId]
  )

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setNotes(value)
    saveNotes(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">My Notes</DialogTitle>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={handleChange}
          placeholder="Write your notes for this session..."
          className="min-h-50"
        />
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
