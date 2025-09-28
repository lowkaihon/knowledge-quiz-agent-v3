import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all performance analytics for the user
    const { data: analytics, error } = await supabase
      .from("performance_analytics")
      .select("*")
      .eq("user_id", userId)
      .order("accuracy_percentage", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return Response.json({ error: "Failed to fetch performance analytics" }, { status: 500 })
    }

    // Get quiz results to calculate accurate totals
    const { data: quizResults, error: quizError } = await supabase
      .from("quiz_results")
      .select("score, total_questions")
      .eq("user_id", userId)

    if (quizError) {
      console.error("Quiz results error:", quizError)
      return Response.json({ error: "Failed to fetch quiz results" }, { status: 500 })
    }

    const totalQuestions = quizResults?.reduce((sum, result) => sum + result.total_questions, 0) || 0
    const totalCorrect = quizResults?.reduce((sum, result) => sum + result.score, 0) || 0
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

    // Separate strengths and weaknesses
    const weaknesses = analytics?.filter((a) => a.accuracy_percentage < 60) || []
    const strengths = analytics?.filter((a) => a.accuracy_percentage >= 80) || []
    const improving = analytics?.filter((a) => a.accuracy_percentage >= 60 && a.accuracy_percentage < 80) || []

    return Response.json({
      analytics: analytics || [],
      summary: {
        weaknesses,
        strengths,
        improving,
        overallAccuracy,
        totalAttempts: totalQuestions,
        totalCorrect,
        totalTopics: analytics?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching performance analytics:", error)
    return Response.json({ error: "Failed to fetch performance analytics" }, { status: 500 })
  }
}
