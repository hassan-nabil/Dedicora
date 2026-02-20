"use client"

import { cn } from "@/lib/utils"

type StickmanState = "working" | "break" | "done"

type StickmanProps = {
  state: StickmanState
}

export function Stickman({ state }: StickmanProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-52 w-52">
        <svg
          viewBox="0 0 240 240"
          className="h-full w-full"
          role="img"
          aria-label="Stickman animation"
        >
          {/* Desk */}
          <rect x="60" y="150" width="140" height="6" rx="2" fill="currentColor" opacity="0.7" />
          {/* Desk legs */}
          <line x1="70" y1="156" x2="70" y2="210" stroke="currentColor" strokeWidth="4" opacity="0.5" />
          <line x1="190" y1="156" x2="190" y2="210" stroke="currentColor" strokeWidth="4" opacity="0.5" />

          {/* Chair back */}
          <line x1="40" y1="110" x2="40" y2="175" stroke="currentColor" strokeWidth="4" opacity="0.4" />
          <line x1="40" y1="110" x2="55" y2="110" stroke="currentColor" strokeWidth="3" opacity="0.4" />
          {/* Chair seat */}
          <rect x="30" y="145" width="40" height="5" rx="2" fill="currentColor" opacity="0.4" />
          {/* Chair legs */}
          <line x1="32" y1="150" x2="28" y2="210" stroke="currentColor" strokeWidth="3" opacity="0.3" />
          <line x1="68" y1="150" x2="72" y2="210" stroke="currentColor" strokeWidth="3" opacity="0.3" />

          {/* Stickman body - sitting on chair */}
          {/* Head */}
          <circle cx="65" cy="95" r="16" stroke="currentColor" strokeWidth="3" fill="none" />

          {state === "done" ? (
            /* Smile for done state */
            <path d="M57 97c3 5 10 5 14 0" stroke="currentColor" strokeWidth="2" fill="none" />
          ) : (
            /* Neutral mouth */
            <line x1="58" y1="97" x2="70" y2="97" stroke="currentColor" strokeWidth="2" />
          )}

          {/* Eyes */}
          <circle cx="59" cy="91" r="1.5" fill="currentColor" />
          <circle cx="71" cy="91" r="1.5" fill="currentColor" />

          {/* Torso (leaning slightly forward for sitting) */}
          <line x1="65" y1="111" x2="58" y2="148" stroke="currentColor" strokeWidth="3" />

          {/* Legs (bent, sitting) */}
          <line x1="58" y1="148" x2="75" y2="155" stroke="currentColor" strokeWidth="3" />
          <line x1="75" y1="155" x2="80" y2="210" stroke="currentColor" strokeWidth="3" />
          <line x1="58" y1="148" x2="50" y2="155" stroke="currentColor" strokeWidth="3" />
          <line x1="50" y1="155" x2="45" y2="210" stroke="currentColor" strokeWidth="3" />

          {state === "working" && (
            <>
              {/* Writing arm (animates up and down) */}
              <g className="stickman-write-arm">
                <line x1="62" y1="125" x2="95" y2="135" stroke="currentColor" strokeWidth="3" />
                <line x1="95" y1="135" x2="115" y2="145" stroke="currentColor" strokeWidth="3" />
                {/* Pen */}
                <line x1="115" y1="145" x2="120" y2="150" stroke="currentColor" strokeWidth="2" />
              </g>
              {/* Resting arm on desk */}
              <line x1="62" y1="125" x2="80" y2="140" stroke="currentColor" strokeWidth="3" />
              <line x1="80" y1="140" x2="90" y2="148" stroke="currentColor" strokeWidth="3" />

              {/* Paper on desk (animated - thrown away periodically) */}
              <g className="stickman-paper">
                <rect x="105" y="138" width="22" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
                {/* Writing lines on paper */}
                <line x1="108" y1="143" x2="124" y2="143" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                <line x1="108" y1="146" x2="120" y2="146" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                <line x1="108" y1="149" x2="122" y2="149" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
              </g>

              {/* Thrown paper (crumpled, animated) */}
              <g className="stickman-paper-throw">
                <circle cx="170" cy="100" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
                <path d="M165 98 l3 2 l3-4 l3 3" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
              </g>
            </>
          )}

          {state === "break" && (
            <>
              {/* Arms crossed on chest - relaxed */}
              <line x1="62" y1="122" x2="80" y2="130" stroke="currentColor" strokeWidth="3" />
              <line x1="80" y1="130" x2="55" y2="135" stroke="currentColor" strokeWidth="3" />
              <line x1="62" y1="126" x2="45" y2="132" stroke="currentColor" strokeWidth="3" />
              <line x1="45" y1="132" x2="72" y2="138" stroke="currentColor" strokeWidth="3" />
            </>
          )}

          {state === "done" && (
            <>
              {/* Arms raised in celebration */}
              <line x1="62" y1="122" x2="35" y2="90" stroke="currentColor" strokeWidth="3" />
              <line x1="35" y1="90" x2="25" y2="75" stroke="currentColor" strokeWidth="3" />
              <line x1="62" y1="122" x2="95" y2="90" stroke="currentColor" strokeWidth="3" />
              <line x1="95" y1="90" x2="105" y2="75" stroke="currentColor" strokeWidth="3" />

              {/* Confetti-like stars */}
              <text x="15" y="70" fontSize="12" className="stickman-confetti-1">✦</text>
              <text x="110" y="65" fontSize="10" className="stickman-confetti-2">✦</text>
              <text x="30" y="55" fontSize="8" className="stickman-confetti-3">★</text>
              <text x="100" y="50" fontSize="9" className="stickman-confetti-4">★</text>
            </>
          )}
        </svg>
      </div>
      <p className={cn(
        "text-sm text-muted-foreground",
        state === "done" && "font-semibold text-brand"
      )}>
        {state === "working" && "Focused and working..."}
        {state === "break" && "Taking a break"}
        {state === "done" && "Great job! 🎉"}
      </p>
    </div>
  )
}
