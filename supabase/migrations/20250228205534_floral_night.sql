/*
  # Update activities table with new fields

  1. Changes
    - Add 'leader' column to activities table
    - Add 'category' column to activities table
  
  2. Security
    - Ensure RLS policies are in place
*/

-- Check if activities table exists and add missing columns if needed
DO $$ 
BEGIN
  -- First check if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
    -- Table exists, check for missing columns and add them
    
    -- Check for 'leader' column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'leader') THEN
      ALTER TABLE activities ADD COLUMN leader text;
    END IF;
    
    -- Check for 'category' column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'category') THEN
      ALTER TABLE activities ADD COLUMN category text;
    END IF;
    
  ELSE
    -- Table doesn't exist, create it
    CREATE TABLE activities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      day_of_week text NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      title text NOT NULL,
      description text NOT NULL,
      time text NOT NULL,
      location text NOT NULL,
      leader text,
      category text,
      created_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

    -- Activities Policies
    CREATE POLICY "Activities are viewable by everyone"
      ON activities FOR SELECT
      USING (true);

    CREATE POLICY "Admins can create activities"
      ON activities FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Admins can update activities"
      ON activities FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Admins can delete activities"
      ON activities FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Update existing activities with categories if they don't have them
UPDATE activities 
SET category = 'All' 
WHERE category IS NULL;

-- Add sample activities if the table is empty
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM activities LIMIT 1) THEN
    INSERT INTO activities (day_of_week, title, description, time, location, leader, category)
    VALUES 
      ('Sunday', 'Morning Worship Service', 'Join us for worship, prayer, and an inspiring message from our pastor.', '09:00 AM', 'Main Sanctuary', NULL, 'All'),
      ('Sunday', 'Sunday School', 'Bible study classes for all ages.', '11:00 AM', 'Education Building', NULL, 'All'),
      ('Sunday', 'Evening Service', 'A more intimate worship experience with communion on the first Sunday of each month.', '06:00 PM', 'Chapel', NULL, 'All'),
      ('Wednesday', 'Bible Study', 'Mid-week Bible study and prayer meeting.', '07:00 PM', 'Fellowship Hall', NULL, 'Bible Study'),
      ('Friday', 'Youth Group', 'Fun, fellowship, and faith for teens and young adults.', '06:30 PM', 'Youth Center', NULL, 'Youth'),
      ('Monday', 'Prayer Warriors', 'Dedicated prayer time for the church, community, and world needs.', '07:00 PM', 'Prayer Room', 'Pastor Johnson', 'Prayer'),
      ('Tuesday', 'Women''s Bible Study', 'Weekly gathering for women to study Scripture and support one another.', '10:00 AM', 'Fellowship Hall', 'Sarah Williams', 'Women'),
      ('Wednesday', 'Marriage Enrichment', 'Building stronger marriages through biblical principles and practical advice.', '06:30 PM', 'Room 201', 'John & Mary Davis', 'Marriage'),
      ('Friday', 'Men''s Fellowship', 'Comradery, knowledge, growth, instruction and fun for the Men of God.', '07:00 PM', 'Chicken Wings or Church (Pool)', 'Brother Mike', 'Men');
  END IF;
END $$;

-- Ensure RLS policies exist
DO $$
BEGIN
  -- Check if the policies exist and create them if they don't
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Activities are viewable by everyone') THEN
    CREATE POLICY "Activities are viewable by everyone"
      ON activities FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Admins can create activities') THEN
    CREATE POLICY "Admins can create activities"
      ON activities FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Admins can update activities') THEN
    CREATE POLICY "Admins can update activities"
      ON activities FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Admins can delete activities') THEN
    CREATE POLICY "Admins can delete activities"
      ON activities FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;