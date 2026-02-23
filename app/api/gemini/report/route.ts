import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

import reportFallback from "@/data/reportFallback.json"

export const runtime = "nodejs"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ""

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

function safeJsonParse(text: string) {
  const trimmed = text.trim()
  const fenced = trimmed.replace(/```json|```/g, "").trim()
  const start = fenced.indexOf("{")
  const end = fenced.lastIndexOf("}")
  if (start === -1 || end === -1) {
    throw new Error("No JSON content")
  }
  return JSON.parse(fenced.slice(start, end + 1))
}

export async function POST(request: Request) {
  try {
    const { tasks } = (await request.json()) as {
      tasks?: Array<{
        title: string
        estimated_seconds?: number
        actual_seconds?: number
        overtime_seconds?: number
        done: boolean
        duration?: { hours: number; minutes: number; seconds: number }
      }>
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(reportFallback, { status: 200 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.done).length

    // Build a summary string with actual vs estimated data
    const taskSummaries = tasks.map((t) => {
      const est = t.estimated_seconds ?? 0
      const act = t.actual_seconds ?? 0
      const ot = t.overtime_seconds ?? 0
      return `- "${t.title}": estimated ${est}s, actual ${act}s, overtime ${ot}s, ${t.done ? "completed" : "incomplete"}`
    }).join("\n")

    const totalEstimated = tasks.reduce((s, t) => s + (t.estimated_seconds ?? 0), 0)
    const totalActual = tasks.reduce((s, t) => s + (t.actual_seconds ?? 0), 0)

    const prompt = `You are generating a productivity report for Dedicora, an AI focus partner app.
Return JSON only with this shape:
{
  "title": string,
  "summary": string,
  "insights": string[],
  "chart": [{ "name": string, "value": number }]
}
Total tasks: ${totalTasks}
Completed tasks: ${completedTasks}
Total estimated time: ${totalEstimated}s
Total actual time: ${totalActual}s

Task details:
${taskSummaries}

Use completion rates and actual vs estimated time to create actionable insights.
Focus on patterns: was the user over/under-estimating? Did they stay focused?
Create a bar-chart friendly data series in chart (3-6 items) comparing estimated vs actual per task (in minutes).
Keep the tone encouraging and supportive.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = safeJsonParse(text) as typeof reportFallback

    return NextResponse.json(parsed, { status: 200 })
  } catch {
    return NextResponse.json(reportFallback, { status: 200 })
  }
}
