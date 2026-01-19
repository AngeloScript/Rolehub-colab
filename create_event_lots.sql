-- Create event_lots table
CREATE TABLE IF NOT EXISTS event_lots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE event_lots ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public read access for event_lots" ON event_lots FOR
SELECT USING (true);
CREATE POLICY "Organizers can insert lots for their events" ON event_lots FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM events
            WHERE events.id = event_lots.event_id
                AND events.organizer_id = auth.uid()
        )
    );
CREATE POLICY "Organizers can update own lots" ON event_lots FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM events
            WHERE events.id = event_lots.event_id
                AND events.organizer_id = auth.uid()
        )
    );
CREATE POLICY "Organizers can delete own lots" ON event_lots FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM events
        WHERE events.id = event_lots.event_id
            AND events.organizer_id = auth.uid()
    )
);