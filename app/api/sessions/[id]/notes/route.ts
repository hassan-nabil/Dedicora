import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

// PUT /api/sessions/[id]/notes — Upsert notes for a session
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body as { content: string }

    const { data, error } = await supabase
      .from("notes")
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          content: content ?? "",
        },
        { onConflict: "session_id,user_id" }
      )
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

// GET /api/sessions/[id]/notes — Get notes for a session
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle()

    return NextResponse.json({ content: data?.content ?? "" }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
