-- Add status column to attendees table
ALTER TABLE attendees
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'confirmed';
-- Update existing records to confirmed
UPDATE attendees
SET status = 'confirmed'
WHERE status IS NULL;