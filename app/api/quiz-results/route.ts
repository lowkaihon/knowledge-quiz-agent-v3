import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, quizId, studyMaterialId, questions, userAnswers, score, totalQuestions, timeTaken } =
      await request.json()

    if (!userId || !questions || !userAnswers) {
      return Response.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    const quizIdToSave = quizId || null
    const studyMaterialIdToSave = studyMaterialId || null

    // Calculate performance metrics
    const topicPerformance: Record<string, { correct: number; total: number }> = {}
    const questionTypePerformance: Record<string, { correct: number; total: number }> = {}
    const difficultyPerformance: Record<string, { correct: number; total: number }> = {}

    questions.forEach((question: any) => {
      const userAnswer = userAnswers[question.id]
      const isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()

      // Track topic performance
      if (question.topics && question.topics.length > 0) {
        question.topics.forEach((topic: string) => {
          if (!topicPerformance[topic]) {
            topicPerformance[topic] = { correct: 0, total: 0 }
          }
          topicPerformance[topic].total++
          if (isCorrect) topicPerformance[topic].correct++
        })
      }

      // Track question type performance
      const questionType = question.type
      if (!questionTypePerformance[questionType]) {
        questionTypePerformance[questionType] = { correct: 0, total: 0 }
      }
      questionTypePerformance[questionType].total++
      if (isCorrect) questionTypePerformance[questionType].correct++

      // Track difficulty performance
      const difficulty = question.difficulty || "medium"
      if (!difficultyPerformance[difficulty]) {
        difficultyPerformance[difficulty] = { correct: 0, total: 0 }
      }
      difficultyPerformance[difficulty].total++
      if (isCorrect) difficultyPerformance[difficulty].correct++
    })

    // Save quiz result
    const { data: quizResult, error: resultError } = await supabase
      .from("quiz_results")
      .insert([
        {
          user_id: userId,
          quiz_id: quizIdToSave, // Use null-safe value
          study_material_id: studyMaterialIdToSave, // Use null-safe value
          answers: questions.map((q: any) => ({
            question_id: q.id,
            question: q.question,
            user_answer: userAnswers[q.id] || "",
            correct_answer: q.correctAnswer,
            is_correct: userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
            topics: q.topics || [],
            difficulty: q.difficulty || "medium",
            type: q.type,
          })),
          score,
          total_questions: totalQuestions,
          time_taken: timeTaken,
          topic_performance: topicPerformance,
          question_type_performance: questionTypePerformance,
          difficulty_performance: difficultyPerformance,
        },
      ])
      .select()
      .single()

    if (resultError) {
      console.error("Error saving quiz result:", resultError)
      return Response.json({ error: "Failed to save quiz result" }, { status: 500 })
    }

    // Update performance analytics for each topic
    for (const [topic, performance] of Object.entries(topicPerformance)) {
      const { data: recentQuestions } = await supabase
        .from("quiz_results")
        .select("answers")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(50) // Get more results to ensure we have enough questions for this topic

      // Extract questions for this specific topic from recent quiz results
      const topicQuestions: any[] = []
      if (recentQuestions) {
        for (const result of recentQuestions) {
          if (result.answers && Array.isArray(result.answers)) {
            const questionsForTopic = result.answers.filter(
              (answer: any) => answer.topics && answer.topics.includes(topic),
            )
            topicQuestions.push(...questionsForTopic)
          }
        }
      }

      // Add current quiz questions for this topic
      const currentTopicQuestions = questions
        .filter((q: any) => q.topics && q.topics.includes(topic))
        .map((q: any) => ({
          question_id: q.id,
          question: q.question,
          user_answer: userAnswers[q.id] || "",
          correct_answer: q.correctAnswer,
          is_correct: userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
          topics: q.topics || [],
          difficulty: q.difficulty || "medium",
          type: q.type,
        }))

      topicQuestions.push(...currentTopicQuestions)

      // Sort by most recent and take last 10 questions for this topic
      const last10Questions = topicQuestions.slice(0, 10)

      // Calculate rolling accuracy for weakness detection
      let rollingAccuracy = 0
      let isWeakness = false

      if (last10Questions.length >= 10) {
        const correctInLast10 = last10Questions.filter((q) => q.is_correct).length
        rollingAccuracy = (correctInLast10 / 10) * 100
        isWeakness = rollingAccuracy < 60
      }

      const { data: existingAnalytics } = await supabase
        .from("performance_analytics")
        .select("*")
        .eq("user_id", userId)
        .eq("topic", topic)
        .limit(1)

      const existingRecord = existingAnalytics && existingAnalytics.length > 0 ? existingAnalytics[0] : null

      if (existingRecord) {
        // Update existing analytics
        const newTotalAttempts = existingRecord.total_attempts + performance.total
        const newCorrectAnswers = existingRecord.correct_answers + performance.correct
        const newAccuracy = (newCorrectAnswers / newTotalAttempts) * 100

        await supabase
          .from("performance_analytics")
          .update({
            total_attempts: newTotalAttempts,
            correct_answers: newCorrectAnswers,
            accuracy_percentage: newAccuracy,
            is_weakness: isWeakness,
            last_updated: new Date().toISOString(),
          })
          .eq("id", existingRecord.id)
      } else {
        // Create new analytics record
        const accuracy = (performance.correct / performance.total) * 100

        await supabase.from("performance_analytics").insert([
          {
            user_id: userId,
            topic,
            total_attempts: performance.total,
            correct_answers: performance.correct,
            accuracy_percentage: accuracy,
            is_weakness: isWeakness,
          },
        ])
      }
    }

    return Response.json({
      quizResult,
      message: "Quiz result saved and analytics updated successfully",
    })
  } catch (error) {
    console.error("Error saving quiz result:", error)
    return Response.json({ error: "Failed to save quiz result" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit") || "10"

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: results, error } = await supabase
      .from("quiz_results")
      .select(`
        *,
        quizzes(title),
        study_materials(title)
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (error) {
      console.error("Database error:", error)
      return Response.json({ error: "Failed to fetch quiz results" }, { status: 500 })
    }

    return Response.json({ results: results || [] })
  } catch (error) {
    console.error("Error fetching quiz results:", error)
    return Response.json({ error: "Failed to fetch quiz results" }, { status: 500 })
  }
}
