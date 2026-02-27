import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/report/aggregate — Fetch all completed sessions' tasks for aggregate report
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all completed sessions
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, title, total_actual_seconds, total_estimated_seconds, completed_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [], tasks: [] }, { status: 200 })
    }

    const sessionIds = sessions.map((s) => s.id)

    // Fetch all tasks from completed sessions
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, session_id, title, estimated_seconds, actual_seconds, overtime_seconds, status")
      .in("session_id", sessionIds)
      .order("order_index", { ascending: true })

    return NextResponse.json({
      sessions,
      tasks: tasks ?? [],
    }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
