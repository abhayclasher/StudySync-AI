-- Add negative_marking column to test_series table
ALTER TABLE test_series 
ADD COLUMN IF NOT EXISTS negative_marking BOOLEAN DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN test_series.negative_marking IS 'Whether negative marking is enabled for this test series';
