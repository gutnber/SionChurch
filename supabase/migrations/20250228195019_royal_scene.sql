/*
  # Create storage bucket for church assets

  1. New Storage Bucket
    - `church-assets` bucket for storing church-related files
      - Logos
      - Event images
      - Gallery images
  2. Security
    - Public read access for all files
    - Write access restricted to authenticated users
*/

-- Create a storage bucket for church assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-assets', 'Church Assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files
CREATE POLICY "Public can view church assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'church-assets');

-- Only authenticated users can insert files
CREATE POLICY "Authenticated users can upload church assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'church-assets' AND
    auth.role() = 'authenticated'
  );

-- Only file owners or admins can update files
CREATE POLICY "File owners or admins can update church assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'church-assets' AND
    (
      auth.uid() = owner OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Only file owners or admins can delete files
CREATE POLICY "File owners or admins can delete church assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'church-assets' AND
    (
      auth.uid() = owner OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );