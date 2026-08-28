-- =============================================================================
-- Khaled Auto Spares (KAS) - Production PostgreSQL Database Schema
-- Multi-lingual Auto-Parts E-Commerce Platform (Algeria Market)
-- =============================================================================

-- Enable PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- -----------------------------------------------------------------------------
-- 1. GEOGRAPHY & SHIPPING (58 ALGERIAN WILAYAS & COMMUNES)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS algeria_wilayas (
    code CHAR(2) PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    delivery_time_text VARCHAR(100) NOT NULL,
    min_delivery_hours SMALLINT NOT NULL DEFAULT 24,
    max_delivery_hours SMALLINT NOT NULL DEFAULT 72,
    shipping_fee NUMERIC(10, 2) NOT NULL CHECK (shipping_fee >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS algeria_communes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wilaya_code CHAR(2) NOT NULL REFERENCES algeria_wilayas(code) ON DELETE RESTRICT,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    shipping_fee_override NUMERIC(10, 2) CHECK (shipping_fee_override >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. CORE CATALOG TAXONOMY (CATEGORIES & BRANDS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Layers',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    origin_country VARCHAR(60),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. VEHICLE TAXONOMY MATRIX
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vehicle_makes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make_id UUID NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vehicle_models_make_slug UNIQUE (make_id, slug)
);

CREATE TABLE IF NOT EXISTS vehicle_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
    generation_name VARCHAR(100) NOT NULL,
    year_start SMALLINT NOT NULL CHECK (year_start BETWEEN 1960 AND 2050),
    year_end SMALLINT CHECK (year_end IS NULL OR year_end >= year_start),
    engine_type VARCHAR(100),
    engine_code VARCHAR(50),
    fuel_type VARCHAR(30) CHECK (fuel_type IN ('Diesel', 'Essence', 'GPL', 'Hybride', 'Electrique', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. PRODUCT CATALOG & VARIANTS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE stock_status_enum AS ENUM ('in_stock', 'limited_stock', 'out_of_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    base_part_number VARCHAR(100) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    badge VARCHAR(100),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 1.00 AND 5.00),
    description_ar TEXT NOT NULL,
    description_fr TEXT,
    featured_home BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_sku VARCHAR(100) NOT NULL UNIQUE,
    part_number VARCHAR(100) NOT NULL,
    label_ar VARCHAR(255) NOT NULL,
    label_fr VARCHAR(255),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    old_price NUMERIC(12, 2) CHECK (old_price IS NULL OR old_price >= price),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    stock_status stock_status_enum NOT NULL DEFAULT 'in_stock',
    image_url TEXT,
    extra_specs JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alias_term VARCHAR(150) NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'universal',
    CONSTRAINT uq_product_alias UNIQUE (product_id, alias_term)
);

CREATE TABLE IF NOT EXISTS product_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label_ar VARCHAR(100) NOT NULL,
    value_ar VARCHAR(255) NOT NULL,
    label_fr VARCHAR(100),
    value_fr VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text_ar VARCHAR(255),
    alt_text_fr VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS part_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    make_id UUID NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES vehicle_generations(id) ON DELETE CASCADE,
    notes VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_part_compat UNIQUE (product_id, variant_id, make_id, model_id, generation_id)
);

-- -----------------------------------------------------------------------------
-- 5. MARKETING LANDING PAGES & OFFERS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS landing_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    title_ar VARCHAR(255) NOT NULL,
    subtitle_ar VARCHAR(255) NOT NULL,
    title_fr VARCHAR(255),
    badge_text VARCHAR(100),
    urgency_text VARCHAR(100),
    delivery_note VARCHAR(255),
    custom_price NUMERIC(12, 2) CHECK (custom_price IS NULL OR custom_price >= 0),
    custom_old_price NUMERIC(12, 2) CHECK (custom_old_price IS NULL OR custom_old_price >= custom_price),
    hero_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offer_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES landing_offers(id) ON DELETE CASCADE,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'ShieldCheck',
    text_ar VARCHAR(255) NOT NULL,
    text_fr VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 6. CUSTOMER REGISTRY (CRM & FRAUD TRACKING)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    wilaya_code CHAR(2) REFERENCES algeria_wilayas(code) ON DELETE SET NULL,
    commune VARCHAR(100),
    address TEXT,
    total_orders_count INT NOT NULL DEFAULT 0,
    delivered_orders_count INT NOT NULL DEFAULT 0,
    refused_orders_count INT NOT NULL DEFAULT 0,
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. ORDERS, CHECKOUT & LINE ITEMS (CASH ON DELIVERY)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE order_source_enum AS ENUM ('cart_checkout', 'landing_offer', 'phone_order', 'whatsapp_inquiry');
    CREATE TYPE payment_method_enum AS ENUM ('COD', 'baridimob', 'cib', 'bank_transfer');
    CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'paid', 'refunded');
    CREATE TYPE order_status_enum AS ENUM (
        'pending_confirmation',
        'confirmed',
        'processing',
        'dispatched',
        'out_for_delivery',
        'delivered',
        'refused_returned',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference VARCHAR(30) NOT NULL UNIQUE,
    order_source order_source_enum NOT NULL DEFAULT 'cart_checkout',
    offer_id UUID REFERENCES landing_offers(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Immutable contact & shipping snapshots at time of order
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    wilaya_code CHAR(2) NOT NULL REFERENCES algeria_wilayas(code) ON DELETE RESTRICT,
    commune VARCHAR(100) NOT NULL,
    delivery_address TEXT NOT NULL,
    
    -- Monetary & Payment attributes
    payment_method payment_method_enum NOT NULL DEFAULT 'COD',
    payment_status payment_status_enum NOT NULL DEFAULT 'unpaid',
    status order_status_enum NOT NULL DEFAULT 'pending_confirmation',
    
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(10, 2) NOT NULL CHECK (shipping_fee >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    
    customer_notes TEXT,
    call_center_notes TEXT,
    tracking_number VARCHAR(100),
    courier_company VARCHAR(80) DEFAULT 'Yalidine',
    client_ip INET,
    client_user_agent TEXT,
    
    confirmed_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    
    -- Immutable product snapshot
    product_name_snapshot VARCHAR(255) NOT NULL,
    part_number_snapshot VARCHAR(100) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. INVENTORY AUDIT LEDGER (DOUBLE-ENTRY)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE inventory_delta_type_enum AS ENUM (
        'initial_intake',
        'purchase_order_in',
        'order_reservation',
        'order_delivered_final',
        'order_cancelled_restock',
        'manual_correction_shrinkage',
        'manual_correction_surplus',
        'damaged_writeoff'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    delta_type inventory_delta_type_enum NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    quantity_delta INT NOT NULL,
    quantity_after INT NOT NULL CHECK (quantity_after >= 0),
    reason TEXT,
    created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. CONTACT MESSAGES & INQUIRIES
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE contact_status_enum AS ENUM ('unread', 'in_progress', 'contacted', 'closed', 'spam');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_name VARCHAR(150) NOT NULL,
    sender_phone VARCHAR(30) NOT NULL,
    sender_email VARCHAR(255),
    message_body TEXT NOT NULL,
    status contact_status_enum NOT NULL DEFAULT 'unread',
    admin_reply_notes TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 10. SYSTEM AUDIT TRAIL
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL DEFAULT 'N/A',
    action_type VARCHAR(50) NOT NULL,
    old_data TEXT,
    new_data TEXT,
    performed_by VARCHAR(150) NOT NULL DEFAULT 'SYSTEM',
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 11. ADMIN USERS & ROLES (RBAC)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 12. ORDER TIMELINE & EVENTS LOG
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    note TEXT,
    created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. MARKETING CAMPAIGNS & UTM TRACKING
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'facebook', -- 'facebook', 'instagram', 'tiktok', 'google', 'direct'
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    budget NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    landing_slug VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 14. ADMIN NOTIFICATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'order', 'stock', 'customer', 'alert', 'info'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 15. SYSTEM SETTINGS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

