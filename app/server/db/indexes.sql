-- =============================================================================
-- Khaled Auto Spares (KAS) - Production Database Indexes & Search
-- Exact Match, Foreign Keys, Arabic/French Full-Text & Trigram Operators
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. B-TREE INDEXES FOR LOOKUPS, FOREIGN KEYS & FILTERING
-- -----------------------------------------------------------------------------

-- Orders lookup & CRM filtering
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_wilaya ON orders(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Catalog hierarchy & active status filtering
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand_active ON products(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured_home) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_part_number ON product_variants(part_number);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(variant_sku);

-- Vehicle taxonomy and compatibility matrix
CREATE INDEX IF NOT EXISTS idx_compat_product ON part_compatibility(product_id);
CREATE INDEX IF NOT EXISTS idx_compat_variant ON part_compatibility(variant_id);
CREATE INDEX IF NOT EXISTS idx_compat_make_model ON part_compatibility(make_id, model_id);
CREATE INDEX IF NOT EXISTS idx_compat_generation ON part_compatibility(generation_id);

-- Landing offers
CREATE INDEX IF NOT EXISTS idx_landing_offers_slug ON landing_offers(slug) WHERE is_active = TRUE;

-- Customers phone index
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- -----------------------------------------------------------------------------
-- 2. ARABIC / FRENCH NORMALIZATION FUNCTION & TRIGRAM GIN INDEXES
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION normalize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN '';
    END IF;
    
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                -- Strip Arabic Tashkeel (diacritics: Fatha, Damma, Kasra, Sukun, Tanween)
                REGEXP_REPLACE(
                    unaccent(input_text),
                    '[\u0610-\u061A\u064B-\u065F\u0670]', '', 'g'
                ),
                -- Normalize Arabic Alef variants (أ, إ, آ -> ا)
                '[أإآ]', 'ا', 'g'
            ),
            '[^a-zA-Z0-9\u0600-\u06FF]', ' ', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigram GIN indexes for fuzzy search, misspellings, and partial part numbers
CREATE INDEX IF NOT EXISTS idx_products_name_ar_trgm ON products USING GIN(name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_fr_trgm ON products USING GIN(name_fr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_part_num_trgm ON products USING GIN(base_part_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_variants_part_num_trgm ON product_variants USING GIN(part_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_aliases_term_trgm ON product_aliases USING GIN(alias_term gin_trgm_ops);
