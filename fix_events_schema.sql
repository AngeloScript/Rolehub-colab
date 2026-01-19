-- Fix events table schema to match TypeScript types
-- Add date_time column if it doesn't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS date_time timestamptz;
-- Update date_time from date and time columns if they exist and date_time is null
-- Assuming date is YYYY-MM-DD and time is HH:MM
UPDATE events
SET date_time = (date || ' ' || time)::timestamptz
WHERE date_time IS NULL
    AND date IS NOT NULL
    AND time IS NOT NULL;