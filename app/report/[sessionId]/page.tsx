"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReportChart, type ChartDatum } from "@/components/report-chart"
import { TaskComparisonChart, type ComparisonDatum } from "@/components/task-comparison-chart"
import { formatTime } from "@/lib/time"

type ReportResponse = {
  title: string
  summary: string
  insights: string[]
  chart: ChartDatum[]
}

type SessionTask = {
  title: string
  estimated_seconds: number
  actual_seconds: number
  overtime_seconds: number
  status: string
}

type SessionData = {
  id: string
  goal: string
  status: string
  report_data: ReportResponse | null
  tasks: SessionTask[]
  total_actual_seconds: number
  total_estimated_seconds: number
  created_at: string
}

export default function PastReportPage() {
  const router = useRouter()
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId

  const [session, setSession] = React.useState<SessionData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [regenerating, setRegenerating] = React.useState(false)
  const [report, setReport] = React.useState<ReportResponse | null>(null)

  React.useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SessionData | null) => {
        if (!data) return
        setSession(data)
        if (data.report_data) setReport(data.report_data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const comparisonData: ComparisonDatum[] = React.useMemo(() => {
    if (!session?.tasks) return []
    return session.tasks.map((t) => ({
      name: t.title.length > 14 ? t.title.slice(0, 12) + "\u2026" : t.title,
      estimated: +(t.estimated_seconds / 60).toFixed(1),
      actual: +(t.actual_seconds / 60).toFixed(1),
    }))
  }, [session])

  const regenerateReport = async () => {
    if (!session?.tasks) return
    setRegenerating(true)
    try {
      const enriched = session.tasks.map((t) => ({
        title: t.title,
        estimated_seconds: t.estimated_seconds,
        actual_seconds: t.actual_seconds,
        overtime_seconds: t.overtime_seconds,
        done: t.status === "completed",
      }))

      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: enriched }),
      })
      const data = (await response.json()) as ReportResponse
      setReport(data)

      // Cache updated report
      fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_data: data }),
      }).catch(() => {})
    } catch {
      // Keep existing report
    } finally {
      setRegenerating(false)
    }
  }

  const completedCount = session?.tasks.filter((t) => t.status === "completed").length ?? 0
  const totalTasks = session?.tasks.length ?? 0
  const totalActual = session?.total_actual_seconds ?? 0
  const totalEstimated = session?.total_estimated_seconds ?? 0

  if (loading) {
    return (
      <div className="relative min-h-screen bg-hero px-6 py-10">
        <TopBar />
        <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <p className="text-muted-foreground">Loading session report…</p>
        </main>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="relative min-h-screen bg-hero px-6 py-10">
        <TopBar />
        <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Session not found</h1>
          <p className="text-sm text-muted-foreground">
            This session may have been deleted or you don&apos;t have access.
          </p>
          <Button className="rounded-full px-6" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-hero px-6 py-10">
      <TopBar />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Past Session Report
          </p>
          <h1 className="text-3xl font-semibold">
            {session.goal || "Productivity Report"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalTasks} tasks completed
            {totalActual > 0 && (
              <> &middot; {formatTime(totalActual)} focused (est. {formatTime(totalEstimated)})</>
            )}
            <> &middot; {new Date(session.created_at).toLocaleDateString()}</>
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <Button
            className="rounded-full px-8"
            onClick={regenerateReport}
            disabled={regenerating}
          >
            {regenerating
              ? "Generating…"
              : report
                ? "Regenerate report"
                : "Generate report"}
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>

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
                {report.insights.map((insight, index) => (
                  <div
                    key={`${insight}-${index}`}
                    className="rounded-xl bg-muted/60 p-3"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            Click the button above to generate an AI report for this session.
          </Card>
        )}
      </main>
    </div>
  )
}
