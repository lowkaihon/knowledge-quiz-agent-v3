import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { gptMini } from "@/lib/ai/azure-openai"
import { z } from "zod"
import { query } from "@/lib/database/client"

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "true-false", "short-answer"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(z.string()),
})

const QuizSchema = z.object({
  questions: z.array(QuestionSchema),
})

export async function POST(request: NextRequest) {
  try {
    const { studyMaterial, config, userId, studyMaterialId } = await request.json()

    if (!studyMaterial || !config || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const { length, difficulty, questionTypes, focusOnWeaknesses = false } = config

    let weaknessContext = ""
    let studyMaterialData = null

    // Get study material data if ID provided
    if (studyMaterialId) {
      const result = await query(
        `SELECT * FROM study_materials WHERE id = $1`,
        [studyMaterialId]
      )
      studyMaterialData = result.rows[0]
    }

    // Get user weaknesses for personalization
    if (focusOnWeaknesses) {
      const result = await query(
        `SELECT topic, accuracy_percentage
         FROM performance_analytics
         WHERE user_id = $1 AND is_weakness = true
         ORDER BY accuracy_percentage ASC
         LIMIT 5`,
        [userId]
      )

      if (result.rows.length > 0) {
        const weakTopics = result.rows.map((w: any) => w.topic).join(", ")
        weaknessContext = `\n\nIMPORTANT: This user has shown weakness in these topics: ${weakTopics}.
        Focus 60-70% of questions on these weak areas while maintaining the specified difficulty level.
        Ensure questions targeting weak areas are clear and educational to help the user improve.`
      }
    }

    // Enhanced prompt with personalization
    const prompt = `
You are an expert quiz generator. Create a comprehensive quiz based on the provided study material.

Study Material:
${studyMaterial}

${
  studyMaterialData
    ? `
Study Material Metadata:
- Title: ${studyMaterialData.title}
- Semantic Tags: ${studyMaterialData.semantic_tags?.join(", ") || "None"}
- Main Topics: ${studyMaterialData.document_metadata?.main_topics?.join(", ") || "None"}
- Content Type: ${studyMaterialData.document_metadata?.content_type || "Unknown"}
`
    : ""
}

Quiz Requirements:
- Number of questions: ${length}
- Difficulty level: ${difficulty}
- Question types: ${questionTypes.join(", ")}
${weaknessContext}

Instructions:
1. Generate exactly ${length} questions from the study material
2. Distribute question types as evenly as possible among: ${questionTypes.join(", ")}
3. For multiple-choice questions: provide exactly 4 options with only 1 correct answer
4. For true-false questions: make statements that can be clearly true or false
5. For short-answer questions: create fill-in-the-blank style questions
6. Difficulty level "${difficulty}":
   - Easy: Basic recall and understanding
   - Medium: Application and analysis
   - Hard: Synthesis and evaluation
7. Each question must include a detailed explanation referencing the original material
8. Ensure questions cover different parts of the study material
9. Make questions specific and avoid ambiguity
10. For multiple-choice, ensure distractors are plausible but clearly incorrect
11. Assign relevant topic tags to each question for analytics
12. Set appropriate difficulty level for each question (can vary within overall difficulty)

Generate unique IDs for each question using the format "q1", "q2", etc.
`

    const result = await generateObject({
      model: gptMini,
      prompt,
      schema: QuizSchema,
      experimental_repairText: async ({ text }) => {
        // Fix common JSON key typos like "type=" -> "type"
        const repaired = text.replace(/"(\w+)=":/g, '"$1":')
        return repaired
      },
    })

    // Validate and process the generated quiz
    const processedQuestions = result.object.questions.map((question, index) => ({
      ...question,
      id: `q${index + 1}`,
    }))

    // Save quiz to database if study material ID provided
    if (studyMaterialId) {
      try {
        await query(
          `INSERT INTO quizzes (user_id, study_material_id, title, questions, configuration)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            studyMaterialId,
            `Quiz: ${studyMaterialData?.title || "Study Material"}`,
            JSON.stringify(processedQuestions),
            JSON.stringify(config),
          ]
        )
      } catch (error) {
        console.error("Error saving quiz:", error)
      }
    }

    return NextResponse.json({
      questions: processedQuestions,
      metadata: {
        totalQuestions: processedQuestions.length,
        difficulty,
        questionTypes,
        focusOnWeaknesses,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz. Please try again." }, { status: 500 })
  }
}
