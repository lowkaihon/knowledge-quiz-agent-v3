export interface User {
  id: string
  username: string
  created_at: string
  updated_at: string
}

export interface StudyMaterial {
  id: string
  user_id: string
  title: string
  original_content: string
  processed_content: any
  file_name?: string
  file_type?: string
  document_metadata: any
  semantic_tags: string[]
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  user_id: string
  study_material_id: string
  title: string
  questions: QuizQuestion[]
  configuration: QuizConfiguration
  created_at: string
}

export interface QuizQuestion {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer"
  question: string
  options?: string[]
  correct_answer: string
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  topics: string[]
}

export interface QuizConfiguration {
  length: number
  difficulty: "easy" | "medium" | "hard" | "mixed"
  question_types: string[]
  focus_on_weaknesses: boolean
}

export interface QuizResult {
  id: string
  user_id: string
  quiz_id: string
  study_material_id: string
  answers: any[]
  score: number
  total_questions: number
  time_taken?: number
  topic_performance: Record<string, { correct: number; total: number }>
  question_type_performance: Record<string, { correct: number; total: number }>
  difficulty_performance: Record<string, { correct: number; total: number }>
  completed_at: string
}

export interface PerformanceAnalytics {
  id: string
  user_id: string
  topic: string
  total_attempts: number
  correct_answers: number
  accuracy_percentage: number
  is_weakness: boolean
  last_updated: string
}
