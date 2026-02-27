"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Clock, Flame, Target, Pause, Play, Rocket, Heart, X } from "lucide-react"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReportChart, type ChartDatum } from "@/components/report-chart"
import { OnboardingModal } from "@/components/onboarding-modal"
import { useAuth } from "@/components/providers/auth-provider"

type StatsData = {
  totalSessions: number
  totalFocusHours: number
  currentStreak: number
  longestStreak: number
  thisWeekHours: number
  lastWeekHours: number
  completionRate: number
  dailyStats: ChartDatum[]
}

type SessionSummary = {
  id: string
  title: string
  status: string
  created_at: string
  total_actual_seconds: number
  current_step: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, isGuest } = useAuth()

  const [stats, setStats] = React.useState<StatsData | null>(null)
  const [sessions, setSessions] = React.useState<SessionSummary[]>([])
  const [activeSession, setActiveSession] = React.useState<SessionSummary | null>(null)
  const [pausedSessions, setPausedSessions] = React.useState<SessionSummary[]>([])
  const [deletingSessionId, setDeletingSessionId] = React.useState<string | null>(null)
  const [loadingData, setLoadingData] = React.useState(true)

  // Redirect to login if not authenticated or if guest
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push(isGuest ? "/login?from=guest" : "/login")
    }
  }, [authLoading, user, router, isGuest])

  // Fetch stats and sessions — runs on every mount/focus to stay fresh
  const fetchDashboardData = React.useCallback(() => {
    if (!user) return
    setLoadingData(true)

    Promise.all([
      fetch("/api/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/sessions?limit=100").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([statsData, sessionsData]: [StatsData | null, { sessions?: SessionSummary[] } | null]) => {
        if (statsData) setStats(statsData)
        if (sessionsData?.sessions) {
          setSessions(sessionsData.sessions)
          const active = sessionsData.sessions.find((s: SessionSummary) => s.status === "active")
          setActiveSession(active ?? null)
          setPausedSessions(sessionsData.sessions.filter((s: SessionSummary) => s.status === "paused"))
        } else {
          setActiveSession(null)
          setPausedSessions([])
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [user])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleNewSession = () => {
    router.push("/task")
  }

  const handleResumeSession = (session: SessionSummary) => {
    const step = session.current_step ?? "timer"
    router.push(`/${step}?session=${session.id}`)
  }

  const handlePauseSession = async (session: SessionSummary) => {
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      })
      setActiveSession(null)
      setPausedSessions((prev) => [...prev, { ...session, status: "paused" }])
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: "paused" } : s))
      )
    } catch {
      // Silently fail
    }
  }

  const handleUnpauseSession = async (session: SessionSummary) => {
    try {
      // Abandon any current active session first
      if (activeSession) {
        await fetch(`/api/sessions/${activeSession.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "abandoned" }),
        })
      }
      await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      })
      const resumed = { ...session, status: "active" }
      setActiveSession(resumed)
      setPausedSessions((prev) => prev.filter((s) => s.id !== session.id))
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? resumed : s))
      )
      handleResumeSession(resumed)
    } catch {
      // Silently fail
    }
  }

  const formatHrs = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      setDeletingSessionId(sessionId)
      // Optimistic UI removal
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      
      fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      })
        .then((r) => {
          if (!r.ok) {
            // If API fails, refresh the data
            fetchDashboardData()
          }
        })
        .catch(() => {
          // If network fails, refresh the data
          fetchDashboardData()
        })
        .finally(() => {
          setDeletingSessionId(null)
        })
    }
  }

  const handleSessionClick = (session: SessionSummary) => {
    if (session.status === "completed") {
      // No longer navigate to report for completed sessions
      return
    }
    handleResumeSession(session)
  }

  if (authLoading || (!user && !authLoading)) {
    return <div className="min-h-screen bg-hero" />
  }

  return (
    <div className="relative min-h-screen bg-hero px-6 py-10">
      <TopBar />
      <OnboardingModal />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-16 sm:pt-12">
        {/* Welcome */}
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">
            Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your AI Focus Partner &middot; Ready when you are
          </p>
        </header>

        {/* Active session banner */}
        {activeSession && (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand/5 p-4">
            <div>
              <p className="text-sm font-medium">Active session</p>
              <p className="text-lg font-semibold">{activeSession.title}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full gap-2" onClick={() => handlePauseSession(activeSession)}>
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button className="rounded-full" onClick={() => handleResumeSession(activeSession)}>
                Resume
              </Button>
            </div>
          </Card>
        )}

        {/* Paused sessions */}
        {pausedSessions.length > 0 && (
          <div className="space-y-2">
            {pausedSessions.map((s) => (
              <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-yellow-500/30 bg-yellow-500/5 p-4">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Paused</p>
                  <p className="text-lg font-semibold">{s.title}</p>
                </div>
                <Button className="rounded-full gap-2" onClick={() => handleUnpauseSession(s)}>
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full gap-2 px-6" onClick={handleNewSession}>
            <Plus className="h-4 w-4" />
            New Session
          </Button>
          <a href="https://paypal.me/Billionareh" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full gap-2 px-6 text-pink-500 hover:text-pink-600 border-pink-500/30 hover:border-pink-500/50">
              <Heart className="h-4 w-4" />
              Support Dedicora
            </Button>
          </a>
        </div>

        {/* Stats + Chart */}
        {loadingData ? (
          <Card className="p-6 text-sm text-muted-foreground">Loading your stats...</Card>
        ) : stats ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Weekly chart */}
            {stats.dailyStats.length > 0 ? (
              <ReportChart data={stats.dailyStats} />
            ) : (
              <Card className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                Complete a session to see your weekly chart
              </Card>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="space-y-1 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Time Spent</span>
                </div>
                <p className="text-xl font-bold">{stats.totalFocusHours.toFixed(1)}h</p>
              </Card>
              <Card className="space-y-1 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs">Streak</span>
                </div>
                <p className="text-xl font-bold">{stats.longestStreak}d</p>
              </Card>
              <Card className="space-y-1 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">Completion</span>
                </div>
                <p className="text-xl font-bold">{stats.completionRate}%</p>
              </Card>
              <Card className="space-y-1 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">This Week</span>
                </div>
                <p className="text-xl font-bold">{stats.thisWeekHours.toFixed(1)}h</p>
              </Card>
            </div>
          </div>
        ) : null}

        {/* Recent sessions */}
        {sessions.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">My Sessions</h2>
            <div className="space-y-2">
              {sessions.map((s) => (
                <Card
                  key={s.id}
                  className={`flex items-center justify-between p-4 transition-colors ${
                    s.status !== "completed" ? "cursor-pointer hover:bg-accent/50" : ""
                  } ${deletingSessionId === s.id ? "opacity-50" : ""}`}
                  onClick={() => handleSessionClick(s)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()} &middot;{" "}
                      {formatHrs(s.total_actual_seconds ?? 0)} focused &middot;{" "}
                      <span className="capitalize">{s.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "active" && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        Active
                      </span>
                    )}
                    {s.status === "completed" && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                        Completed
                      </span>
                    )}
                    {s.status === "paused" && (
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
                        Paused
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(s.id)
                      }}
                      className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      disabled={deletingSessionId === s.id}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : !loadingData ? (
          <Card className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
              <Rocket className="h-7 w-7 text-brand" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">No sessions yet</h2>
              <p className="text-sm text-muted-foreground">
                Start your first focus session to begin tracking your productivity.
              </p>
            </div>
            <Button className="rounded-full gap-2 px-6" onClick={handleNewSession}>
              <Plus className="h-4 w-4" />
              Start First Session
            </Button>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
