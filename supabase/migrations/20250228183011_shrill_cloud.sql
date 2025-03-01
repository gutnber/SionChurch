/*
  # Create authentication hooks

  1. Functions
    - `handle_new_user`: Creates a profile for new users automatically
  
  2. Triggers
    - `on_auth_user_created`: Triggers the handle_new_user function when a new user is created
*/

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();