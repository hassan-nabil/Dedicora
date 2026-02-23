import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/sessions — Create a new session
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, mode = "single" } = body as { title: string; mode?: string }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check for existing active session — only one allowed at a time
    const { data: activeSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (activeSession) {
      // Mark existing active session as abandoned
      await supabase
        .from("sessions")
        .update({ status: "abandoned" })
        .eq("id", activeSession.id)
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        title,
        mode: mode as "single" | "breakdown",
        status: "active",
        current_step: "assign",
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sessions — List user's sessions
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)

    let query = supabase
      .from("sessions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status as "active" | "paused" | "completed" | "abandoned")
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: data, total: count }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
