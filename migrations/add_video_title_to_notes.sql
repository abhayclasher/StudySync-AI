-- Migration: Add video_title column to video_notes table
-- Run this in your Supabase SQL Editor

ALTER TABLE video_notes 
ADD COLUMN IF NOT EXISTS video_title TEXT;

-- Add comment to document the column
COMMENT ON COLUMN video_notes.video_title IS 'Title of the video associated with this note';

-- Optional: Create an index if you plan to search/filter by video title
CREATE INDEX IF NOT EXISTS idx_video_notes_title ON video_notes(video_title);
