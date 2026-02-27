-- Backfill race coordinates from cities table
-- Run this once via Supabase SQL Editor

-- 1. Races with city_id but (0,0) coords: copy coords from cities table
UPDATE races
SET
  latitude = cities.latitude,
  longitude = cities.longitude
FROM cities
WHERE races.city_id = cities.id
  AND races.latitude = 0
  AND races.longitude = 0;

-- 2. Races without city_id and (0,0) coords: set to pending_review
UPDATE races
SET status = 'pending_review'
WHERE city_id IS NULL
  AND latitude = 0
  AND longitude = 0
  AND status != 'pending_review';
