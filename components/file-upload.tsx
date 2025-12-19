"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const MIN_TEXT_LENGTH = 100 // Threshold for triggering vision fallback

interface FileUploadProps {
  onMaterialUploaded: (material: string) => void
  user?: { id: string; username: string }
}

export function FileUpload({ onMaterialUploaded, user }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processFile(files[0])
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }, [])

  const processFile = async (file: File) => {
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      let text = ""

      if (file.type === "text/plain") {
        text = await file.text()
      } else if (file.type === "application/pdf") {
        // Server-side PDF extraction
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "PDF extraction failed")
        }

        const result = await response.json()
        text = result.text

        // Vision fallback if text extraction yields little content (likely scanned PDF)
        if (text.length < MIN_TEXT_LENGTH) {
          toast({
            title: "Using AI vision extraction",
            description: "Detected scanned PDF, extracting text with AI...",
          })

          // For vision fallback, we need to render PDF pages to images client-side
          const images = await pdfToImages(file)
          const visionResponse = await fetch("/api/extract-text-vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images }),
          })

          if (!visionResponse.ok) {
            throw new Error("Vision extraction failed")
          }

          const visionResult = await visionResponse.json()
          text = visionResult.text
        }
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // Server-side DOCX extraction
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/extract-docx", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "DOCX extraction failed")
        }

        const result = await response.json()
        text = result.text
      }

      if (text.trim().length < 50) {
        toast({
          title: "File too short",
          description: "Please upload a file with more content to generate meaningful quizzes.",
          variant: "destructive",
        })
        return
      }

      if (user) {
        try {
          const response = await fetch("/api/study-materials", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              content: text,
              fileName: file.name,
              fileType: file.type,
              userId: user.id,
            }),
          })

          if (!response.ok) {
            console.error("Failed to save study material")
          }
        } catch (error) {
          console.error("Error saving study material:", error)
        }
      }

      onMaterialUploaded(text)
      toast({
        title: "File uploaded successfully",
        description: `Processed ${file.name} (${Math.round(file.size / 1024)}KB)`,
      })
    } catch (error) {
      console.error("File processing error:", error)
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "There was an error processing your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Client-side PDF to images conversion (for vision fallback only)
  const pdfToImages = async (file: File): Promise<string[]> => {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const images: string[] = []

    // Limit to first 10 pages to manage API costs
    const maxPages = Math.min(pdf.numPages, 10)

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })

      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: canvas.getContext("2d")!,
        viewport,
      } as Parameters<typeof page.render>[0]).promise

      images.push(canvas.toDataURL("image/jpeg", 0.8))
    }
    return images
  }

  const handleTextSubmit = async () => {
    if (textInput.trim().length < 50) {
      toast({
        title: "Text too short",
        description: "Please enter more content to generate meaningful quizzes.",
        variant: "destructive",
      })
      return
    }

    if (user) {
      try {
        const response = await fetch("/api/study-materials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Text Material",
            content: textInput.trim(),
            fileName: "text-input.txt",
            fileType: "text/plain",
            userId: user.id,
          }),
        })

        if (!response.ok) {
          console.error("Failed to save study material")
        }
      } catch (error) {
        console.error("Error saving study material:", error)
      }
    }

    onMaterialUploaded(textInput.trim())
    toast({
      title: "Text added successfully",
      description: `Added ${textInput.trim().length} characters of study material`,
    })
  }

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload File</TabsTrigger>
        <TabsTrigger value="paste">Paste Text</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="space-y-4">
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const fileInput = document.getElementById("file-input") as HTMLInputElement
            if (fileInput) {
              fileInput.click()
            }
          }}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center relative">
            {isProcessing ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg font-medium">Processing your file...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Drag and drop your file here</p>
                <p className="text-sm text-muted-foreground">or click anywhere in this area to browse</p>
                <p className="mt-2 text-xs text-muted-foreground">Supports PDF, DOCX, and TXT files (max 10MB)</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="paste" className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="text-input" className="text-sm font-medium">
            Paste your study material
          </label>
          <Textarea
            id="text-input"
            placeholder="Paste your notes, textbook content, or any study material here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[200px] resize-none"
          />
          <p className="text-xs text-muted-foreground">{textInput.length} characters (minimum 50 required)</p>
        </div>

        <Button onClick={handleTextSubmit} disabled={textInput.trim().length < 50} className="w-full">
          Continue with Text
        </Button>
      </TabsContent>
    </Tabs>
  )
}
