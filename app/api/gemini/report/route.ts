import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

import reportFallback from "@/data/reportFallback.json"

export const runtime = "nodejs"

const GEMINI_API_KEY = "AIzaSyCm3MYWgZu3Pn4Q7r3siWtbK7lzuYgucvs"

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
      tasks?: Array<{ title: string; duration: { hours: number; minutes: number; seconds: number }; done: boolean }>
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(reportFallback, { status: 200 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.done).length

    const prompt = `You are generating a productivity report for Dedicora.
Return JSON only with this shape:
{
  "title": string,
  "summary": string,
  "insights": string[],
  "chart": [{ "name": string, "value": number }]
}
Total tasks: ${totalTasks}
Completed tasks: ${completedTasks}
Tasks: ${JSON.stringify(tasks)}
Use completion and duration patterns to create insights.
Create a bar-chart friendly data series in chart, with 3-6 items.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = safeJsonParse(text) as typeof reportFallback

    return NextResponse.json(parsed, { status: 200 })
  } catch {
    return NextResponse.json(reportFallback, { status: 200 })
  }
}
