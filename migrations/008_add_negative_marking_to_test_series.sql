-- Migration 008: Add negative marking column to test_series
-- Description: Add negative_marking column to support negative marking feature

ALTER TABLE test_series 
ADD COLUMN negative_marking BOOLEAN DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN test_series.negative_marking IS 'Whether the test series uses negative marking for wrong answers';