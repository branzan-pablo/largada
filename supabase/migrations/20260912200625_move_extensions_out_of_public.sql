-- Keep extension-owned objects out of the Data API's public schema. Both
-- extensions are relocatable; existing columns and function argument types
-- retain their object OIDs after the move.
CREATE SCHEMA IF NOT EXISTS extensions;

ALTER EXTENSION vector SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- These SQL functions resolve extension operators/functions when invoked, so
-- include the trusted extensions schema while retaining an explicit path.
ALTER FUNCTION public.search_cities(text, integer)
  SET search_path = public, extensions;

ALTER FUNCTION public.match_races_semantic(
  extensions.vector,
  date,
  double precision,
  integer,
  integer
) SET search_path = public, extensions;

ALTER FUNCTION public.match_races_semantic_any_date(
  extensions.vector,
  double precision,
  integer
) SET search_path = public, extensions;
