"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"

export default function Home() {
  const router = useRouter()
  const { setGuestMode } = useAuth()

  const handleTryIt = () => {
    setGuestMode(true)
    router.push("/task")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="w-full max-w-2xl text-center space-y-8">
        <p className="welcome-shimmer mb-4">
          Dedicora
        </p>
        <p className="text-lg text-white/60 font-[family-name:var(--font-body)]">
          Your AI Focus Partner
        </p>
        <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
          Stop planning. Start doing. Dedicora breaks your tasks down, sits with
          you while you work, and celebrates when you finish.
        </p>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-white/20 bg-transparent px-8 py-6 text-base text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/login" className="flex items-center gap-3">
            Get Started
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </Button>

        {/* How it works */}
        <div className="mt-16 grid gap-8 sm:grid-cols-4 text-left">
          <div className="space-y-2">
            <div className="text-2xl">📝</div>
            <h3 className="text-sm font-semibold text-white">1. Describe</h3>
            <p className="text-xs text-white/40">
              Tell Dedicora what you need to do. AI breaks it into focused steps.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">⏱️</div>
            <h3 className="text-sm font-semibold text-white">2. Focus</h3>
            <p className="text-xs text-white/40">
              Work through each step with a smart timer and AI chat support.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">📊</div>
            <h3 className="text-sm font-semibold text-white">3. Finish</h3>
            <p className="text-xs text-white/40">
              Get an AI-powered report on your productivity and track your progress.
            </p>
          </div>
          <div className="space-y-2 cursor-pointer" onClick={handleTryIt}>
            <div className="text-2xl">🚀</div>
            <h3 className="text-sm font-semibold text-brand">4. Try It</h3>
            <p className="text-xs text-white/40">
              Try Dedicora instantly — no sign-up required. Limited features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
