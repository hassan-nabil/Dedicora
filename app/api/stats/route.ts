import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/stats — User statistics for dashboard
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all completed sessions
    const { data: completedSessions } = await supabase
      .from("sessions")
      .select("id, total_actual_seconds, completed_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })

    // Fetch all sessions count
    const { count: totalSessionsCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["completed", "active", "paused"])

    const sessions = completedSessions ?? []
    const totalSessions = totalSessionsCount ?? 0

    // Total focus time
    const totalFocusSeconds = sessions.reduce(
      (sum, s) => sum + (s.total_actual_seconds ?? 0),
      0
    )
    const totalFocusHours = Math.round((totalFocusSeconds / 3600) * 10) / 10

    // Completion rate
    const { count: allSessionsCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "active")

    const completionRate =
      allSessionsCount && allSessionsCount > 0
        ? Math.round((sessions.length / allSessionsCount) * 100)
        : 0

    // Streak calculation
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completionDates = new Set(
      sessions
        .filter((s) => s.completed_at)
        .map((s) => {
          const d = new Date(s.completed_at!)
          d.setHours(0, 0, 0, 0)
          return d.toISOString()
        })
    )

    const sortedDates = Array.from(completionDates)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    if (sortedDates.length > 0) {
      // Check if the most recent date is today or yesterday
      const mostRecent = sortedDates[0]
      const daysDiff = Math.floor(
        (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff <= 1) {
        // Streak is alive
        currentStreak = 1
        for (let i = 1; i < sortedDates.length; i++) {
          const diff = Math.floor(
            (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
              (1000 * 60 * 60 * 24)
          )
          if (diff === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }

      // Longest streak
      tempStreak = 1
      longestStreak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = Math.floor(
          (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
            (1000 * 60 * 60 * 24)
        )
        if (diff === 1) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 1
        }
      }
    }

    // This week's hours
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)

    const thisWeekSeconds = sessions
      .filter((s) => s.completed_at && new Date(s.completed_at) >= startOfWeek)
      .reduce((sum, s) => sum + (s.total_actual_seconds ?? 0), 0)

    const thisWeekHours = Math.round((thisWeekSeconds / 3600) * 10) / 10

    // Last week's hours
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    const lastWeekSeconds = sessions
      .filter(
        (s) =>
          s.completed_at &&
          new Date(s.completed_at) >= startOfLastWeek &&
          new Date(s.completed_at) < startOfWeek
      )
      .reduce((sum, s) => sum + (s.total_actual_seconds ?? 0), 0)

    const lastWeekHours = Math.round((lastWeekSeconds / 3600) * 10) / 10

    // Daily stats for the current week (for chart)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dailyStats = dayNames.map((name, dayIndex) => {
      const dayDate = new Date(startOfWeek)
      dayDate.setDate(startOfWeek.getDate() + dayIndex)
      const dayStr = dayDate.toISOString().split("T")[0]

      const daySeconds = sessions
        .filter((s) => {
          if (!s.completed_at) return false
          const d = new Date(s.completed_at)
          return d.toISOString().split("T")[0] === dayStr
        })
        .reduce((sum, s) => sum + (s.total_actual_seconds ?? 0), 0)

      return {
        name,
        value: Math.round((daySeconds / 3600) * 10) / 10,
      }
    })

    return NextResponse.json(
      {
        totalSessions,
        totalFocusHours,
        currentStreak,
        longestStreak,
        thisWeekHours,
        lastWeekHours,
        completionRate,
        dailyStats,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
