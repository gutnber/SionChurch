-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Settings are viewable by everyone') THEN
    CREATE POLICY "Settings are viewable by everyone"
      ON settings FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can insert settings') THEN
    CREATE POLICY "Admins can insert settings"
      ON settings FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can update settings') THEN
    CREATE POLICY "Admins can update settings"
      ON settings FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can delete settings') THEN
    CREATE POLICY "Admins can delete settings"
      ON settings FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before update if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_settings_updated_at') THEN
    CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();
  END IF;
END $$;

-- Insert default home page settings if they don't exist
INSERT INTO settings (type, data)
VALUES (
  'home_page', 
  '{
    "hero_title": "Welcome to Grace Church",
    "hero_subtitle": "A place of worship, community, and spiritual growth for all",
    "hero_image": "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    "welcome_title": "Join Us for Worship",
    "welcome_text": "Weekly services and gatherings"
  }'::jsonb
)
ON CONFLICT (type) DO NOTHING;