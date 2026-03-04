-- Add registration_prices JSONB column for per-distance pricing
-- Format: { "5k": "R$ 159,90", "10k": "R$ 159,90", "21k": "R$ 189,90" }
ALTER TABLE races ADD COLUMN registration_prices JSONB DEFAULT NULL;
