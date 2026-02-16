-- Update handle_new_user trigger to persist city data from user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, city, state, latitude, longitude)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'city',
    COALESCE(NEW.raw_user_meta_data->>'state', 'SP'),
    (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION,
    (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
