import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { toSeconds } from "@/lib/time"

type RouteParams = { params: Promise<{ id: string }> }

type TaskInput = {
  title: string
  description?: string
  duration?: { hours: number; minutes: number; seconds: number }
  estimated_seconds?: number
}

// POST /api/sessions/[id]/tasks — Bulk create tasks for a session
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify session belongs to user
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const body = await request.json()
    const { tasks } = body as { tasks: TaskInput[] }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "Tasks array is required" }, { status: 400 })
    }

    // Delete existing tasks for this session (replace mode)
    await supabase
      .from("tasks")
      .delete()
      .eq("session_id", sessionId)

    // Insert new tasks
    const taskRows = tasks.map((task, index) => ({
      session_id: sessionId,
      order_index: index,
      title: task.title,
      description: task.description ?? null,
      estimated_seconds: task.estimated_seconds ??
        (task.duration ? toSeconds(task.duration.hours, task.duration.minutes, task.duration.seconds) : 0),
      status: "pending" as const,
    }))

    const { data, error } = await supabase
      .from("tasks")
      .insert(taskRows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update session's total estimated seconds
    const totalEstimated = taskRows.reduce((sum, t) => sum + t.estimated_seconds, 0)
    await supabase
      .from("sessions")
      .update({ total_estimated_seconds: totalEstimated })
      .eq("id", sessionId)

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sessions/[id]/tasks — Get all tasks for a session
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
