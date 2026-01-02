-- Add status column to direct_messages table if it's missing
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS status text CHECK (
        status IN ('sent', 'delivered', 'read', 'sending')
    ) DEFAULT 'sent';
-- Update existing messages to have a status
UPDATE direct_messages
SET status = 'read'
WHERE status IS NULL;