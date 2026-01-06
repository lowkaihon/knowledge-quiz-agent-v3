import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user's weak topics (accuracy < 60% with >= 10 attempts)
    const result = await query(
      `SELECT * FROM performance_analytics
       WHERE user_id = $1 AND is_weakness = true
       ORDER BY accuracy_percentage ASC`,
      [userId]
    )

    return NextResponse.json({ weaknesses: result.rows })
  } catch (error) {
    console.error("Error fetching user weaknesses:", error)
    return NextResponse.json({ error: "Failed to fetch user weaknesses" }, { status: 500 })
  }
}
