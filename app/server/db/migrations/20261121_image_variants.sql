-- Additive only: legacy image_url remains the fallback until all variants are verified.
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS storage_provider TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_key TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_variants JSONB;

ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS image_storage_provider TEXT;
ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS image_key TEXT;
ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS image_variants JSONB;
