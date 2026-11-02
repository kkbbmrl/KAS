-- ==============================================================================
-- KAS Auto Parts: Supabase Storage Configuration Script
-- Target Bucket: "product-images" (Public CDN distribution for product photos)
-- ==============================================================================

-- 1. Create the 'product-images' public bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    TRUE,
    10485760, -- 10MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing conflicting policies for clean idempotent execution
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads To Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates To Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletions From Product Images" ON storage.objects;

-- 3. Policy: Allow anyone (public CDN and browsers) to view and download product images
CREATE POLICY "Public Read Product Images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- 4. Policy: Allow authenticated users & backend service role to upload product images
CREATE POLICY "Allow Uploads To Product Images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 5. Policy: Allow update/overwrite on product images
CREATE POLICY "Allow Updates To Product Images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Policy: Allow deletion of product images
CREATE POLICY "Allow Deletions From Product Images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images');

-- Confirm bucket creation
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
WHERE id = 'product-images';

