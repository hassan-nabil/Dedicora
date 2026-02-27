"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReportChart, type ChartDatum } from "@/components/report-chart"
import { TaskComparisonChart, type ComparisonDatum } from "@/components/task-comparison-chart"
import { useFlow } from "@/components/providers/flow-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { formatTime, toSeconds } from "@/lib/time"

const fallbackInsights = [
  "You stayed consistent across the session.",
  "Short breaks helped maintain momentum.",
  "Try grouping similar tasks to boost focus.",
]

type ReportResponse = {
  title: string
  summary: string
  insights: string[]
  chart: ChartDatum[]
}

type AggregateTask = {
  title: string
  estimated_seconds: number
  actual_seconds: number
  overtime_seconds: number
  status: string
  session_id: string
}

type AggregateSession = {
  id: string
  title: string
  total_actual_seconds: number
  total_estimated_seconds: number
  completed_at: string | null
}

function ReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")
  const { taskList, sessionId, setSessionId, loadSession } = useFlow()
  const { isGuest } = useAuth()

  // Block guests from report page
  React.useEffect(() => {
    if (isGuest) {
      router.push("/login?from=guest")
    }
  }, [isGuest, router])

  const [loading, setLoading] = React.useState(false)
  const [report, setReport] = React.useState<ReportResponse | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [allTasks, setAllTasks] = React.useState<AggregateTask[]>([])
  const [allSessions, setAllSessions] = React.useState<AggregateSession[]>([])
  const [aggregateLoaded, setAggregateLoaded] = React.useState(false)

  // Load session from DB if URL has session param
  React.useEffect(() => {
    if (sessionParam && !loaded && !sessionId) {
      setLoaded(true)
      setSessionId(sessionParam)
      loadSession(sessionParam)
    } else if (sessionParam && !sessionId) {
      setSessionId(sessionParam)
    }
  }, [sessionParam, loaded, sessionId, setSessionId, loadSession])

  // Fetch aggregate data from all completed sessions
  React.useEffect(() => {
    if (aggregateLoaded) return
    setAggregateLoaded(true)
    fetch("/api/report/aggregate")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { sessions?: AggregateSession[]; tasks?: AggregateTask[] } | null) => {
        if (data?.sessions) setAllSessions(data.sessions)
        if (data?.tasks) setAllTasks(data.tasks)
      })
      .catch(() => {})
  }, [aggregateLoaded])

  // Current session tasks (for display alongside aggregate)
  const enrichedTasks = React.useMemo(() => {
    return taskList.map((t) => ({
      title: t.title,
      estimated_seconds: toSeconds(t.duration.hours, t.duration.minutes, t.duration.seconds),
      actual_seconds: t.actualSeconds ?? 0,
      overtime_seconds: t.overtimeSeconds ?? 0,
      done: t.done,
    }))
  }, [taskList])

  // Build aggregate tasks for report generation (all sessions)
  const aggregateReportTasks = React.useMemo(() => {
    if (allTasks.length > 0) {
      return allTasks.map((t) => ({
        title: t.title,
        estimated_seconds: t.estimated_seconds,
        actual_seconds: t.actual_seconds,
        overtime_seconds: t.overtime_seconds,
        done: t.status === "completed",
      }))
    }
    return enrichedTasks
  }, [allTasks, enrichedTasks])

  const generateReport = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: aggregateReportTasks,
          sessionCount: allSessions.length || 1,
          isAggregate: allSessions.length > 0,
        }),
      })
      const data = (await response.json()) as ReportResponse
      setReport(data)

      // Cache report in session if we have a session ID
      const sid = sessionId ?? sessionParam
      if (sid) {
        fetch(`/api/sessions/${sid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report_data: data }),
        }).catch(() => {})
      }
    } catch {
      const fallback = await import("@/data/reportFallback.json")
      setReport(fallback.default as ReportResponse)
    } finally {
      setLoading(false)
    }
  }, [aggregateReportTasks, allSessions.length, sessionId, sessionParam])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const requested = window.sessionStorage.getItem("reportRequested")
    if (requested === "true" && !report && !loading) {
      window.sessionStorage.removeItem("reportRequested")
      void generateReport()
    }
  }, [generateReport, loading, report])

  // Comparison chart data — estimated vs actual per task (minutes)
  const comparisonData: ComparisonDatum[] = React.useMemo(() => {
    return aggregateReportTasks.map((t) => ({
      name: t.title.length > 14 ? t.title.slice(0, 12) + "\u2026" : t.title,
      estimated: +(t.estimated_seconds / 60).toFixed(1),
      actual: +(t.actual_seconds / 60).toFixed(1),
    }))
  }, [aggregateReportTasks])

  // Summary stats (aggregate across all sessions)
  const totalEstimated = aggregateReportTasks.reduce((s, t) => s + t.estimated_seconds, 0)
  const totalActual = aggregateReportTasks.reduce((s, t) => s + t.actual_seconds, 0)
  const completedCount = aggregateReportTasks.filter((t) => t.done).length

  return (
    <div className="relative min-h-screen bg-hero px-6 py-10">
      <TopBar />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Performance Report
          </p>
          <h1 className="text-3xl font-semibold">
            Your productivity snapshot
          </h1>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{aggregateReportTasks.length} tasks completed
            {allSessions.length > 0 && <> across {allSessions.length} session{allSessions.length !== 1 ? "s" : ""}</>}
            {totalActual > 0 && (
              <> &middot; {formatTime(totalActual)} focused (est. {formatTime(totalEstimated)})</>
            )}
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <Button
            className="rounded-full px-8"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? "Generating report..." : report ? "Regenerate report" : "Check my productivity"}
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => router.push("/task")}
          >
            New Session
          </Button>
        </div>

        {/* Actual vs Estimated comparison — always visible when tasks exist */}
        {comparisonData.length > 0 && totalActual > 0 && (
          <TaskComparisonChart data={comparisonData} />
        )}

        {report ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <ReportChart data={report.chart} />
            <Card className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold">{report.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {report.summary}
                </p>
              </div>
              <div className="space-y-3 text-sm">
                {(report.insights.length ? report.insights : fallbackInsights).map(
                  (insight, index) => (
                    <div
                      key={`${insight}-${index}`}
                      className="rounded-xl bg-muted/60 p-3"
                    >
                      {insight}
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            Click the button to generate your report.
          </Card>
        )}
      </main>
    </div>
  )
}

export default function ReportPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-hero" />}>
      <ReportContent />
    </React.Suspense>
  )
}
