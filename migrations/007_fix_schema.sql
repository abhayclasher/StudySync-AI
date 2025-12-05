-- Fix schema for custom_notes and quiz_history

-- Add missing columns to custom_notes
ALTER TABLE custom_notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE custom_notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE custom_notes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add missing columns to quiz_history
ALTER TABLE quiz_history ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing quiz_history rows to have completed_at = created_at if null
UPDATE quiz_history SET completed_at = created_at WHERE completed_at IS NULL;
