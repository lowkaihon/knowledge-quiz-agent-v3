import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get all performance analytics for the user
    const analyticsResult = await query(
      `SELECT * FROM performance_analytics
       WHERE user_id = $1
       ORDER BY accuracy_percentage ASC`,
      [userId]
    )

    // Get quiz results to calculate accurate totals
    const quizResultsData = await query(
      `SELECT score, total_questions FROM quiz_results
       WHERE user_id = $1`,
      [userId]
    )

    const analytics = analyticsResult.rows
    const quizResults = quizResultsData.rows

    const totalQuestions = quizResults.reduce((sum: number, result: any) => sum + result.total_questions, 0)
    const totalCorrect = quizResults.reduce((sum: number, result: any) => sum + result.score, 0)
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

    // Separate strengths and weaknesses
    const weaknesses = analytics.filter((a: any) => a.accuracy_percentage < 60)
    const strengths = analytics.filter((a: any) => a.accuracy_percentage >= 80)
    const improving = analytics.filter((a: any) => a.accuracy_percentage >= 60 && a.accuracy_percentage < 80)

    return NextResponse.json({
      analytics,
      summary: {
        weaknesses,
        strengths,
        improving,
        overallAccuracy,
        totalAttempts: totalQuestions,
        totalCorrect,
        totalTopics: analytics.length,
      },
    })
  } catch (error) {
    console.error("Error fetching performance analytics:", error)
    return NextResponse.json({ error: "Failed to fetch performance analytics" }, { status: 500 })
  }
}
