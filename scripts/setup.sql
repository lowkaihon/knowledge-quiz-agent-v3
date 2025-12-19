-- Knowledge Quiz Agent - Database Setup
-- Run this script once to initialize the database schema

-- ============================================
-- TABLES
-- ============================================

-- Users table for username-only authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study materials table to store uploaded content
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_content TEXT NOT NULL,
  processed_content JSONB NOT NULL,
  file_name TEXT,
  file_type TEXT,
  document_metadata JSONB DEFAULT '{}',
  semantic_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table to store generated quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  configuration JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz results table to store quiz attempts
-- Note: quiz_id and study_material_id are nullable for ad-hoc quizzes
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  study_material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER,
  topic_performance JSONB DEFAULT '{}',
  question_type_performance JSONB DEFAULT '{}',
  difficulty_performance JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT quiz_results_has_identifier
    CHECK (quiz_id IS NOT NULL OR study_material_id IS NOT NULL OR jsonb_array_length(answers) > 0)
);

-- Performance analytics table for aggregated user performance data
CREATE TABLE IF NOT EXISTS public.performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_weakness BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_analytics ENABLE ROW LEVEL SECURITY;

-- Permissive policies for custom username-based auth
-- (Application handles user isolation via user_id in queries)

CREATE POLICY "users_public_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_public_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_public_update" ON public.users FOR UPDATE USING (true);

CREATE POLICY "study_materials_user_access" ON public.study_materials
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "quizzes_user_access" ON public.quizzes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "quiz_results_user_access" ON public.quiz_results
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "performance_analytics_user_access" ON public.performance_analytics
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================

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
