import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get user's weak topics (accuracy < 60% with >= 10 attempts)
    const { data: weaknesses, error } = await supabase
      .from("performance_analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("is_weakness", true)
      .order("accuracy_percentage", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch user weaknesses" }, { status: 500 })
    }

    return NextResponse.json({ weaknesses: weaknesses || [] })
  } catch (error) {
    console.error("Error fetching user weaknesses:", error)
    return NextResponse.json({ error: "Failed to fetch user weaknesses" }, { status: 500 })
  }
}
