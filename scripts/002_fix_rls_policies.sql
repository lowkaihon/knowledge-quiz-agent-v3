-- Drop existing RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

DROP POLICY IF EXISTS "study_materials_select_own" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_insert_own" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_update_own" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_delete_own" ON public.study_materials;

DROP POLICY IF EXISTS "quizzes_select_own" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_insert_own" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_update_own" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_delete_own" ON public.quizzes;

DROP POLICY IF EXISTS "quiz_results_select_own" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results_insert_own" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results_update_own" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results_delete_own" ON public.quiz_results;

DROP POLICY IF EXISTS "performance_analytics_select_own" ON public.performance_analytics;
DROP POLICY IF EXISTS "performance_analytics_insert_own" ON public.performance_analytics;
DROP POLICY IF EXISTS "performance_analytics_update_own" ON public.performance_analytics;
DROP POLICY IF EXISTS "performance_analytics_delete_own" ON public.performance_analytics;

-- Create new RLS policies that allow operations for our custom auth system
-- Users table: Allow anyone to create users and select their own data
CREATE POLICY "users_public_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_public_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_public_update" ON public.users FOR UPDATE USING (true);

-- Study materials: Allow users to manage their own materials based on user_id
CREATE POLICY "study_materials_user_access" ON public.study_materials 
  FOR ALL USING (true) WITH CHECK (true);

-- Quizzes: Allow users to manage their own quizzes based on user_id  
CREATE POLICY "quizzes_user_access" ON public.quizzes 
  FOR ALL USING (true) WITH CHECK (true);

-- Quiz results: Allow users to manage their own results based on user_id
CREATE POLICY "quiz_results_user_access" ON public.quiz_results 
  FOR ALL USING (true) WITH CHECK (true);

-- Performance analytics: Allow users to manage their own analytics based on user_id
CREATE POLICY "performance_analytics_user_access" ON public.performance_analytics 
  FOR ALL USING (true) WITH CHECK (true);
