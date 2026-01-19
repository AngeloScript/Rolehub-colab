-- Add date_time column if it doesn't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS date_time timestamptz;
-- Update date_time from date column
-- We assume date column exists and contains an ISO string or timestamp
-- We'll try to cast it. If date is just YYYY-MM-DD, it will default to midnight UTC.
UPDATE events
SET date_time = CASE
        WHEN date_time IS NULL
        AND date IS NOT NULL THEN date::timestamptz
        ELSE date_time
    END;