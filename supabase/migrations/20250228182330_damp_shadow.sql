/*
  # Initial Schema Setup for Church Website

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `role` (text, enum: admin, pastor, leader, server, member)
      - `avatar_url` (text, nullable)
    
    - `events`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `title` (text)
      - `description` (text)
      - `date` (timestamp)
      - `location` (text)
      - `image_url` (text, nullable)
      - `visibility` (text, enum: public, admin, pastor, leader, server, member)
    
    - `news`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `title` (text)
      - `content` (text)
      - `image_url` (text, nullable)
      - `author_id` (uuid, foreign key to profiles.id)
      - `visibility` (text, enum: public, admin, pastor, leader, server, member)
    
    - `activities`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `day_of_week` (text)
      - `title` (text)
      - `description` (text)
      - `time` (text)
      - `location` (text)
    
    - `gallery`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `visibility` (text, enum: public, admin, pastor, leader, server, member)
    
    - `themes`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `name` (text)
      - `primary_color` (text)
      - `secondary_color` (text)
      - `accent_color` (text)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for admins to read/write all data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'pastor', 'leader', 'server', 'member')),
  avatar_url text
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  date timestamptz NOT NULL,
  location text NOT NULL,
  image_url text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'admin', 'pastor', 'leader', 'server', 'member'))
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid REFERENCES profiles(id) NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'admin', 'pastor', 'leader', 'server', 'member'))
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  day_of_week text NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  title text NOT NULL,
  description text NOT NULL,
  time text NOT NULL,
  location text NOT NULL
);

-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'admin', 'pastor', 'leader', 'server', 'member'))
);

-- Create themes table
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text NOT NULL,
  is_active boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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

-- News Policies
CREATE POLICY "News are viewable based on visibility"
  ON news FOR SELECT
  USING (
    visibility = 'public' OR
    (visibility = 'member' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())) OR
    (visibility = 'server' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('server', 'leader', 'pastor', 'admin'))) OR
    (visibility = 'leader' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('leader', 'pastor', 'admin'))) OR
    (visibility = 'pastor' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))) OR
    (visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  );

CREATE POLICY "Admins can create news"
  ON news FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update news"
  ON news FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete news"
  ON news FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

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

-- Gallery Policies
CREATE POLICY "Gallery items are viewable based on visibility"
  ON gallery FOR SELECT
  USING (
    visibility = 'public' OR
    (visibility = 'member' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())) OR
    (visibility = 'server' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('server', 'leader', 'pastor', 'admin'))) OR
    (visibility = 'leader' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('leader', 'pastor', 'admin'))) OR
    (visibility = 'pastor' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))) OR
    (visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  );

CREATE POLICY "Admins can create gallery items"
  ON gallery FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update gallery items"
  ON gallery FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete gallery items"
  ON gallery FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Themes Policies
CREATE POLICY "Themes are viewable by everyone"
  ON themes FOR SELECT
  USING (true);

CREATE POLICY "Admins can create themes"
  ON themes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update themes"
  ON themes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete themes"
  ON themes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create default theme
INSERT INTO themes (name, primary_color, secondary_color, accent_color, is_active)
VALUES 
  ('Modern Dark', '#121212', '#3b82f6', '#8b5cf6', true);

-- Create a trigger function to automatically set new users as members
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE
      WHEN new.email = 'henrygutierrezbaja@gmail.com' THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create sample activities
INSERT INTO activities (day_of_week, title, description, time, location)
VALUES 
  ('Sunday', 'Morning Worship Service', 'Join us for worship, prayer, and an inspiring message from our pastor.', '09:00 AM', 'Main Sanctuary'),
  ('Sunday', 'Sunday School', 'Bible study classes for all ages.', '11:00 AM', 'Education Building'),
  ('Sunday', 'Evening Service', 'A more intimate worship experience with communion on the first Sunday of each month.', '06:00 PM', 'Chapel'),
  ('Wednesday', 'Bible Study', 'Mid-week Bible study and prayer meeting.', '07:00 PM', 'Fellowship Hall'),
  ('Friday', 'Youth Group', 'Fun, fellowship, and faith for teens and young adults.', '06:30 PM', 'Youth Center');