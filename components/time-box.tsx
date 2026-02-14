"use client"

import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TimeBoxProps = {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}

export function TimeBox({ label, value, onChange, className }: TimeBoxProps) {
  const clamp = (next: number) => Math.max(0, Math.min(next, 99))

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex flex-col items-center rounded-2xl border bg-card px-4 py-3 shadow-sm">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span className="text-2xl font-semibold">{String(value).padStart(2, "0")}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(clamp(value + 1))}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(clamp(value - 1))}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
