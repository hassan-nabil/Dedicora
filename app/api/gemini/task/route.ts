import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

import taskFallback from "@/data/taskFallback.json"

export const runtime = "nodejs"

const GEMINI_API_KEY = "PASTE_YOUR_GEMINI_KEY"

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
    const { task, mode } = (await request.json()) as {
      task: string
      mode?: "single" | "breakdown"
    }

    if (!task) {
      return NextResponse.json(taskFallback, { status: 200 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `You are assisting a productivity app called Dedicora.
Return JSON only with the following shape:
{
  "summary": string,
  "description": string,
  "steps": [
    { "title": string, "description": string, "duration": { "hours": number, "minutes": number, "seconds": number } }
  ]
}
Task: ${task}
Mode: ${mode ?? "single"}
If mode is "single", return one step only.
Keep durations realistic and short for a demo.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const parsed = safeJsonParse(text) as typeof taskFallback
    return NextResponse.json(parsed, { status: 200 })
  } catch {
    return NextResponse.json(taskFallback, { status: 200 })
  }
}
