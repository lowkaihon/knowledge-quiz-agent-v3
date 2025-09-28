"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Settings, CheckCircle, Circle, Square } from "lucide-react"

interface QuizConfigurationProps {
  onConfigurationComplete: (config: {
    length: number
    difficulty: "easy" | "medium" | "hard"
    questionTypes: Array<"multiple-choice" | "true-false" | "short-answer">
  }) => void
  initialConfig: {
    length: number
    difficulty: "easy" | "medium" | "hard"
    questionTypes: Array<"multiple-choice" | "true-false" | "short-answer">
  }
}

export function QuizConfiguration({ onConfigurationComplete, initialConfig }: QuizConfigurationProps) {
  const [length, setLength] = useState(initialConfig.length)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initialConfig.difficulty)
  const [questionTypes, setQuestionTypes] = useState<Array<"multiple-choice" | "true-false" | "short-answer">>(
    initialConfig.questionTypes,
  )

  const handleQuestionTypeToggle = (type: "multiple-choice" | "true-false" | "short-answer") => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow removing the last question type
        if (prev.length === 1) return prev
        return prev.filter((t) => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  const handleSubmit = () => {
    onConfigurationComplete({
      length,
      difficulty,
      questionTypes,
    })
  }

  const questionTypeOptions = [
    {
      id: "multiple-choice",
      label: "Multiple Choice",
      description: "Questions with 4 answer options",
      icon: Circle,
    },
    {
      id: "true-false",
      label: "True/False",
      description: "Simple true or false questions",
      icon: CheckCircle,
    },
    {
      id: "short-answer",
      label: "Short Answer",
      description: "Fill-in-the-blank questions",
      icon: Square,
    },
  ] as const

  const difficultyDescriptions = {
    easy: "Basic concepts and straightforward questions",
    medium: "Moderate complexity with some analysis required",
    hard: "Advanced concepts requiring critical thinking",
  }

  return (
    <div className="space-y-6">
      {/* Quiz Length */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quiz Length
          </CardTitle>
          <CardDescription>How many questions would you like in your quiz?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Number of Questions</Label>
              <Badge variant="secondary">{length} questions</Badge>
            </div>
            <Slider
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 questions</span>
              <span>50 questions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Level */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Level</CardTitle>
          <CardDescription>Choose the complexity level for your quiz questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{difficultyDescriptions[difficulty]}</p>
        </CardContent>
      </Card>

      {/* Question Types */}
      <Card>
        <CardHeader>
          <CardTitle>Question Types</CardTitle>
          <CardDescription>Select the types of questions you want in your quiz (at least one required)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {questionTypeOptions.map((option) => {
              const isSelected = questionTypes.includes(option.id)
              const Icon = option.icon
              return (
                <div
                  key={option.id}
                  className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <Checkbox
                    id={option.id}
                    checked={isSelected}
                    onCheckedChange={() => handleQuestionTypeToggle(option.id)}
                    disabled={questionTypes.length === 1 && isSelected}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <Label htmlFor={option.id} className="font-medium">
                        {option.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Quiz Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Questions:</span>
            <Badge>{length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Difficulty:</span>
            <Badge variant="outline" className="capitalize">
              {difficulty}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Question Types:</span>
            <div className="flex gap-1">
              {questionTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.replace("-", " ")}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Quiz Button */}
      <Button onClick={handleSubmit} className="w-full" size="lg">
        Generate Quiz
      </Button>
    </div>
  )
}
