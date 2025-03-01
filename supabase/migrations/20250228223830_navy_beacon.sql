/*
  # Update gallery table schema

  1. Changes
    - Drop existing gallery table if it exists
    - Create albums table
    - Create new gallery table with album_id reference
    - Set up RLS policies for both tables
  2. Security
    - Enable RLS on both tables
    - Add policies for viewing, creating, updating, and deleting
*/

-- Drop existing gallery table if it exists
DROP TABLE IF EXISTS gallery;

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'admin', 'pastor', 'leader', 'server', 'member')),
  created_at timestamptz DEFAULT now()
);

-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Albums Policies
CREATE POLICY "Albums are viewable based on visibility"
  ON albums FOR SELECT
  USING (
    visibility = 'public' OR
    (visibility = 'member' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())) OR
    (visibility = 'server' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('server', 'leader', 'pastor', 'admin'))) OR
    (visibility = 'leader' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('leader', 'pastor', 'admin'))) OR
    (visibility = 'pastor' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))) OR
    (visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  );

CREATE POLICY "Admins can create albums"
  ON albums FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update albums"
  ON albums FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete albums"
  ON albums FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Gallery Policies
CREATE POLICY "Gallery images are viewable through their album"
  ON gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM albums
      WHERE albums.id = gallery.album_id AND (
        albums.visibility = 'public' OR
        (albums.visibility = 'member' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())) OR
        (albums.visibility = 'server' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('server', 'leader', 'pastor', 'admin'))) OR
        (albums.visibility = 'leader' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('leader', 'pastor', 'admin'))) OR
        (albums.visibility = 'pastor' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))) OR
        (albums.visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      )
    )
  );

CREATE POLICY "Admins, pastors, and leaders can upload images"
  ON gallery FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pastor', 'leader')
    )
  );

CREATE POLICY "Admins can update gallery images"
  ON gallery FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete gallery images"
  ON gallery FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));