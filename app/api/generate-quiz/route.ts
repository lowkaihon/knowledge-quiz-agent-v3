import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

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

export async function POST(request: Request) {
  try {
    const { studyMaterial, config, userId, studyMaterialId } = await request.json()

    if (!studyMaterial || !config || !userId) {
      return Response.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const { length, difficulty, questionTypes, focusOnWeaknesses = false } = config
    const supabase = await createClient()

    let weaknessContext = ""
    let studyMaterialData = null

    // Get study material data if ID provided
    if (studyMaterialId) {
      const { data } = await supabase.from("study_materials").select("*").eq("id", studyMaterialId).single()

      studyMaterialData = data
    }

    // Get user weaknesses for personalization
    if (focusOnWeaknesses) {
      const { data: weaknesses } = await supabase
        .from("performance_analytics")
        .select("topic, accuracy_percentage")
        .eq("user_id", userId)
        .eq("is_weakness", true)
        .order("accuracy_percentage", { ascending: true })
        .limit(5)

      if (weaknesses && weaknesses.length > 0) {
        const weakTopics = weaknesses.map((w) => w.topic).join(", ")
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
      model: openai("gpt-4o-mini"),
      prompt,
      schema: QuizSchema,
    })

    // Validate and process the generated quiz
    const processedQuestions = result.object.questions.map((question, index) => ({
      ...question,
      id: `q${index + 1}`,
    }))

    // Save quiz to database if study material ID provided
    if (studyMaterialId) {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            user_id: userId,
            study_material_id: studyMaterialId,
            title: `Quiz: ${studyMaterialData?.title || "Study Material"}`,
            questions: processedQuestions,
            configuration: config,
          },
        ])
        .select()
        .single()

      if (quizError) {
        console.error("Error saving quiz:", quizError)
      }
    }

    return Response.json({
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
    return Response.json({ error: "Failed to generate quiz. Please try again." }, { status: 500 })
  }
}
