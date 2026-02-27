import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/sessions/[id] — Get session with tasks, notes, chat
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("session_id", id)
      .order("order_index", { ascending: true })

    // Fetch notes
    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    return NextResponse.json({
      ...session,
      tasks: tasks ?? [],
      notes: notes?.content ?? "",
    }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/sessions/[id] — Update session
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Only allow updating specific fields
    const allowedFields = [
      "title", "status", "current_step", "current_task_index",
      "total_estimated_seconds", "total_actual_seconds",
      "total_overtime_seconds", "total_break_seconds",
      "report_data", "completed_at",
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sessions/[id] — Soft-delete session (preserves time data)
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("sessions")
      .update({ status: "deleted" })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
