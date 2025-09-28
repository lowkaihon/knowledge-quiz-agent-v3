"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle, Circle, Square, ArrowLeft, ArrowRight, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer"
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  topics: string[]
}

interface QuizInterfaceProps {
  studyMaterial: string
  config: {
    length: number
    difficulty: "easy" | "medium" | "hard"
    questionTypes: Array<"multiple-choice" | "true-false" | "short-answer">
    focusOnWeaknesses?: boolean
  }
  onQuizComplete: (data: {
    questions: Question[]
    userAnswers: Record<string, string>
    score: number
    totalQuestions: number
  }) => void
  user: User
  studyMaterialId?: string
}

export function QuizInterface({ studyMaterial, config, onQuizComplete, user, studyMaterialId }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(true)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [weaknesses, setWeaknesses] = useState<string[]>([])
  const { toast } = useToast()

  // Timer effect
  useEffect(() => {
    if (!startTime) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // Fetch user weaknesses
  useEffect(() => {
    if (config.focusOnWeaknesses) {
      fetchUserWeaknesses()
    }
  }, [config.focusOnWeaknesses])

  // Generate quiz on component mount
  useEffect(() => {
    generateQuiz()
  }, [])

  const fetchUserWeaknesses = async () => {
    try {
      const response = await fetch(`/api/user-weaknesses?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setWeaknesses(data.weaknesses.map((w: any) => w.topic))
      }
    } catch (error) {
      console.error("Error fetching weaknesses:", error)
    }
  }

  const generateQuiz = async () => {
    setIsLoading(true)
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyMaterial,
          config,
          userId: user.id,
          studyMaterialId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const data = await response.json()
      setQuestions(data.questions)
      setStartTime(new Date())

      const personalizedMessage =
        config.focusOnWeaknesses && weaknesses.length > 0
          ? `Personalized quiz created focusing on your weak areas: ${weaknesses.slice(0, 3).join(", ")}`
          : `Created ${data.questions.length} questions. Good luck!`

      toast({
        title: "Quiz generated successfully!",
        description: personalizedMessage,
      })
    } catch (error) {
      toast({
        title: "Error generating quiz",
        description: "There was an error creating your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitQuiz = () => {
    const score = questions.reduce((acc, question) => {
      const userAnswer = userAnswers[question.id]
      const isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
      return acc + (isCorrect ? 1 : 0)
    }, 0)

    onQuizComplete({
      questions,
      userAnswers,
      score,
      totalQuestions: questions.length,
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getQuestionIcon = (type: Question["type"]) => {
    switch (type) {
      case "multiple-choice":
        return Circle
      case "true-false":
        return CheckCircle
      case "short-answer":
        return Square
    }
  }

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="mt-4 text-lg font-semibold">
            {isGenerating ? "Generating your personalized quiz..." : "Loading quiz..."}
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            {isGenerating
              ? config.focusOnWeaknesses
                ? "Our AI is analyzing your performance history and creating questions focused on your weak areas"
                : "Our AI is analyzing your study material and creating personalized questions"
              : "Please wait while we prepare your quiz"}
          </p>
          {config.focusOnWeaknesses && weaknesses.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Focusing on: {weaknesses.slice(0, 3).join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold">No questions generated</h3>
          <p className="text-sm text-muted-foreground">Please try again with different settings.</p>
          <Button onClick={generateQuiz} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredQuestions = Object.keys(userAnswers).length
  const QuestionIcon = getQuestionIcon(currentQuestion.type)

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {answeredQuestions}/{questions.length} answered
              </Badge>
              <Badge className="capitalize">{config.difficulty}</Badge>
              {config.focusOnWeaknesses && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Personalized
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QuestionIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {currentQuestion.type.replace("-", " ")}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {currentQuestion.difficulty}
            </Badge>
          </div>
          <CardDescription className="text-base leading-relaxed">{currentQuestion.question}</CardDescription>
          {currentQuestion.topics && currentQuestion.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {currentQuestion.topics.map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === "true-false" && (
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer">
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer">
                  False
                </Label>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === "short-answer" && (
            <div className="space-y-2">
              <Label htmlFor="short-answer">Your answer:</Label>
              <Input
                id="short-answer"
                value={userAnswers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                index === currentQuestionIndex
                  ? "bg-primary text-primary-foreground"
                  : userAnswers[questions[index].id]
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={handleSubmitQuiz} className="flex items-center gap-2">
            Submit Quiz
            <CheckCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleNext} className="flex items-center gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
