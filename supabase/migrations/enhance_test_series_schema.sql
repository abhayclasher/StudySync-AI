-- Enhanced Test Series Schema Migration
-- Adds support for competitive exam patterns, sections, visual content, and advanced marking schemes

-- Add sections support for exam-wise organization (Physics, Chemistry, Biology for NEET)
ALTER TABLE test_series 
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

-- Add visual content flag to track questions with graphs/diagrams
ALTER TABLE test_series 
ADD COLUMN IF NOT EXISTS has_figures BOOLEAN DEFAULT false;

-- Add marking scheme for detailed scoring rules
ALTER TABLE test_series 
ADD COLUMN IF NOT EXISTS marking_scheme JSONB DEFAULT '{"correct": 4, "incorrect": -1, "unattempted": 0}'::jsonb;

-- Add exam pattern identifier (JEE, NEET, UPSC, etc.)
ALTER TABLE test_series 
ADD COLUMN IF NOT EXISTS exam_pattern VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN test_series.sections IS 'Array of section objects: [{name, questionCount, timeLimit, questions}]';
COMMENT ON COLUMN test_series.has_figures IS 'Whether test contains questions with graphs, diagrams, or visual content';
COMMENT ON COLUMN test_series.marking_scheme IS 'Scoring rules: {correct: number, incorrect: number, unattempted: number}';
COMMENT ON COLUMN test_series.exam_pattern IS 'Exam type identifier: JEE, NEET, UPSC, SSC, CAT, GATE, Custom';

-- Add section-wise performance tracking to test attempts
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS section_wise_performance JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN test_attempts.section_wise_performance IS 'Array of section performance: [{section, score, timeTaken, accuracy, attempted}]';

-- Create index for faster exam pattern queries
CREATE INDEX IF NOT EXISTS idx_test_series_exam_pattern ON test_series(exam_pattern);

-- Create index for figure-based questions
CREATE INDEX IF NOT EXISTS idx_test_series_has_figures ON test_series(has_figures) WHERE has_figures = true;
