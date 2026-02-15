import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

function buildFallback(task: string, mode: string) {
  if (mode === "single") {
    return {
      summary: task,
      description: "Focus on completing this task.",
      steps: [
        {
          title: task,
          description: "Work through this task with full focus.",
          duration: { hours: 0, minutes: 25, seconds: 0 },
        },
      ],
    }
  }
  return {
    summary: task,
    description: `Break down "${task}" into manageable steps and tackle them one at a time.`,
    steps: [
      {
        title: `Plan and outline: ${task}`,
        description: "Understand the requirements and plan your approach.",
        duration: { hours: 0, minutes: 10, seconds: 0 },
      },
      {
        title: `Work on: ${task}`,
        description: "Execute the main work for this task.",
        duration: { hours: 0, minutes: 25, seconds: 0 },
      },
      {
        title: `Review and finish: ${task}`,
        description: "Review your work and wrap up.",
        duration: { hours: 0, minutes: 10, seconds: 0 },
      },
    ],
  }
}

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
    const { task, mode } = (await request.json()) as {
      task: string
      mode?: "single" | "breakdown"
    }

    if (!task) {
      return NextResponse.json(buildFallback("Unnamed task", mode ?? "single"), { status: 200 })
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    })

    const prompt = `You are a task-planning assistant for a productivity app called Dedicora.

The user wants to accomplish the following task:
"${task}"

Mode: ${mode ?? "single"}

Your job is to analyze THIS SPECIFIC task and break it down into concrete, actionable steps that are directly relevant to "${task}".

Rules:
- Every step title and description MUST be specifically about "${task}", not generic productivity advice.
- If mode is "single", return exactly 1 step.
- If mode is "breakdown", return 3-6 steps that logically decompose "${task}" into sequential sub-tasks.
- Set realistic durations based on the complexity of each step.
- The "summary" should be a short one-line summary of the task.
- The "description" should explain the overall approach to completing "${task}".

Return ONLY valid JSON with this exact shape:
{
  "summary": string,
  "description": string,
  "steps": [
    { "title": string, "description": string, "duration": { "hours": number, "minutes": number, "seconds": number } }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const parsed = safeJsonParse(text) as ReturnType<typeof buildFallback>
    return NextResponse.json(parsed, { status: 200 })
  } catch {
    const { task, mode } = await request.clone().json().catch(() => ({ task: "Unnamed task", mode: "single" })) as { task: string; mode: string }
    return NextResponse.json(buildFallback(task || "Unnamed task", mode || "single"), { status: 200 })
  }
}
