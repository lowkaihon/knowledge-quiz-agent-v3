import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database/client"

export async function POST(request: NextRequest) {
  try {
    const { userId, quizId, studyMaterialId, questions, userAnswers, score, totalQuestions, timeTaken } =
      await request.json()

    if (!userId || !questions || !userAnswers) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

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
    const answers = questions.map((q: any) => ({
      question_id: q.id,
      question: q.question,
      user_answer: userAnswers[q.id] || "",
      correct_answer: q.correctAnswer,
      is_correct: userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
      topics: q.topics || [],
      difficulty: q.difficulty || "medium",
      type: q.type,
    }))

    const result = await query(
      `INSERT INTO quiz_results (
        user_id, quiz_id, study_material_id, answers, score,
        total_questions, time_taken, topic_performance,
        question_type_performance, difficulty_performance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        quizIdToSave,
        studyMaterialIdToSave,
        JSON.stringify(answers),
        score,
        totalQuestions,
        timeTaken,
        JSON.stringify(topicPerformance),
        JSON.stringify(questionTypePerformance),
        JSON.stringify(difficultyPerformance),
      ]
    )

    const quizResult = result.rows[0]

    // Update performance analytics for each topic
    for (const [topic, performance] of Object.entries(topicPerformance)) {
      const recentResult = await query(
        `SELECT answers FROM quiz_results
         WHERE user_id = $1
         ORDER BY completed_at DESC
         LIMIT 50`,
        [userId]
      )

      // Extract questions for this specific topic from recent quiz results
      const topicQuestions: any[] = []
      if (recentResult.rows.length > 0) {
        for (const row of recentResult.rows) {
          // Parse JSONB answers field
          const answersData = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
          if (answersData && Array.isArray(answersData)) {
            const questionsForTopic = answersData.filter(
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

      const existingResult = await query(
        `SELECT * FROM performance_analytics
         WHERE user_id = $1 AND topic = $2
         LIMIT 1`,
        [userId, topic]
      )

      const existingRecord = existingResult.rows.length > 0 ? existingResult.rows[0] : null

      if (existingRecord) {
        // Update existing analytics
        const newTotalAttempts = existingRecord.total_attempts + performance.total
        const newCorrectAnswers = existingRecord.correct_answers + performance.correct
        const newAccuracy = (newCorrectAnswers / newTotalAttempts) * 100

        await query(
          `UPDATE performance_analytics
           SET total_attempts = $1,
               correct_answers = $2,
               accuracy_percentage = $3,
               is_weakness = $4,
               last_updated = NOW()
           WHERE id = $5`,
          [newTotalAttempts, newCorrectAnswers, newAccuracy, isWeakness, existingRecord.id]
        )
      } else {
        // Create new analytics record
        const accuracy = (performance.correct / performance.total) * 100

        await query(
          `INSERT INTO performance_analytics (
            user_id, topic, total_attempts, correct_answers,
            accuracy_percentage, is_weakness
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, topic, performance.total, performance.correct, accuracy, isWeakness]
        )
      }
    }

    return NextResponse.json({
      quizResult,
      message: "Quiz result saved and analytics updated successfully",
    })
  } catch (error) {
    console.error("Error saving quiz result:", error)
    return NextResponse.json({ error: "Failed to save quiz result" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit") || "10"

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Fetch quiz results with related data using LEFT JOINs
    const result = await query(
      `SELECT
        qr.*,
        q.title as quiz_title,
        sm.title as study_material_title
       FROM quiz_results qr
       LEFT JOIN quizzes q ON qr.quiz_id = q.id
       LEFT JOIN study_materials sm ON qr.study_material_id = sm.id
       WHERE qr.user_id = $1
       ORDER BY qr.completed_at DESC
       LIMIT $2`,
      [userId, Number.parseInt(limit)]
    )

    // Format results to match Supabase's nested structure
    const formattedResults = result.rows.map((row: any) => ({
      ...row,
      quizzes: row.quiz_title ? { title: row.quiz_title } : null,
      study_materials: row.study_material_title ? { title: row.study_material_title } : null,
    }))

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error("Error fetching quiz results:", error)
    return NextResponse.json({ error: "Failed to fetch quiz results" }, { status: 500 })
  }
}
