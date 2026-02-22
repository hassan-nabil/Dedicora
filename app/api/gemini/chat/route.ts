import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

const GEMINI_API_KEY = "YOUR_API_KEY_HERE"

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type TaskContext = {
  mainTask: string
  currentTask?: {
    title: string
    description?: string
  }
  allTasks?: Array<{
    title: string
    done: boolean
  }>
  completedCount?: number
  totalCount?: number
}

export async function POST(request: Request) {
  try {
    const { messages, taskContext } = (await request.json()) as {
      messages: ChatMessage[]
      taskContext?: TaskContext
    }

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    })

    // Build system context from the user's current task
    let systemContext = `You are Dedicora AI — a helpful, focused assistant built into a productivity app called Dedicora. Your job is to help users complete their tasks efficiently.

Key behaviors:
- Be concise and actionable. Users are in a focus session, so respect their time.
- Give specific, practical advice related to their current task.
- If they ask for help with their task, provide step-by-step guidance, code snippets, explanations, or resources as appropriate.
- If they seem stuck, suggest approaches or break the problem down further.
- Stay encouraging but not overly cheerful. Be a focused work partner.
- Format responses with markdown when helpful (bullet points, code blocks, headers).`

    if (taskContext) {
      systemContext += `\n\n--- CURRENT SESSION CONTEXT ---`
      systemContext += `\nMain Goal: "${taskContext.mainTask}"`

      if (taskContext.currentTask) {
        systemContext += `\nCurrently Working On: "${taskContext.currentTask.title}"`
        if (taskContext.currentTask.description) {
          systemContext += `\nTask Description: "${taskContext.currentTask.description}"`
        }
      }

      if (taskContext.totalCount && taskContext.completedCount !== undefined) {
        systemContext += `\nProgress: ${taskContext.completedCount}/${taskContext.totalCount} tasks completed`
      }

      if (taskContext.allTasks && taskContext.allTasks.length > 1) {
        systemContext += `\nAll Tasks:`
        taskContext.allTasks.forEach((t, i) => {
          systemContext += `\n  ${i + 1}. ${t.done ? "✅" : "⬜"} ${t.title}`
        })
      }

      systemContext += `\n--- END CONTEXT ---\n\nUse this context to give relevant, task-specific help. Reference the user's actual task when possible.`
    }

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content }],
    }))

    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "System instructions: " + systemContext }] },
        { role: "model", parts: [{ text: "Understood. I'm Dedicora AI, ready to help you stay focused and complete your tasks. How can I help?" }] },
        ...history,
      ],
    })

    // Stream the response
    const result = await chat.sendMessageStream(lastMessage.content)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch {
    return new Response("I'm having trouble connecting right now. Please try again in a moment.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }
}
