-- Migration 005: Custom Notes System
-- Description: Add custom notes table for user-created notes

-- Create custom_notes table
CREATE TABLE IF NOT EXISTS custom_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE custom_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own custom notes" 
  ON custom_notes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom notes" 
  ON custom_notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom notes" 
  ON custom_notes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom notes" 
  ON custom_notes FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for updated_at (reusing video_notes function)
-- Note: Ensure update_video_notes_updated_at function exists (from Migration 004)
CREATE TRIGGER custom_notes_updated_at
  BEFORE UPDATE ON custom_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_video_notes_updated_at();

-- Migration 006: Generated Content System
-- Description: Add table for AI-generated content (flashcards, notes)

-- Create generated_content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('flashcard', 'note')) NOT NULL,
  source TEXT CHECK (source IN ('quiz', 'video')) NOT NULL,
  source_title TEXT,
  content TEXT NOT NULL, -- Main content or summary
  metadata JSONB DEFAULT '{}'::jsonb, -- Store front/back for flashcards, or extra details
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own generated content" 
  ON generated_content FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated content" 
  ON generated_content FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generated content" 
  ON generated_content FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated content" 
  ON generated_content FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_video_notes_updated_at();
