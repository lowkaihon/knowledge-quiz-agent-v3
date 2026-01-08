import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database/client"
import type { User } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    // First, try to find existing user
    const existingUserResult = await query<User>(
      "SELECT * FROM users WHERE username = $1",
      [trimmedUsername]
    )

    if (existingUserResult.rows.length > 0) {
      // User exists, return existing user
      return NextResponse.json({ user: existingUserResult.rows[0] })
    }

    // User doesn't exist, create new user
    try {
      const newUserResult = await query<User>(
        "INSERT INTO users (username) VALUES ($1) RETURNING *",
        [trimmedUsername]
      )

      return NextResponse.json({ user: newUserResult.rows[0] })
    } catch (error: any) {
      // Check for unique constraint violation (23505 is PostgreSQL error code)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Username already taken. Please choose a different one." },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
