import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database/client"
import { generateObject } from "ai"
import { gptMini } from "@/lib/ai/azure-openai"
import { z } from "zod"

const SemanticTagsSchema = z.object({
  tags: z.array(z.string()),
  document_metadata: z.object({
    main_topics: z.array(z.string()),
    difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
    content_type: z.enum(["textbook", "notes", "article", "reference", "other"]),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const { title, content, fileName, fileType, userId } = await request.json()

    if (!title || !content || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Process content into chunks (simple implementation - split by paragraphs)
    const chunks = content.split("\n\n").filter((chunk: string) => chunk.trim().length > 0)

    // Generate semantic tags using AI
    const semanticResult = await generateObject({
      model: gptMini,
      prompt: `
        Analyze the following study material and extract semantic tags and metadata:

        Title: ${title}
        Content: ${content.substring(0, 2000)}...

        Extract:
        1. Semantic tags (topics, concepts, keywords) - max 10 tags
        2. Document metadata including main topics, difficulty level, and content type
        
        Focus on educational concepts, subject areas, and key topics that would be useful for quiz generation.
      `,
      schema: SemanticTagsSchema,
    })

    // Store study material in database
    const result = await query(
      `INSERT INTO study_materials (
        user_id, title, original_content, processed_content,
        file_name, file_type, document_metadata, semantic_tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        title,
        content,
        JSON.stringify({ chunks }),
        fileName,
        fileType,
        JSON.stringify(semanticResult.object.document_metadata),
        semanticResult.object.tags,
      ]
    )

    const studyMaterial = result.rows[0]

    return NextResponse.json({
      studyMaterial,
      message: "Study material saved successfully",
    })
  } catch (error) {
    console.error("Error saving study material:", error)
    return NextResponse.json({ error: "Failed to process study material" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const result = await query(
      `SELECT * FROM study_materials
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    return NextResponse.json({ materials: result.rows })
  } catch (error) {
    console.error("Error fetching study materials:", error)
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 })
  }
}
