-- Create users table for username-only authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_materials table to store uploaded content
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_content TEXT NOT NULL, -- Original uploaded text/file content
  processed_content JSONB NOT NULL, -- Processed chunks with metadata
  file_name TEXT,
  file_type TEXT,
  document_metadata JSONB DEFAULT '{}', -- File-level metadata (headers, etc.)
  semantic_tags TEXT[] DEFAULT '{}', -- LLM-extracted semantic tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table to store generated quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL, -- Array of question objects
  configuration JSONB NOT NULL, -- Quiz settings (length, difficulty, types)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_results table to store quiz attempts and results
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- User's answers with question metadata
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER, -- Time in seconds
  topic_performance JSONB DEFAULT '{}', -- Performance by topic/tag
  question_type_performance JSONB DEFAULT '{}', -- Performance by question type
  difficulty_performance JSONB DEFAULT '{}', -- Performance by difficulty
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_analytics table for aggregated user performance data
CREATE TABLE IF NOT EXISTS public.performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL, -- Topic/semantic tag
  total_attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_weakness BOOLEAN DEFAULT FALSE, -- True if accuracy < 60% and attempts >= 10
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- Create RLS policies for study_materials table
CREATE POLICY "study_materials_select_own" ON public.study_materials FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "study_materials_insert_own" ON public.study_materials FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_materials_update_own" ON public.study_materials FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "study_materials_delete_own" ON public.study_materials FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for quizzes table
CREATE POLICY "quizzes_select_own" ON public.quizzes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "quizzes_insert_own" ON public.quizzes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "quizzes_update_own" ON public.quizzes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "quizzes_delete_own" ON public.quizzes FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for quiz_results table
CREATE POLICY "quiz_results_select_own" ON public.quiz_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "quiz_results_insert_own" ON public.quiz_results FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "quiz_results_update_own" ON public.quiz_results FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "quiz_results_delete_own" ON public.quiz_results FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for performance_analytics table
CREATE POLICY "performance_analytics_select_own" ON public.performance_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "performance_analytics_insert_own" ON public.performance_analytics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "performance_analytics_update_own" ON public.performance_analytics FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "performance_analytics_delete_own" ON public.performance_analytics FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_semantic_tags ON public.study_materials USING GIN(semantic_tags);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_study_material_id ON public.quizzes(study_material_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON public.quiz_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_user_id ON public.performance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_topic ON public.performance_analytics(topic);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_is_weakness ON public.performance_analytics(is_weakness);
