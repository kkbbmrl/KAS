-- =============================================================================
-- KHALED AUTO PARTS (KAS) - SUPABASE PRODUCT CATALOG INGESTION SCRIPT
-- Category: Pare-boue / Cache Roue (واقي العجلات / بطانة الطين)
-- Suppliers: DEGA, CARVAL, MDS
-- Total Parts: 85 Items
-- =============================================================================

-- Step 1: Create the spare_parts table (for inventory, imports & raw supplier data)
CREATE TABLE IF NOT EXISTS spare_parts (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    vehicle VARCHAR(100) NOT NULL,
    position VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    price_dzd DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 2: Insert or update all 85 parts in spare_parts
INSERT INTO spare_parts (reference, vehicle, position, description, price_dzd, supplier) VALUES
('CIT15C3001', 'Citroën C3 (2003-2009)', 'AV DR', 'CACHE ROUE C3 2003-2009 AV DROIT', 2500, 'DEGA'),
('CIT15C3002', 'Citroën C3 (2003-2009)', 'AV GA', 'CACHE ROUE C3 2003-2009 AV GAUCHE', 2500, 'DEGA'),
('CIT15C3007', 'Citroën C3 (2009-2015)', 'AV DR', 'CACHE ROUE C3 2009-2015 AV DR', 2500, 'DEGA'),
('CIT15C3008', 'Citroën C3 (2009-2015)', 'AV GA', 'CACHE ROUE C3 2009-2015 AV GA', 2500, 'DEGA'),
('FIA1550001', 'Fiat 500', 'AV DR', 'CACHE ROUE FIAT 500 AV DR', 3200, 'DEGA'),
('FIA1550002', 'Fiat 500', 'AV GA', 'CACHE ROUE FIAT 500 AV GA', 3200, 'DEGA'),
('FIA155X001', 'Fiat 500X', 'AV DR', 'CACHE ROUE FIAT 500 X AV DR', 3200, 'DEGA'),
('FIA155X002', 'Fiat 500X', 'AV GA', 'CACHE ROUE FIAT 500 X AV GA', 3200, 'DEGA'),
('FIA15DU005', 'Peugeot Boxer (2006+)', 'AV DR', 'CACHE ROUE BOXER 2006+ AV DR', 2500, 'DEGA'),
('FOR15FI005', 'Ford Fiesta (2009+)', 'AV DR', 'CACHE ROUE FIESTA 2009+ AV DR', 2500, 'DEGA'),
('FOR15FI006', 'Ford Fiesta (2009+)', 'AV GA', 'CACHE ROUE FIESTA 2009+ AV GA', 2500, 'DEGA'),
('FOR15FO003', 'Ford Focus (2005+)', 'AV DR', 'CACHE ROUE FOCUS 2005+ AV DR', 2500, 'DEGA'),
('FOR15FO004', 'Ford Focus (2005+)', 'AV GA', 'CACHE ROUE FOCUS 2005+ AV GA', 2500, 'DEGA'),
('FOR15FO009', 'Ford Focus (2011+)', 'AV DR', 'CACHE ROUE FOCUS 2011+ AV DR', 2500, 'DEGA'),
('FOR15FO010', 'Ford Focus (2011+)', 'AV GA', 'CACHE ROUE FOCUS 2011+ AV GA', 2500, 'DEGA'),
('PEJ1527001', 'Peugeot 207+', 'AV DR', 'CACHE ROUE 207+ AV DR', 2500, 'DEGA'),
('PEJ1527002', 'Peugeot 207+', 'AV GA', 'CACHE ROUE 207+ AV GA', 2500, 'DEGA'),
('PEJ1528001', 'Peugeot 208+', 'AV DR', 'CACHE ROUE 208+ AV DR', 2500, 'DEGA'),
('PEJ1528002', 'Peugeot 208+', 'AV GA', 'CACHE ROUE 208+ AV GA', 2500, 'DEGA'),
('PEJ1537001', 'Peugeot 307+ HDI', 'AV DR', 'CACHE ROUE 307+ HDI AV DR', 2500, 'DEGA'),
('PEJ1537002', 'Peugeot 307+ HDI', 'AV GA', 'CACHE ROUE 307+ HDI AV GA', 2500, 'DEGA'),
('PEJ1546001', 'Peugeot 406 HDI', 'AV DR', 'CACHE ROUE 406 HDI AV DR', 2500, 'DEGA'),
('PEJ1546002', 'Peugeot 406 HDI', 'AV GA', 'CACHE ROUE 406 HDI AV GA', 2500, 'DEGA'),
('PEJ15PR009', 'Peugeot Partner Tepee (2009+)', 'AV DR', 'CACHE ROUE PARTNER TP 2009+ AV DR', 2500, 'DEGA'),
('PEJ15PR010', 'Peugeot Partner Tepee (2009+)', 'AV GA', 'CACHE ROUE PARTNER TP 2009+ AV GA', 2500, 'DEGA'),
('REN15CL005', 'Renault Clio 2 (2002+)', 'AV DR', 'CACHE ROUE CLIO 2002+ AV DR', 2500, 'DEGA'),
('REN15CL006', 'Renault Clio 2 (2002+)', 'AV GA', 'CACHE ROUE CLIO 2002+ AV GA', 2500, 'DEGA'),
('REN15CL015', 'Renault Clio 3 (2006+)', 'AV DR', 'CACHE ROUE CLIO 03 2006+ AV DR', 2500, 'DEGA'),
('REN15CL016', 'Renault Clio 3 (2006+)', 'AV GA', 'CACHE ROUE CLIO 03 2006+ AV GA', 2500, 'DEGA'),
('REN15CL021', 'Renault Clio 4 (2012+)', 'AV DR', 'CACHE ROUE CLIO 04 2012+ AV DR', 2500, 'DEGA'),
('REN15CL022', 'Renault Clio 4 (2012+)', 'AV GA', 'CACHE ROUE CLIO 04 2012+ AV GA', 2500, 'DEGA'),
('REN15CL025', 'Renault Symbol (2013+)', 'AV DR', 'CACHE ROUE SYMBOL 2013+ AV DR', 2500, 'DEGA'),
('REN15CL026', 'Renault Symbol (2013+)', 'AV GA', 'CACHE ROUE SYMBOL 2013+ AV GA', 2500, 'DEGA'),
('SEA15IB005', 'Seat Ibiza (2009+)', 'AV DR', 'CACHE ROUE IBIZA 2009+ AV DR', 2500, 'DEGA'),
('SEA15IB006', 'Seat Ibiza (2009+)', 'AV GA', 'CACHE ROUE IBIZA 2009+ AV GA', 2500, 'DEGA'),
('WOS15CD003', 'VW Caddy (2005+)', 'AV DR', 'CACHE ROUE CADDY 2005+ AV DR', 2500, 'DEGA'),
('WOS15GO001', 'VW Golf 4', 'AV DR', 'CACHE ROUE GOLF 04 DR', 2500, 'DEGA'),
('WOS15GO002', 'VW Golf 4', 'AV GA', 'CACHE ROUE GOLF 04 GA', 2500, 'DEGA'),
('WOS15GO004', 'VW Golf 5', 'EXTER DR', 'CACHE ROUE GOLF 5 DR EXTER', 2500, 'DEGA'),
('WOS15GO005', 'VW Golf 5', 'EXTER GA', 'CACHE ROUE GOLF 5 GA EXTER', 2500, 'DEGA'),
('HYU15AC001', 'Hyundai Accent GLS', 'AV DR', 'CACHE ROUE ACCENT GLS DR AV', 2200, 'CARVAL'),
('HYU15AC002', 'Hyundai Accent GLS', 'AV GA', 'CACHE ROUE ACCENT GLS DR AV', 2200, 'CARVAL'),
('HYU15RB003', 'Hyundai Accent RB', 'AV DR', 'CACHE ROUE ACCENT RB DR', 2200, 'CARVAL'),
('HYU15RB004', 'Hyundai Accent RB', 'AV GA', 'CACHE ROUE ACCENT RB GA', 2200, 'CARVAL'),
('HYU15AT005', 'Hyundai Atos (2004+)', 'AV DR', 'CACHE ROUE ATOS 2004+ AV DR', 2200, 'CARVAL'),
('HYU15AT006', 'Hyundai Atos (2004+)', 'AV GA', 'CACHE ROUE ATOS 2004+ AV GA', 2500, 'CARVAL'),
('CHE15AV007', 'Chevrolet Aveo Sedan (2007+)', 'AV DR', 'CACHE ROUE AVEO SEDAN 2007+ DR', 2500, 'CARVAL'),
('CHE15AV008', 'Chevrolet Aveo Sedan (2007+)', 'AV GA', 'CACHE ROUE AVEO SEDAN 2007+ DR', 2200, 'CARVAL'),
('CHE15AV009', 'Chevrolet Aveo (2005+)', 'AV DR', 'CACHE ROUE AVEO 2005+ AV DR', 2200, 'CARVAL'),
('CHE15AV010', 'Chevrolet Aveo (2005+)', 'AV GA', 'CACHE ROUE AVEO 2005+ AV GA', 2200, 'CARVAL'),
('TOY15CO011', 'Toyota Corolla (2003+)', 'AV GA', 'CACHE ROUE COROLLA 2003+ AV GA', 2200, 'CARVAL'),
('TOY15CO012', 'Toyota Corolla (2003+)', 'AV GA', 'CACHE ROUE COROLLA 2003+ AV GA', 2200, 'CARVAL'),
('TOY15CO013', 'Toyota Corolla (2008+)', 'AV DR', 'CACHE ROUE COROLLA 2008+ AV GA', 2200, 'CARVAL'),
('TOY15CO014', 'Toyota Corolla (2008+)', 'AV GA', 'CACHE ROUE COROLLA 2008+ AV GA', 2200, 'CARVAL'),
('TOY15CO015', 'Toyota Corolla (2011+)', 'AV DR', 'CACHE ROUE COROLLA 2011+ AV GA', 2200, 'CARVAL'),
('TOY15CO016', 'Toyota Corolla (2011+)', 'AV GA', 'CACHE ROUE COROLLA 2011+ AV GA', 2200, 'CARVAL'),
('TOY15CO017', 'Toyota Corolla (2014+)', 'AV GA', 'CACHE ROUE COROLLA 2014+ AV GA', 2500, 'CARVAL'),
('TOY15CO018', 'Toyota Corolla (2014+)', 'AV GA', 'CACHE ROUE COROLLA 2014+ AV GA', 2500, 'CARVAL'),
('HYU15I1019', 'Hyundai i10 (2012+)', 'AV DR', 'CACHE ROUE I10 2012+ AV DR', 2200, 'CARVAL'),
('HYU15I1020', 'Hyundai i10 (2012+)', 'AV GA', 'CACHE ROUE I10 2012+ AV GA', 2200, 'CARVAL'),
('KIA15PI021', 'Kia Picanto (2004+)', 'AV GA', 'CACHE ROUE PICANTO 2004+ AV GA', 2200, 'CARVAL'),
('KIA15PI022', 'Kia Picanto (2008+)', 'AV DR', 'CACHE ROUE PICANTO 2008+ AV DR', 2500, 'CARVAL'),
('KIA15PI023', 'Kia Picanto (2008+)', 'AV GA', 'CACHE ROUE PICANTO 2008+ AV GA', 2500, 'CARVAL'),
('KIA15PI024', 'Kia Picanto (2018+)', 'AV DR', 'CACHE ROUE PICANTO 2018+ AV DR', 2600, 'CARVAL'),
('KIA15PI025', 'Kia Picanto (2018+)', 'AV GA', 'CACHE ROUE PICANTO 2018+ AV GA', 2600, 'CARVAL'),
('KIA15PP026', 'Kia Picanto Pop', 'AV DR', 'CACHE ROUE PICANTO POP AV DR', 2600, 'CARVAL'),
('KIA15PP027', 'Kia Picanto Pop', 'AV GA', 'CACHE ROUE PICANTO POP AV GA', 2600, 'CARVAL'),
('CHE15SL028', 'Chevrolet Sail (2010+)', 'AV DR', 'CACHE ROUE SAIL 2010+ AV DR', 2800, 'CARVAL'),
('CHE15SL029', 'Chevrolet Sail (2010+)', 'AV GA', 'CACHE ROUE SAIL 2010+ AV GA', 2800, 'CARVAL'),
('CHE15SP030', 'Chevrolet Spark (2005+)', 'AV DR', 'CACHE ROUE SPARK 2005+ AV DR', 1800, 'CARVAL'),
('CHE15SP031', 'Chevrolet Spark (2005+)', 'AV GA', 'CACHE ROUE SPARK 2005+ AV GA', 1800, 'CARVAL'),
('PEU1510601', 'Peugeot 106 / Saxo', 'AV DR', 'CACHE ROUE 106 SAXO AV DR', 2500, 'MDS'),
('PEU1510602', 'Peugeot 106 / Saxo', 'AV GA', 'CACHE ROUE 106 SAXO AV GA', 2500, 'MDS'),
('REN15KG003', 'Renault Kangoo (03-07)', 'AV DR', 'KANGOO 03-07 AV DR', 1800, 'MDS'),
('REN15KG004', 'Renault Kangoo (03-07)', 'AV GA', 'KANGOO 03-07 AV GA', 1800, 'MDS'),
('REN15CL098-DR', 'Renault Clio 98 (Debza)', 'AV DR', 'CLIO 98 DEBZA AV DR', 1500, 'MDS'),
('REN15CL098-GA', 'Renault Clio 98 (Debza)', 'AV GA', 'CLIO 98 DEBZA AV GA', 1500, 'MDS'),
('VOW15PO007', 'VW Polo (05) Police', 'AV DR', 'POLO 05 POLICE AV DR', 2500, 'MDS'),
('VOW15PO008', 'VW Polo (05) Police', 'AV GA', 'POLO 05 POLICE AV GA', 2500, 'MDS'),
('VOW15GO009', 'VW Golf 7', 'AV DR', 'GOLF 7 AV DR', 3500, 'MDS'),
('VOW15GO010', 'VW Golf 7', 'AV GA', 'GOLF 7 AV GA', 3500, 'MDS'),
('PEU1530111', 'Peugeot 301', 'AR DR', '301 AR DROIT', 4000, 'MDS'),
('PEU1530112', 'Peugeot 301', 'AR GA', '301 AR GAUCHE', 4000, 'MDS'),
('CIT15CE013', 'Citroën C-Elysse', 'AR DR', 'C-ELYSSE AR DROIT', 4000, 'MDS'),
('CIT15CE014', 'Citroën C-Elysse', 'AR GA', 'C-ELYSSE AR GAUCHE', 4000, 'MDS')
ON CONFLICT (reference) DO UPDATE 
SET price_dzd = EXCLUDED.price_dzd, 
    description = EXCLUDED.description,
    supplier = EXCLUDED.supplier;

-- Step 3: Ensure Category 'Pare-boue / Cache Roue' exists in catalog
INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
VALUES ('cat-pare-boue', 'pare-boue', 'واقي العجلات (باربو)', 'Pare-boue / Cache Roue', 'Shield', 1, 23)
ON CONFLICT (id) DO UPDATE SET is_available = 1;

-- Step 4: Ensure Brand entries exist
INSERT INTO brands (id, slug, name, origin_country, is_featured, display_order)
VALUES 
  ('brand-ford', 'ford', 'FORD', 'USA', 1, 15),
  ('brand-dega', 'dega', 'DEGA', 'Turquie', 0, 60),
  ('brand-carval', 'carval', 'CARVAL', 'Turquie', 0, 61),
  ('brand-mds', 'mds', 'MDS', 'Algérie / Turquie', 0, 62)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Sync all items into the main 'products' table (Visible in Storefront & Admin)
INSERT INTO products (
    id,
    sku,
    base_part_number,
    name_ar,
    name_fr,
    category_id,
    brand_id,
    badge,
    rating,
    description_ar,
    description_fr,
    is_active,
    featured_home,
    created_at,
    updated_at
)
SELECT 
    'p-' || s.reference AS id,
    'KAS-' || s.reference AS sku,
    s.reference AS base_part_number,
    'باربو / واقي العجلات ' || s.vehicle || ' (' || 
        CASE 
            WHEN s.position IN ('AV DR', 'DR', 'EXTER DR') THEN 'أمامي يمين'
            WHEN s.position IN ('AV GA', 'GA', 'EXTER GA') THEN 'أمامي يسار'
            WHEN s.position = 'AR DR' THEN 'خلفي يمين'
            WHEN s.position = 'AR GA' THEN 'خلفي يسار'
            ELSE s.position
        END || ')' AS name_ar,
    s.description || ' - ' || s.vehicle AS name_fr,
    'cat-pare-boue' AS category_id,
    CASE 
        WHEN s.vehicle ILIKE '%Citroën%' OR s.vehicle ILIKE '%Citroen%' THEN 'brand-citroen'
        WHEN s.vehicle ILIKE '%Peugeot%' THEN 'brand-peugeot'
        WHEN s.vehicle ILIKE '%Renault%' THEN 'brand-renault'
        WHEN s.vehicle ILIKE '%Fiat%' THEN 'brand-fiat'
        WHEN s.vehicle ILIKE '%Ford%' THEN 'brand-ford'
        WHEN s.vehicle ILIKE '%VW%' OR s.vehicle ILIKE '%Volkswagen%' THEN 'brand-vw'
        WHEN s.vehicle ILIKE '%Hyundai%' THEN 'brand-hyundai'
        WHEN s.vehicle ILIKE '%Chevrolet%' THEN 'brand-chevrolet'
        WHEN s.vehicle ILIKE '%Toyota%' THEN 'brand-toyota'
        WHEN s.vehicle ILIKE '%Kia%' THEN 'brand-kia'
        WHEN s.vehicle ILIKE '%Seat%' THEN 'brand-seat'
        ELSE 'brand-kas'
    END AS brand_id,
    s.supplier AS badge,
    4.9 AS rating,
    'قطعة غيار عالية الجودة (واقي العجلات / بطانة الطين) متوافقة تماماً مع ' || s.vehicle || '. المورد: ' || s.supplier AS description_ar,
    'Pare-boue / Cache roue de haute qualité certifié pour ' || s.vehicle || '. Fournisseur: ' || s.supplier AS description_fr,
    1 AS is_active,
    0 AS featured_home,
    NOW() AS created_at,
    NOW() AS updated_at
FROM spare_parts s
ON CONFLICT (id) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_fr = EXCLUDED.name_fr,
    badge = EXCLUDED.badge,
    description_ar = EXCLUDED.description_ar,
    description_fr = EXCLUDED.description_fr,
    is_active = 1,
    updated_at = NOW();

-- Step 6: Sync all items into 'product_variants' (Pricing, Stock & Order fulfillment)
INSERT INTO product_variants (
    id,
    product_id,
    variant_sku,
    part_number,
    label_ar,
    label_fr,
    price,
    old_price,
    stock_quantity,
    stock_status,
    is_active,
    created_at,
    updated_at
)
SELECT
    'v-' || s.reference AS id,
    'p-' || s.reference AS product_id,
    s.reference || '-VAR' AS variant_sku,
    s.reference AS part_number,
    CASE 
        WHEN s.position IN ('AV DR', 'DR', 'EXTER DR') THEN 'أمامي يمين (AV DR)'
        WHEN s.position IN ('AV GA', 'GA', 'EXTER GA') THEN 'أمامي يسار (AV GA)'
        WHEN s.position = 'AR DR' THEN 'خلفي يمين (AR DR)'
        WHEN s.position = 'AR GA' THEN 'خلفي يسار (AR GA)'
        ELSE s.position
    END AS label_ar,
    CASE 
        WHEN s.position IN ('AV DR', 'DR', 'EXTER DR') THEN 'Avant Droit (AV DR)'
        WHEN s.position IN ('AV GA', 'GA', 'EXTER GA') THEN 'Avant Gauche (AV GA)'
        WHEN s.position = 'AR DR' THEN 'Arrière Droit (AR DR)'
        WHEN s.position = 'AR GA' THEN 'Arrière Gauche (AR GA)'
        ELSE s.position
    END AS label_fr,
    s.price_dzd AS price,
    ROUND(s.price_dzd * 1.15, -1) AS old_price,
    10 AS stock_quantity,
    'in_stock' AS stock_status,
    1 AS is_active,
    NOW() AS created_at,
    NOW() AS updated_at
FROM spare_parts s
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    old_price = EXCLUDED.old_price,
    stock_quantity = EXCLUDED.stock_quantity,
    stock_status = EXCLUDED.stock_status,
    is_active = 1,
    updated_at = NOW();

-- Step 7: Verification Count Check
SELECT 
    (SELECT COUNT(*) FROM spare_parts) AS total_spare_parts,
    (SELECT COUNT(*) FROM products WHERE category_id = 'cat-pare-boue') AS total_pare_boue_products,
    (SELECT COUNT(*) FROM product_variants WHERE id LIKE 'v-%') AS total_pare_boue_variants;
