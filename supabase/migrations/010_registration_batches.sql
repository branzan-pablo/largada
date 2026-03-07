-- Add registration_batches column for structured pricing (lotes with kits/modalities)
ALTER TABLE races
ADD COLUMN IF NOT EXISTS registration_batches jsonb DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN races.registration_batches IS 'Array of price batches: [{name, deadline?, items: [{label, price}]}]';
