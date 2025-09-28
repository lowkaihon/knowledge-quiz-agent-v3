"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
      } else {
        // For PDF and DOCX files, we'll simulate text extraction
        // In a real app, you'd use libraries like pdf-parse or mammoth
        text = `[Extracted text from ${file.name}]\n\nThis is simulated extracted text from your uploaded file. In a real implementation, this would contain the actual content from your PDF or DOCX file.`
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
      toast({
        title: "Error processing file",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
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
