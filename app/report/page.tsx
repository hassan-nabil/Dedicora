"use client"

import * as React from "react"

import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReportChart, type ChartDatum } from "@/components/report-chart"
import { useFlow } from "@/components/providers/flow-provider"

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

export default function ReportPage() {
  const { taskList } = useFlow()
  const [loading, setLoading] = React.useState(false)
  const [report, setReport] = React.useState<ReportResponse | null>(null)

  const generateReport = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: taskList }),
      })
      const data = (await response.json()) as ReportResponse
      setReport(data)
    } catch {
      const fallback = await import("@/data/reportFallback.json")
      setReport(fallback.default as ReportResponse)
    } finally {
      setLoading(false)
    }
  }, [taskList])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const requested = window.sessionStorage.getItem("reportRequested")
    if (requested === "true" && !report && !loading) {
      window.sessionStorage.removeItem("reportRequested")
      void generateReport()
    }
  }, [generateReport, loading, report])

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
            Generate a chart summary and bullet insights based on your session.
          </p>
        </header>

        <div>
          <Button
            className="rounded-full px-8"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? "Generating report..." : "Check my productivity"}
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
