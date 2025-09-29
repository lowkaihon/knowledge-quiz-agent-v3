"use client"

import { useState, useEffect } from "react"
import { AuthWrapper } from "@/components/auth-wrapper"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserIcon,
  Target,
  BookOpen,
  Clock,
  Trophy,
  BarChart3,
  FileText,
  Brain,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import type { User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface PerformanceAnalytics {
  id: string
  topic: string
  total_attempts: number
  correct_answers: number
  accuracy_percentage: number
  is_weakness: boolean
  last_updated: string
}

interface QuizResult {
  id: string
  score: number
  total_questions: number
  completed_at: string
  time_taken: number
  answers: any[]
  topic_performance: Record<string, { correct: number; total: number }>
  quizzes?: { title: string }
  study_materials?: { title: string }
}

interface StudyMaterial {
  id: string
  title: string
  file_name: string
  semantic_tags: string[]
  document_metadata: {
    main_topics: string[]
    difficulty_level: string
    content_type: string
  }
  created_at: string
}

function ProfileContent({ user }: { user: User }) {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      // Fetch performance analytics
      const analyticsResponse = await fetch(`/api/performance-analytics?userId=${user.id}`)
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData.analytics)
        setSummary(analyticsData.summary)
      }

      // Fetch quiz results
      const resultsResponse = await fetch(`/api/quiz-results?userId=${user.id}&limit=20`)
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setQuizResults(resultsData.results)
      }

      // Fetch study materials
      const materialsResponse = await fetch(`/api/study-materials?userId=${user.id}`)
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json()
        setStudyMaterials(materialsData.materials)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error loading profile",
        description: "Some data couldn't be loaded. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getQuizName = (result: QuizResult) => {
    if (result.quizzes?.title) return result.quizzes.title
    if (result.study_materials?.title) return `${result.study_materials.title} Quiz`

    // Generate name based on topics covered
    if (result.topic_performance && Object.keys(result.topic_performance).length > 0) {
      const topics = Object.keys(result.topic_performance)
      if (topics.length === 1) {
        return `${topics[0]} Quiz`
      } else if (topics.length <= 3) {
        return `${topics.join(", ")} Quiz`
      } else {
        return `${topics.slice(0, 2).join(", ")} + ${topics.length - 2} more topics`
      }
    }

    return `Mixed Topics Quiz`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{user.username}</h1>
              <p className="text-muted-foreground">Personal Knowledge Quiz Profile</p>
            </div>
          </div>

          {/* Quick Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">{Math.round(summary.overallAccuracy)}%</p>
                      <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{summary.totalAttempts}</p>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{summary.totalTopics}</p>
                      <p className="text-sm text-muted-foreground">Topics Studied</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{studyMaterials.length}</p>
                      <p className="text-sm text-muted-foreground">Study Materials</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">Quiz History</TabsTrigger>
            <TabsTrigger value="materials">Study Materials</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {summary && (
              <>
                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Weaknesses */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Areas for Improvement
                      </CardTitle>
                      <CardDescription>Topics where you need more practice (accuracy &lt; 60%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {summary.weaknesses.length > 0 ? (
                        <div className="space-y-3">
                          {summary.weaknesses.slice(0, 5).map((weakness: PerformanceAnalytics) => (
                            <div key={weakness.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{weakness.topic}</p>
                                <p className="text-sm text-muted-foreground">
                                  {weakness.correct_answers}/{weakness.total_attempts} correct
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="destructive">{Math.round(weakness.accuracy_percentage)}%</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No weak areas identified yet. Keep taking quizzes!
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Your Strengths
                      </CardTitle>
                      <CardDescription>Topics where you excel (accuracy ≥ 80%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {summary.strengths.length > 0 ? (
                        <div className="space-y-3">
                          {summary.strengths.slice(0, 5).map((strength: PerformanceAnalytics) => (
                            <div key={strength.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{strength.topic}</p>
                                <p className="text-sm text-muted-foreground">
                                  {strength.correct_answers}/{strength.total_attempts} correct
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="default">{Math.round(strength.accuracy_percentage)}%</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No strong areas identified yet. Keep taking quizzes!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* All Topics Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Topic Performance Overview
                    </CardTitle>
                    <CardDescription>Your performance across all studied topics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.map((topic) => (
                          <div key={topic.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{topic.topic}</span>
                                {(topic.is_weakness || topic.accuracy_percentage < 60) && (
                                  <Badge variant="destructive" className="text-xs">
                                    Needs Work
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {topic.correct_answers}/{topic.total_attempts}
                                </span>
                                <Badge variant="outline">{Math.round(topic.accuracy_percentage)}%</Badge>
                              </div>
                            </div>
                            <Progress value={topic.accuracy_percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No performance data yet. Take your first quiz to see analytics!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Quiz History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Quiz Results
                </CardTitle>
                <CardDescription>Your quiz performance history</CardDescription>
              </CardHeader>
              <CardContent>
                {quizResults.length > 0 ? (
                  <div className="space-y-4">
                    {quizResults.map((result) => {
                      const percentage = Math.round((result.score / result.total_questions) * 100)
                      const isExpanded = expandedQuiz === result.id

                      return (
                        <div key={result.id} className="border rounded-lg">
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedQuiz(isExpanded ? null : result.id)}
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{getQuizName(result)}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(result.completed_at)}
                                {result.time_taken && ` • ${formatTime(result.time_taken)}`}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge
                                variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}
                              >
                                {result.score}/{result.total_questions} ({percentage}%)
                              </Badge>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t p-4 bg-muted/20">
                              <div className="space-y-4">
                                {/* Topic Performance */}
                                {result.topic_performance && Object.keys(result.topic_performance).length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Topic Performance</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {Object.entries(result.topic_performance).map(([topic, perf]) => {
                                        const topicPercentage = Math.round((perf.correct / perf.total) * 100)
                                        return (
                                          <div
                                            key={topic}
                                            className="flex items-center justify-between p-2 rounded bg-background"
                                          >
                                            <span className="text-sm">{topic}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {perf.correct}/{perf.total} ({topicPercentage}%)
                                            </Badge>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Individual Questions */}
                                {result.answers && result.answers.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Question Details</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {result.answers.map((answer: any, index: number) => (
                                        <div
                                          key={index}
                                          className={`p-3 rounded border ${answer.is_correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                                        >
                                          <p className="text-sm font-medium mb-1">{answer.question}</p>
                                          <div className="text-xs space-y-1">
                                            <p>
                                              <span className="font-medium">Your answer:</span>{" "}
                                              {answer.user_answer || "No answer"}
                                            </p>
                                            <p>
                                              <span className="font-medium">Correct answer:</span>{" "}
                                              {answer.correct_answer}
                                            </p>
                                            {answer.topics && answer.topics.length > 0 && (
                                              <p>
                                                <span className="font-medium">Topics:</span> {answer.topics.join(", ")}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No quiz history yet. Take your first quiz to see results here!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Study Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Study Materials
                </CardTitle>
                <CardDescription>Materials you've uploaded for quiz generation</CardDescription>
              </CardHeader>
              <CardContent>
                {studyMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studyMaterials.map((material) => (
                      <Card key={material.id} className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{material.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {material.file_name} • {formatDate(material.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {material.document_metadata && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {material.document_metadata.content_type}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {material.document_metadata.difficulty_level}
                                </Badge>
                              </div>
                            )}
                            {material.semantic_tags && material.semantic_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {material.semantic_tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {material.semantic_tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{material.semantic_tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No study materials uploaded yet. Upload your first material to get started!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Insights
                </CardTitle>
                <CardDescription>Personalized recommendations based on your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary && summary.weaknesses.length > 0 && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Focus Areas</h4>
                      <p className="text-sm text-red-800">
                        You have {summary.weaknesses.length} topic(s) that need attention. Consider creating focused
                        quizzes on:{" "}
                        {summary.weaknesses
                          .slice(0, 3)
                          .map((w: any) => w.topic)
                          .join(", ")}
                        .
                      </p>
                    </div>
                  )}

                  {summary && summary.strengths.length > 0 && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Your Strengths</h4>
                      <p className="text-sm text-green-800">
                        You excel in {summary.strengths.length} topic(s). Great work on:{" "}
                        {summary.strengths
                          .slice(0, 3)
                          .map((s: any) => s.topic)
                          .join(", ")}
                        .
                      </p>
                    </div>
                  )}

                  {quizResults.length > 0 && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Study Habits</h4>
                      <p className="text-sm text-blue-800">
                        You've completed {quizResults.length} quiz(es) with an average score of{" "}
                        {Math.round(
                          quizResults.reduce((sum, r) => sum + (r.score / r.total_questions) * 100, 0) /
                            quizResults.length,
                        )}
                        %.
                        {quizResults.length < 5 && " Take more quizzes to get better insights!"}
                      </p>
                    </div>
                  )}

                  {(!summary || (summary.weaknesses.length === 0 && summary.strengths.length === 0)) && (
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Get Started</h4>
                      <p className="text-sm text-gray-800">
                        Upload study materials and take quizzes to unlock personalized insights and recommendations!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return <AuthWrapper>{(user) => <ProfileContent user={user} />}</AuthWrapper>
}
