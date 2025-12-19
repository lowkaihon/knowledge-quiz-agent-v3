import { NextRequest, NextResponse } from "next/server"
import { extractText, getDocumentProxy } from "unpdf"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    const pdf = await getDocumentProxy(uint8Array)
    const { totalPages, text } = await extractText(pdf, { mergePages: true })

    return NextResponse.json({
      text,
      pageCount: totalPages,
    })
  } catch (error) {
    console.error("PDF extraction error:", error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
