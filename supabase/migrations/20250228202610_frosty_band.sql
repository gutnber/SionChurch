/*
  # Update events table and related functionality

  1. Schema Changes
    - Ensure `events` table exists with all required fields
    - Add missing fields if needed
  
  2. Security
    - Ensure RLS is enabled on `events` table
    - Add policies for viewing events based on visibility
    - Add policies for admins to manage events
*/

-- Check if events table exists and add missing columns if needed
DO $$ 
BEGIN
  -- First check if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    -- Table exists, check for missing columns and add them
    
    -- Check for 'time' column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'time') THEN
      ALTER TABLE events ADD COLUMN time text;
    END IF;
    
    -- Check for 'organizer' column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'organizer') THEN
      ALTER TABLE events ADD COLUMN organizer text;
    END IF;
    
  ELSE
    -- Table doesn't exist, create it
    CREATE TABLE events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      date date NOT NULL,
      time text,
      location text NOT NULL,
      image_url text,
      organizer text,
      visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'admin', 'pastor', 'leader', 'server', 'member')),
      created_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;

    -- Events Policies
    CREATE POLICY "Events are viewable based on visibility"
      ON events FOR SELECT
      USING (
        visibility = 'public' OR
        (visibility = 'member' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())) OR
        (visibility = 'server' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('server', 'leader', 'pastor', 'admin'))) OR
        (visibility = 'leader' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('leader', 'pastor', 'admin'))) OR
        (visibility = 'pastor' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))) OR
        (visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      );

    CREATE POLICY "Admins can create events"
      ON events FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Admins can update events"
      ON events FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Admins can delete events"
      ON events FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Add sample events if the table is empty
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM events LIMIT 1) THEN
    INSERT INTO events (title, description, date, time, location, organizer, visibility)
    VALUES 
      ('Summer Bible Camp', 'A week of fun activities and Bible learning for children ages 5-12. Join us for games, crafts, music, and daily Bible lessons that will help children grow in their faith.', '2025-07-15', '9:00 AM - 3:00 PM', 'Church Campus', 'Children''s Ministry Team', 'public'),
      ('Community Outreach Day', 'Join us as we serve our local community through various projects. We''ll be cleaning parks, visiting nursing homes, and helping at the local food bank. All ages welcome!', '2025-06-10', '10:00 AM - 2:00 PM', 'Meet at Church Parking Lot', 'Outreach Committee', 'public'),
      ('Worship Night', 'An evening of praise and worship with our worship team. Come experience God''s presence through music, prayer, and fellowship. This special service will focus on thanksgiving and renewal.', '2025-05-25', '7:00 PM - 9:00 PM', 'Main Sanctuary', 'Worship Ministry', 'public');
  END IF;
END $$;

-- Ensure RLS policies exist
DO $$
BEGIN
  -- Check if the policies exist and create them if they don't
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'events' AND policyname = 'Events are viewable based on visibility') THEN
    CREATE POLICY "Events are viewable based on visibility"
      ON events FOR SELECT
      USING (
        visibility = 'public' OR
        (visibility = 'member' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())) OR
        (visibility = 'server' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('server', 'leader', 'pastor', 'admin'))) OR
        (visibility = 'leader' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('leader', 'pastor', 'admin'))) OR
        (visibility = 'pastor' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))) OR
        (visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can create events') THEN
    CREATE POLICY "Admins can create events"
      ON events FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can update events') THEN
    CREATE POLICY "Admins can update events"
      ON events FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can delete events') THEN
    CREATE POLICY "Admins can delete events"
      ON events FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;