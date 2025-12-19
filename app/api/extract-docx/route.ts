import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await mammoth.extractRawText({ buffer })

    return NextResponse.json({ text: result.value })
  } catch (error) {
    console.error("DOCX extraction error:", error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
