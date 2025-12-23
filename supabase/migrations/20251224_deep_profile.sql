-- Phase 15: Spiritual Profiling
-- Add columns to capture deep spiritual context

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS spiritual_goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS struggles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_ministers text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_bible_version text DEFAULT 'KJV',
ADD COLUMN IF NOT EXISTS denominational_bias text DEFAULT 'None';

-- Ensure RLS allows users to update their own profile (Policy likely exists, but good to verify assumption)
-- If not, we rely on the existing "Users can update own profile" policy.

-- Create documents table if not exists (Vector Integration)
-- This might have been created in 20251222_init_vector_lite.sql, but ensuring here.
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  embedding vector(768), -- Dimensions for Gemini Text-Embedding-004
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert/update documents (Ingestion Script)
CREATE POLICY "Service role can all documents"
ON public.documents
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy: Authenticated users can read documents (Rag Search)
CREATE POLICY "Authenticated users can read documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);
