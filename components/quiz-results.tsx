"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  Share2,
  TrendingUp,
  Database,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer"
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty?: "easy" | "medium" | "hard"
  topics?: string[]
}

interface QuizResultsProps {
  quizData: {
    questions: Question[]
    userAnswers: Record<string, string>
    score: number
    totalQuestions: number
    timeTaken?: number
  }
  onRestart: () => void
  user: User
  quizId?: string
  studyMaterialId?: string
}

export function QuizResults({ quizData, onRestart, user, quizId, studyMaterialId }: QuizResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [showAllExplanations, setShowAllExplanations] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedToDatabase, setSavedToDatabase] = useState(false)
  const { toast } = useToast()

  const { questions, userAnswers, score, totalQuestions, timeTaken } = quizData
  const percentage = Math.round((score / totalQuestions) * 100)

  // Save results to database
  useEffect(() => {
    saveResultsToDatabase()
  }, [])

  const saveResultsToDatabase = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/quiz-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          quizId,
          studyMaterialId,
          questions,
          userAnswers,
          score,
          totalQuestions,
          timeTaken,
        }),
      })

      if (response.ok) {
        setSavedToDatabase(true)
        toast({
          title: "Results saved!",
          description: "Your quiz results and performance analytics have been updated.",
        })
      } else {
        throw new Error("Failed to save results")
      }
    } catch (error) {
      console.error("Error saving results:", error)
      toast({
        title: "Error saving results",
        description: "Your results couldn't be saved to your profile. You can still view them here.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const toggleAllExplanations = () => {
    if (showAllExplanations) {
      setExpandedQuestions(new Set())
    } else {
      setExpandedQuestions(new Set(questions.map((q) => q.id)))
    }
    setShowAllExplanations(!showAllExplanations)
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 70) return "text-blue-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Excellent work! You've mastered this material."
    if (percentage >= 70) return "Great job! You have a solid understanding."
    if (percentage >= 50) return "Good effort! Review the explanations to improve."
    return "Keep studying! Focus on the areas you missed."
  }

  const getGradeLevel = (percentage: number) => {
    if (percentage >= 97) return "A+"
    if (percentage >= 93) return "A"
    if (percentage >= 90) return "A-"
    if (percentage >= 87) return "B+"
    if (percentage >= 83) return "B"
    if (percentage >= 80) return "B-"
    if (percentage >= 77) return "C+"
    if (percentage >= 73) return "C"
    if (percentage >= 70) return "C-"
    if (percentage >= 67) return "D+"
    if (percentage >= 65) return "D"
    return "F"
  }

  const handleShare = async () => {
    console.log("[v0] Share button clicked")
    const shareText = `I just scored ${score}/${totalQuestions} (${percentage}%) on my Personal Knowledge Quiz! 🎯`
    console.log("[v0] Share text:", shareText)

    if (navigator.share) {
      console.log("[v0] Using Web Share API")
      try {
        await navigator.share({
          title: "Quiz Results",
          text: shareText,
        })
        console.log("[v0] Web Share API successful")
      } catch (error) {
        console.log("[v0] Web Share API failed, falling back to clipboard:", error)
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(shareText)
          toast({
            title: "Copied to clipboard",
            description: "Share text copied to your clipboard!",
          })
          console.log("[v0] Clipboard fallback successful")
        } catch (clipboardError) {
          console.log("[v0] Clipboard fallback failed:", clipboardError)
          toast({
            title: "Share failed",
            description: "Unable to share or copy to clipboard. Please try again.",
            variant: "destructive",
          })
        }
      }
    } else {
      console.log("[v0] Web Share API not available, using clipboard")
      try {
        await navigator.clipboard.writeText(shareText)
        toast({
          title: "Copied to clipboard",
          description: "Share text copied to your clipboard!",
        })
        console.log("[v0] Clipboard successful")
      } catch (error) {
        console.log("[v0] Clipboard failed:", error)
        toast({
          title: "Share failed",
          description: "Unable to copy to clipboard. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownload = () => {
    const resultsText = `
Personal Knowledge Quiz Results
==============================

User: ${user.username}
Score: ${score}/${totalQuestions} (${percentage}%)
Grade: ${getGradeLevel(percentage)}
Completed: ${new Date().toLocaleString()}
${timeTaken ? `Time Taken: ${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, "0")}` : ""}

Questions and Answers:
${questions
  .map((question, index) => {
    const userAnswer = userAnswers[question.id] || "No answer"
    const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()

    return `
${index + 1}. ${question.question}
Type: ${question.type}
Difficulty: ${question.difficulty || "medium"}
Topics: ${question.topics?.join(", ") || "None"}
Your Answer: ${userAnswer} ${isCorrect ? "✓" : "✗"}
Correct Answer: ${question.correctAnswer}
Explanation: ${question.explanation}
`
  })
  .join("\n")}`

    const blob = new Blob([resultsText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quiz-results-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Results downloaded",
      description: "Your quiz results have been saved as a text file.",
    })
  }

  const handleViewAnalytics = () => {
    // Navigate to profile page with analytics tab
    window.location.href = "/profile"
  }

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          <CardDescription className="text-lg">{getScoreMessage(percentage)}</CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isSaving ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Saving to profile...
              </Badge>
            ) : savedToDatabase ? (
              <Badge variant="default" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Saved to profile
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Not saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
            <div className="text-2xl font-semibold text-muted-foreground">
              {score} out of {totalQuestions} correct
            </div>
            <Badge variant="outline" className="mt-2 text-lg px-4 py-1">
              Grade: {getGradeLevel(percentage)}
            </Badge>
            {timeTaken && (
              <div className="mt-2 text-sm text-muted-foreground">
                Completed in {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, "0")}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {score}/{totalQuestions}
              </span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">{score}</span>
              </div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="font-semibold">{totalQuestions - score}</span>
              </div>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-blue-600">
                <Target className="h-4 w-4" />
                <span className="font-semibold">{percentage}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={onRestart} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Take Another Quiz
        </Button>
        <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
          <Share2 className="h-4 w-4" />
          Share Results
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Download Results
        </Button>
        {savedToDatabase && (
          <Button variant="outline" onClick={handleViewAnalytics} className="flex items-center gap-2 bg-transparent">
            <TrendingUp className="h-4 w-4" />
            View Analytics
          </Button>
        )}
      </div>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question Review</CardTitle>
            <Button variant="outline" onClick={toggleAllExplanations} className="bg-transparent">
              {showAllExplanations ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All
                </>
              )}
            </Button>
          </div>
          <CardDescription>Review your answers and learn from detailed explanations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[question.id] || "No answer provided"
            const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
            const isExpanded = expandedQuestions.has(question.id)

            return (
              <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleQuestion(question.id)}>
                <Card className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              Question {index + 1}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.type.replace("-", " ")}
                            </Badge>
                            {question.difficulty && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {question.difficulty}
                              </Badge>
                            )}
                            {isCorrect ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <CardTitle className="text-base leading-relaxed">{question.question}</CardTitle>
                          {question.topics && question.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {question.topics.map((topic, topicIndex) => (
                                <Badge key={topicIndex} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Your Answer:</span>
                          <span className={`text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                            {userAnswer}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                            Correct Answer:
                          </span>
                          <span className="text-sm text-green-600 font-medium">{question.correctAnswer}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Explanation:</span>
                          <span className="text-sm text-foreground leading-relaxed">{question.explanation}</span>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
