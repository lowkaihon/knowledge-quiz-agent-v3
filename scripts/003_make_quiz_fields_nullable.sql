-- Make quiz_id and study_material_id nullable for ad-hoc quizzes
-- This allows saving quiz results even when no formal quiz/study material record exists

ALTER TABLE public.quiz_results 
ALTER COLUMN quiz_id DROP NOT NULL,
ALTER COLUMN study_material_id DROP NOT NULL;

-- Update the foreign key constraints to handle nulls properly
-- Drop existing constraints
ALTER TABLE public.quiz_results DROP CONSTRAINT IF EXISTS quiz_results_quiz_id_fkey;
ALTER TABLE public.quiz_results DROP CONSTRAINT IF EXISTS quiz_results_study_material_id_fkey;

-- Add new constraints that allow nulls
ALTER TABLE public.quiz_results 
ADD CONSTRAINT quiz_results_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_results 
ADD CONSTRAINT quiz_results_study_material_id_fkey 
FOREIGN KEY (study_material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE;

-- Add a check constraint to ensure at least some identifying information exists
ALTER TABLE public.quiz_results 
ADD CONSTRAINT quiz_results_has_identifier 
CHECK (quiz_id IS NOT NULL OR study_material_id IS NOT NULL OR jsonb_array_length(answers) > 0);
