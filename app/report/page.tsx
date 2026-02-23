"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReportChart, type ChartDatum } from "@/components/report-chart"
import { useFlow } from "@/components/providers/flow-provider"
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

function ReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")
  const { taskList, sessionId, setSessionId, loadSession } = useFlow()

  const [loading, setLoading] = React.useState(false)
  const [report, setReport] = React.useState<ReportResponse | null>(null)
  const [loaded, setLoaded] = React.useState(false)

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

  const enrichedTasks = React.useMemo(() => {
    return taskList.map((t) => ({
      title: t.title,
      estimated_seconds: toSeconds(t.duration.hours, t.duration.minutes, t.duration.seconds),
      actual_seconds: t.actualSeconds ?? 0,
      overtime_seconds: t.overtimeSeconds ?? 0,
      done: t.done,
    }))
  }, [taskList])

  const generateReport = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: enrichedTasks }),
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
  }, [enrichedTasks, sessionId, sessionParam])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const requested = window.sessionStorage.getItem("reportRequested")
    if (requested === "true" && !report && !loading) {
      window.sessionStorage.removeItem("reportRequested")
      void generateReport()
    }
  }, [generateReport, loading, report])

  // Summary stats
  const totalEstimated = enrichedTasks.reduce((s, t) => s + t.estimated_seconds, 0)
  const totalActual = enrichedTasks.reduce((s, t) => s + t.actual_seconds, 0)
  const completedCount = enrichedTasks.filter((t) => t.done).length

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
            {completedCount}/{enrichedTasks.length} tasks completed
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
