import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json()

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    const extractedTexts: string[] = []

    for (const image of images) {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                image: image,
              },
              {
                type: "text",
                text: "Extract all text from this image. Return only the extracted text, preserving the original structure and formatting as much as possible. Do not add any commentary.",
              },
            ],
          },
        ],
      })
      extractedTexts.push(result.text)
    }

    return NextResponse.json({ text: extractedTexts.join("\n\n") })
  } catch (error) {
    console.error("Error extracting text with vision:", error)
    return NextResponse.json({ error: "Failed to extract text from images" }, { status: 500 })
  }
}
