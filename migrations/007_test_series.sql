-- Migration 007: AI Test Series System
-- Description: Add tables for AI-generated test series with question bank and attempt tracking

-- Test Series Table (stores generated test configurations)
CREATE TABLE IF NOT EXISTS test_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  exam_type TEXT, -- e.g., 'NEET Biology', 'JEE Physics', 'General'
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  time_limit INTEGER, -- in minutes
  questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of question objects
  reference_papers TEXT, -- Optional: user-provided previous papers for context
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Test Attempts Table (tracks user attempts on test series)
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_series_id UUID REFERENCES test_series(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  time_taken INTEGER, -- in seconds
  answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- User's answers with correctness
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_series_user ON test_series(user_id);
CREATE INDEX IF NOT EXISTS idx_test_series_topic ON test_series(topic);
CREATE INDEX IF NOT EXISTS idx_test_series_difficulty ON test_series(difficulty);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON test_attempts(test_series_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_date ON test_attempts(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_series
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own test series" ON test_series;
  DROP POLICY IF EXISTS "Users can insert own test series" ON test_series;
  DROP POLICY IF EXISTS "Users can update own test series" ON test_series;
  DROP POLICY IF EXISTS "Users can delete own test series" ON test_series;

  -- Create new policies
  CREATE POLICY "Users can view own test series" 
    ON test_series FOR SELECT 
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own test series" 
    ON test_series FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own test series" 
    ON test_series FOR UPDATE 
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own test series" 
    ON test_series FOR DELETE 
    USING (auth.uid() = user_id);
END $$;

-- RLS Policies for test_attempts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own test attempts" ON test_attempts;
  DROP POLICY IF EXISTS "Users can insert own test attempts" ON test_attempts;

  CREATE POLICY "Users can view own test attempts" 
    ON test_attempts FOR SELECT 
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own test attempts" 
    ON test_attempts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Auto-update timestamp trigger
CREATE TRIGGER test_series_updated_at
  BEFORE UPDATE ON test_series
  FOR EACH ROW
  EXECUTE FUNCTION update_video_notes_updated_at();

-- Analytics View
CREATE OR REPLACE VIEW test_series_analytics AS
SELECT 
  ts.user_id,
  ts.topic,
  ts.difficulty,
  COUNT(DISTINCT ts.id) as total_tests_generated,
  COUNT(ta.id) as total_attempts,
  ROUND(AVG(ta.score::numeric / ta.total_questions * 100), 2) as avg_score_percentage,
  MAX(ta.score::numeric / ta.total_questions * 100) as best_score_percentage,
  ROUND(AVG(ta.time_taken)::numeric / 60, 1) as avg_time_minutes
FROM test_series ts
LEFT JOIN test_attempts ta ON ts.id = ta.test_series_id
GROUP BY ts.user_id, ts.topic, ts.difficulty;
