import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const SemanticTagsSchema = z.object({
  tags: z.array(z.string()),
  document_metadata: z.object({
    main_topics: z.array(z.string()),
    difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
    content_type: z.enum(["textbook", "notes", "article", "reference", "other"]),
  }),
})

export async function POST(request: Request) {
  try {
    const { title, content, fileName, fileType, userId } = await request.json()

    if (!title || !content || !userId) {
      return Response.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Process content into chunks (simple implementation - split by paragraphs)
    const chunks = content.split("\n\n").filter((chunk: string) => chunk.trim().length > 0)

    // Generate semantic tags using AI
    const semanticResult = await generateObject({
      model: openai("gpt-4o-mini"),
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
    const { data: studyMaterial, error } = await supabase
      .from("study_materials")
      .insert([
        {
          user_id: userId,
          title,
          original_content: content,
          processed_content: { chunks },
          file_name: fileName,
          file_type: fileType,
          document_metadata: semanticResult.object.document_metadata,
          semantic_tags: semanticResult.object.tags,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json({ error: "Failed to save study material" }, { status: 500 })
    }

    return Response.json({
      studyMaterial,
      message: "Study material saved successfully",
    })
  } catch (error) {
    console.error("Error saving study material:", error)
    return Response.json({ error: "Failed to process study material" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: materials, error } = await supabase
      .from("study_materials")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return Response.json({ error: "Failed to fetch study materials" }, { status: 500 })
    }

    return Response.json({ materials })
  } catch (error) {
    console.error("Error fetching study materials:", error)
    return Response.json({ error: "Failed to fetch study materials" }, { status: 500 })
  }
}
