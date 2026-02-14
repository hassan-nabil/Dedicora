"use client"

import { cn } from "@/lib/utils"

type StickmanState = "working" | "break" | "done"

type StickmanProps = {
  state: StickmanState
}

export function Stickman({ state }: StickmanProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "relative h-40 w-24",
          state === "working" && "animate-pulse",
          state === "done" && "animate-bounce"
        )}
      >
        <svg
          viewBox="0 0 120 200"
          className="h-full w-full"
          role="img"
          aria-label="Stickman animation"
        >
          <circle cx="60" cy="28" r="20" stroke="currentColor" strokeWidth="4" fill="none" />
          {state === "done" && (
            <path
              d="M46 28c4 6 12 6 16 0"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
          )}
          {state !== "done" && (
            <path
              d="M48 28h24"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
          )}
          <line x1="60" y1="48" x2="60" y2="110" stroke="currentColor" strokeWidth="4" />
          {state === "working" && (
            <>
              <line x1="60" y1="70" x2="24" y2="92" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="70" x2="96" y2="92" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="110" x2="40" y2="162" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="110" x2="78" y2="162" stroke="currentColor" strokeWidth="4" />
              <rect x="78" y="94" width="28" height="20" rx="4" stroke="currentColor" strokeWidth="3" fill="none" />
            </>
          )}
          {state === "break" && (
            <>
              <line x1="60" y1="72" x2="36" y2="98" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="72" x2="82" y2="98" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="110" x2="36" y2="150" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="110" x2="84" y2="138" stroke="currentColor" strokeWidth="4" />
              <rect x="86" y="92" width="22" height="32" rx="4" stroke="currentColor" strokeWidth="3" fill="none" />
            </>
          )}
          {state === "done" && (
            <>
              <line x1="60" y1="70" x2="30" y2="86" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="70" x2="90" y2="86" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="110" x2="36" y2="160" stroke="currentColor" strokeWidth="4" />
              <line x1="60" y1="110" x2="84" y2="160" stroke="currentColor" strokeWidth="4" />
            </>
          )}
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">
        {state === "working" && "Focused and working"}
        {state === "break" && "Taking a break"}
        {state === "done" && "Great job!"}
      </p>
    </div>
  )
}
