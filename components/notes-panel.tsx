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

const NOTES_KEY = "dedicora-notes"

type NotesPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotesPanel({ open, onOpenChange }: NotesPanelProps) {
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(NOTES_KEY)
    if (saved) setNotes(saved)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(NOTES_KEY, notes)
  }, [notes])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">My Notes</DialogTitle>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
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
