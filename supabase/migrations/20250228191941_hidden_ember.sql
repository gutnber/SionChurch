/*
  # Create profiles trigger

  1. Changes
    - Creates a trigger function to automatically create profiles for new users
    - Sets admin role for henrygutierrezbaja@gmail.com
    - Ensures user metadata is properly captured
*/

-- Create a trigger function to automatically create profiles for new users
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
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = CASE
      WHEN new.email = 'henrygutierrezbaja@gmail.com' THEN 'admin'
      ELSE EXCLUDED.role
    END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();