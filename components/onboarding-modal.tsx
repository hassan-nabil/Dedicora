"use client"

import * as React from "react"
import { Sparkles, Timer, BarChart3, Brain, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const ONBOARDING_KEY = "dedicora-onboarding-seen"

const steps = [
  {
    icon: Timer,
    title: "Plan your tasks",
    description:
      "Break your work into focused tasks with time estimates. AI can help you split bigger goals into bite-sized steps.",
  },
  {
    icon: Brain,
    title: "Stay in the zone",
    description:
      "A distraction-free timer keeps you focused. Smart breaks recharge you between tasks.",
  },
  {
    icon: BarChart3,
    title: "Track your progress",
    description:
      "AI-generated reports show where your time went and how to improve.",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const seen = window.localStorage.getItem(ONBOARDING_KEY)
    if (!seen) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, "true")
    }
    setOpen(false)
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const current = steps[step]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="mx-4 max-w-md rounded-2xl sm:mx-0 sm:rounded-3xl">
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            {step === 0 && !current ? (
              <Sparkles className="h-8 w-8 text-brand" />
            ) : (
              <current.icon className="h-8 w-8 text-brand" />
            )}
          </div>
          <DialogTitle className="text-2xl">
            {step === 0 ? "Welcome to Dedicora!" : current.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-brand" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" className="rounded-full" onClick={handleClose}>
            Skip
          </Button>
          <Button className="rounded-full gap-2 px-6" onClick={handleNext}>
            {step < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
