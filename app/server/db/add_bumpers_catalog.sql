-- =============================================================================
-- KAS Auto Parts: Insert 17 Parchoc Avant (Bumpers) into Supabase PostgreSQL
-- =============================================================================

-- 1. Ensure Pare-chocs Category exists
INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
VALUES ('cat-pare-chocs', 'pare-chocs', 'الصدام والمصدات (بارشوك)', 'Pare-chocs', 'RectangleHorizontal', 1, 3)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug;

-- 2. Ensure Brands exist
INSERT INTO brands (id, slug, name, origin_country, is_featured, display_order)
VALUES 
  ('brand-fiat', 'fiat', 'FIAT', 'Italy', 1, 10),
  ('brand-dacia', 'dacia', 'DACIA', 'Romania', 1, 11),
  ('brand-peugeot', 'peugeot', 'PEUGEOT', 'France', 1, 12),
  ('brand-renault', 'renault', 'RENAULT', 'France', 1, 13),
  ('brand-seat', 'seat', 'SEAT', 'Spain', 1, 14),
  ('brand-chevrolet', 'chevrolet', 'CHEVROLET', 'USA', 1, 15),
  ('brand-vw', 'volkswagen', 'VOLKSWAGEN', 'Germany', 1, 16)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- 3. Populate spare_parts tracking table
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

INSERT INTO spare_parts (reference, vehicle, position, description, price_dzd, supplier) VALUES
('PADO', 'Fiat Doblo (2021)', 'AV', 'PARCHOC AVANT FIAT DOBLO 2021', 14500, 'CH'),
('PAD-DUST08', 'Dacia Duster (2008)', 'AV', 'PARCHOC AVANT DACIA DUSTER 2008', 9500, 'CH'),
('PAD-SAN09', 'Dacia Sandero (2009-2011)', 'AV', 'PARCHOC AVANT DACIA SANDERO 2009-2011', 9500, 'CH'),
('PAD-PEJ301-CP', 'Peugeot 301', 'AV', 'PARCHOC AVANT PEUGEOT 301 COMPLET', 15500, 'CH'),
('PAD-PEJ301-NR', 'Peugeot 301', 'AV', 'PARCHOC AVANT PEUGEOT 301 NOIR', 7500, 'DEGA'),
('P1-301-17', 'Peugeot 301 (2017+)', 'AV', 'PARCHOC AVANT PEUGEOT 301-17 NOIR', 17500, 'PULO TAWAN'),
('P2-PAD-DUST', 'Dacia Duster (2018-2021)', 'AV', 'PARCHOC AVANT DACIA DUSTER 2018-2021', 17500, 'PULO'),
('PAD-REN-EXP85', 'Renault Express (1985-1992)', 'AV', 'PARCHOC AVANT RENAULT EXPRESS 1985-1992', 12500, 'CH'),
('PAD-REN-CLIO96', 'Renault Clio (1996)', 'AV', 'PARCHOC AVANT RENAULT CLIO 1996', 10500, 'ARGENTINE'),
('P31-17902', 'Seat Ibiza (2012)', 'AV', 'PARCHOC AVANT SEAT IBIZA 2012 APPRET', 17500, 'CM'),
('P02-3308', 'Chevrolet Sail (2010)', 'AV', 'PARCHOC AVANT CHEVROLET SAIL 2010', 8500, 'CH'),
('PASET', 'Dacia Sandero Stepway', 'AV', 'PARCHOC AVANT DACIA SANDERO STEPWAY NOIR', 13500, 'CH'),
('PACH208', 'Peugeot 208 (2012)', 'AV', 'PARCHOC AVANT PEUGEOT 208-12 NOIR', 9500, 'CM'),
('P120515Q', 'Peugeot 208 (2015)', 'AV', 'PARCHOC AVANT PEUGEOT 208-15 NOIR', 16500, 'PULO'),
('P1-30813AS', 'Peugeot 308 (2013)', 'AV', 'PARCHOC AVANT PEUGEOT 308 13 ACTIVE APPRET', 17500, 'PULO'),
('A00A807', 'VW Caddy (2010-2015)', 'AV', 'PARCHOC AVANT VOLKSWAGEN CADDY 10-15 SANS GRILLE', 14500, 'TURK'),
('W0507CD', 'VW Caddy (2004-2010)', 'AV', 'PARCHOC AVANT VOLKSWAGEN CADDY COMMERCIAL 04-10', 12500, 'COMMERCIAL')
ON CONFLICT (reference) DO UPDATE SET
  price_dzd = EXCLUDED.price_dzd,
  description = EXCLUDED.description,
  vehicle = EXCLUDED.vehicle,
  supplier = EXCLUDED.supplier;

-- 4. Insert into products
INSERT INTO products (
  id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, rating, description_ar, description_fr, featured_home, is_active
) VALUES
('p-PADO', 'KAS-PADO', 'PADO', 'مصد أمامي (بارشوك) - فيات دوبلو 2021', 'PARCHOC AVANT FIAT DOBLO 2021', 'cat-pare-chocs', 'brand-fiat', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي أصلي مطابق للمواصفات لسيارة فيات دوبلو (2021) بجودة عالية ومقاومة للصدمات.', 'PARCHOC AVANT FIAT DOBLO 2021 - Qualité supérieure conforme aux normes constructeur.', 1, 1),

('p-PAD-DUST08', 'KAS-PAD-DUST08', 'PAD-DUST08', 'مصد أمامي (بارشوك) - داسيا دوستر 2008', 'PARCHOC AVANT DACIA DUSTER 2008', 'cat-pare-chocs', 'brand-dacia', 'كمية محدودة', 5.0, 'مصد وصدام أمامي لسيارة داسيا دوستر (2008) بجودة عالية وتركيب دقيق.', 'PARCHOC AVANT DACIA DUSTER 2008 - Ajustement parfait et haute résistance.', 0, 1),

('p-PAD-SAN09', 'KAS-PAD-SAN09', 'PAD-SAN09', 'مصد أمامي (بارشوك) - داسيا سانديرو 2009-2011', 'PARCHOC AVANT DACIA SANDERO 2009-2011', 'cat-pare-chocs', 'brand-dacia', 'كمية محدودة', 5.0, 'مصد وصدام أمامي داسيا سانديرو (2009-2011) متين وعالي الجودة.', 'PARCHOC AVANT DACIA SANDERO 2009-2011.', 0, 1),

('p-PAD-PEJ301-CP', 'KAS-PAD-PEJ301-CP', 'PAD-PEJ301-CP', 'مصد أمامي (بارشوك) كامل - بيجو 301', 'PARCHOC AVANT PEUGEOT 301 COMPLET', 'cat-pare-chocs', 'brand-peugeot', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي كامل لسيارة بيجو 301 متين ومقاوم.', 'PARCHOC AVANT PEUGEOT 301 COMPLET - Ensemble complet prêt à monter.', 1, 1),

('p-PAD-PEJ301-NR', 'KAS-PAD-PEJ301-NR', 'PAD-PEJ301-NR', 'مصد أمامي (بارشوك) أسود - بيجو 301', 'PARCHOC AVANT PEUGEOT 301 NOIR', 'cat-pare-chocs', 'brand-peugeot', 'كمية محدودة', 5.0, 'مصد وصدام أمامي أسود لسيارة بيجو 301 جودة DEGA.', 'PARCHOC AVANT PEUGEOT 301 NOIR DEGA.', 0, 1),

('p-P1-301-17', 'KAS-P1-301-17', 'P1-301-17', 'مصد أمامي (بارشوك) أسود - بيجو 301 (2017+)', 'PARCHOC AVANT PEUGEOT 301-17 NOIR', 'cat-pare-chocs', 'brand-peugeot', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي أسود بيجو 301 مرحلة ثانية 2017+ صناعة تايوان PULO.', 'PARCHOC AVANT PEUGEOT 301-17 NOIR PULO TAIWAN.', 1, 1),

('p-P2-PAD-DUST', 'KAS-P2-PAD-DUST', 'P2-PAD-DUST', 'مصد أمامي (بارشوك) - داسيا دوستر 2018-2021', 'PARCHOC AVANT DACIA DUSTER 2018-2021', 'cat-pare-chocs', 'brand-dacia', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي داسيا دوستر الجيل الثاني (2018-2021) PULO عالي الجودة.', 'PARCHOC AVANT DACIA DUSTER 2018-2021 PULO.', 1, 1),

('p-PAD-REN-EXP85', 'KAS-PAD-REN-EXP85', 'PAD-REN-EXP85', 'مصد أمامي (بارشوك) - رينو إكسبرس 1985-1992', 'PARCHOC AVANT RENAULT EXPRESS 1985-1992', 'cat-pare-chocs', 'brand-renault', 'كمية محدودة', 5.0, 'مصد وصدام أمامي رينو إكسبرس كلاسيك (1985-1992) متين.', 'PARCHOC AVANT RENAULT EXPRESS 1985-1992.', 0, 1),

('p-PAD-REN-CLIO96', 'KAS-PAD-REN-CLIO96', 'PAD-REN-CLIO96', 'مصد أمامي (بارشوك) - رينو كليو 1996', 'PARCHOC AVANT RENAULT CLIO 1996', 'cat-pare-chocs', 'brand-renault', 'كمية محدودة', 5.0, 'مصد وصدام أمامي رينو كليو 1 كلاسيك (1996) جودة الأرجنتين.', 'PARCHOC AVANT RENAULT CLIO 1996 ARGENTINE.', 0, 1),

('p-P31-17902', 'KAS-P31-17902', 'P31-17902', 'مصد أمامي (بارشوك) مطلي أساس (Apprêt) - سيات إيبيزا 2012', 'PARCHOC AVANT SEAT IBIZA 2012 APPRET', 'cat-pare-chocs', 'brand-seat', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي جاهز للصباغة سيات إيبيزا (2012) جودة CM.', 'PARCHOC AVANT SEAT IBIZA 2012 APPRET CM.', 1, 1),

('p-P02-3308', 'KAS-P02-3308', 'P02-3308', 'مصد أمامي (بارشوك) - شيفروليه سايل 2010', 'PARCHOC AVANT CHEVROLET SAIL 2010', 'cat-pare-chocs', 'brand-chevrolet', 'كمية محدودة', 5.0, 'مصد وصدام أمامي شيفروليه سايل (2010) عالي المتانة.', 'PARCHOC AVANT CHEVROLET SAIL 2010.', 0, 1),

('p-PASET', 'KAS-PASET', 'PASET', 'مصد أمامي (بارشوك) أسود - داسيا سانديرو ستيبواي', 'PARCHOC AVANT DACIA SANDERO STEPWAY NOIR', 'cat-pare-chocs', 'brand-dacia', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي أسود داسيا سانديرو ستيبواي قوي ومقاوم.', 'PARCHOC AVANT DACIA SANDERO STEPWAY NOIR.', 1, 1),

('p-PACH208', 'KAS-PACH208', 'PACH208', 'مصد أمامي (بارشوك) أسود - بيجو 208 (2012)', 'PARCHOC AVANT PEUGEOT 208-12 NOIR', 'cat-pare-chocs', 'brand-peugeot', 'كمية محدودة', 5.0, 'مصد وصدام أمامي أسود بيجو 208 (2012) جودة CM.', 'PARCHOC AVANT PEUGEOT 208-12 NOIR CM.', 0, 1),

('p-P120515Q', 'KAS-P120515Q', 'P120515Q', 'مصد أمامي (بارشوك) أسود - بيجو 208 (2015)', 'PARCHOC AVANT PEUGEOT 208-15 NOIR', 'cat-pare-chocs', 'brand-peugeot', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي أسود بيجو 208 فيس ليفت (2015) ماركة PULO.', 'PARCHOC AVANT PEUGEOT 208-15 NOIR PULO.', 1, 1),

('p-P1-30813AS', 'KAS-P1-30813AS', 'P1-30813AS', 'مصد أمامي (بارشوك) أكتيف مطلي أساس - بيجو 308 (2013)', 'PARCHOC AVANT PEUGEOT 308 13 ACTIVE APPRET', 'cat-pare-chocs', 'brand-peugeot', 'الأكثر طلباً', 5.0, 'مصد وصدام أمامي بيجو 308 أكتيف (2013) جاهز للصباغة PULO.', 'PARCHOC AVANT PEUGEOT 308 13 ACTIVE APPRET PULO.', 1, 1),

('p-A00A807', 'KAS-A00A807', 'A00A807', 'مصد أمامي (بارشوك) بدون شبك - فولكسفاغن كادي 2010-2015', 'PARCHOC AVANT VOLKSWAGEN CADDY 10-15 SANS GRILLE', 'cat-pare-chocs', 'brand-vw', 'كمية محدودة', 5.0, 'مصد وصدام أمامي فولكسفاغن كادي (2010-2015) بدون شبك جودة تركية.', 'PARCHOC AVANT VOLKSWAGEN CADDY 10-15 SANS GRILLE TURK.', 0, 1),

('p-W0507CD', 'KAS-W0507CD', 'W0507CD', 'مصد أمامي (بارشوك) تجاري - فولكسفاغن كادي 2004-2010', 'PARCHOC AVANT VOLKSWAGEN CADDY COMMERCIAL 04-10', 'cat-pare-chocs', 'brand-vw', 'كمية محدودة', 5.0, 'مصد وصدام أمامي كادي تجاري رمادي/أسود (2004-2010).', 'PARCHOC AVANT VOLKSWAGEN CADDY COMMERCIAL 04-10.', 0, 1)

ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  base_part_number = EXCLUDED.base_part_number,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  badge = EXCLUDED.badge,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  featured_home = EXCLUDED.featured_home,
  is_active = EXCLUDED.is_active;

-- 5. Insert into product_variants
INSERT INTO product_variants (
  id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status
) VALUES
('var-PADO', 'p-PADO', 'KAS-PADO-V1', 'PADO', 'مصد أمامي فيات دوبلو 2021', 'PARCHOC AVANT FIAT DOBLO 2021', 14500, 16500, 15, 'in_stock'),
('var-PAD-DUST08', 'p-PAD-DUST08', 'KAS-PAD-DUST08-V1', 'PAD-DUST08', 'مصد أمامي داسيا دوستر 2008', 'PARCHOC AVANT DACIA DUSTER 2008', 9500, 11500, 8, 'in_stock'),
('var-PAD-SAN09', 'p-PAD-SAN09', 'KAS-PAD-SAN09-V1', 'PAD-SAN09', 'مصد أمامي داسيا سانديرو 2009-2011', 'PARCHOC AVANT DACIA SANDERO 2009-2011', 9500, 11500, 8, 'in_stock'),
('var-PAD-PEJ301-CP', 'p-PAD-PEJ301-CP', 'KAS-PAD-PEJ301-CP-V1', 'PAD-PEJ301-CP', 'مصد أمامي كامل بيجو 301', 'PARCHOC AVANT PEUGEOT 301 COMPLET', 15500, 18000, 12, 'in_stock'),
('var-PAD-PEJ301-NR', 'p-PAD-PEJ301-NR', 'KAS-PAD-PEJ301-NR-V1', 'PAD-PEJ301-NR', 'مصد أمامي أسود بيجو 301', 'PARCHOC AVANT PEUGEOT 301 NOIR', 7500, 9500, 6, 'in_stock'),
('var-P1-301-17', 'p-P1-301-17', 'KAS-P1-301-17-V1', 'P1-301-17', 'مصد أمامي أسود بيجو 301-17', 'PARCHOC AVANT PEUGEOT 301-17 NOIR', 17500, 20000, 14, 'in_stock'),
('var-P2-PAD-DUST', 'p-P2-PAD-DUST', 'KAS-P2-PAD-DUST-V1', 'P2-PAD-DUST', 'مصد أمامي داسيا دوستر 2018-2021', 'PARCHOC AVANT DACIA DUSTER 2018-2021', 17500, 20000, 10, 'in_stock'),
('var-PAD-REN-EXP85', 'p-PAD-REN-EXP85', 'KAS-PAD-REN-EXP85-V1', 'PAD-REN-EXP85', 'مصد أمامي رينو إكسبرس 1985-1992', 'PARCHOC AVANT RENAULT EXPRESS 1985-1992', 12500, 14500, 5, 'in_stock'),
('var-PAD-REN-CLIO96', 'p-PAD-REN-CLIO96', 'KAS-PAD-REN-CLIO96-V1', 'PAD-REN-CLIO96', 'مصد أمامي رينو كليو 1996', 'PARCHOC AVANT RENAULT CLIO 1996', 10500, 12500, 7, 'in_stock'),
('var-P31-17902', 'p-P31-17902', 'KAS-P31-17902-V1', 'P31-17902', 'مصد أمامي سيات إيبيزا 2012', 'PARCHOC AVANT SEAT IBIZA 2012 APPRET', 17500, 20000, 9, 'in_stock'),
('var-P02-3308', 'p-P02-3308', 'KAS-P02-3308-V1', 'P02-3308', 'مصد أمامي شيفروليه سايل 2010', 'PARCHOC AVANT CHEVROLET SAIL 2010', 8500, 10500, 8, 'in_stock'),
('var-PASET', 'p-PASET', 'KAS-PASET-V1', 'PASET', 'مصد أمامي داسيا سانديرو ستيبواي', 'PARCHOC AVANT DACIA SANDERO STEPWAY NOIR', 13500, 15500, 11, 'in_stock'),
('var-PACH208', 'p-PACH208', 'KAS-PACH208-V1', 'PACH208', 'مصد أمامي أسود بيجو 208-12', 'PARCHOC AVANT PEUGEOT 208-12 NOIR', 9500, 11500, 7, 'in_stock'),
('var-P120515Q', 'p-P120515Q', 'KAS-P120515Q-V1', 'P120515Q', 'مصد أمامي أسود بيجو 208-15', 'PARCHOC AVANT PEUGEOT 208-15 NOIR', 16500, 19000, 12, 'in_stock'),
('var-P1-30813AS', 'p-P1-30813AS', 'KAS-P1-30813AS-V1', 'P1-30813AS', 'مصد أمامي بيجو 308-13 أكتيف', 'PARCHOC AVANT PEUGEOT 308 13 ACTIVE APPRET', 17500, 20000, 10, 'in_stock'),
('var-A00A807', 'p-A00A807', 'KAS-A00A807-V1', 'A00A807', 'مصد أمامي كادي 2010-2015 بدون شبك', 'PARCHOC AVANT VOLKSWAGEN CADDY 10-15 SANS GRILLE', 14500, 17000, 6, 'in_stock'),
('var-W0507CD', 'p-W0507CD', 'KAS-W0507CD-V1', 'W0507CD', 'مصد أمامي كادي تجاري 2004-2010', 'PARCHOC AVANT VOLKSWAGEN CADDY COMMERCIAL 04-10', 12500, 14500, 8, 'in_stock')
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  stock_quantity = EXCLUDED.stock_quantity,
  stock_status = EXCLUDED.stock_status,
  label_ar = EXCLUDED.label_ar,
  label_fr = EXCLUDED.label_fr;

-- 6. Insert Product Images
INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
VALUES
('img-PADO', 'p-PADO', '/img/parts/bumper-front.jpg', 1, 0),
('img-PAD-DUST08', 'p-PAD-DUST08', '/img/parts/bumper-front.jpg', 1, 0),
('img-PAD-SAN09', 'p-PAD-SAN09', '/img/parts/bumper-front.jpg', 1, 0),
('img-PAD-PEJ301-CP', 'p-PAD-PEJ301-CP', '/img/parts/bumper-peugeot-301.jpg', 1, 0),
('img-PAD-PEJ301-NR', 'p-PAD-PEJ301-NR', '/img/parts/bumper-peugeot-301.jpg', 1, 0),
('img-P1-301-17', 'p-P1-301-17', '/img/parts/bumper-peugeot-301.jpg', 1, 0),
('img-P2-PAD-DUST', 'p-P2-PAD-DUST', '/img/parts/bumper-front.jpg', 1, 0),
('img-PAD-REN-EXP85', 'p-PAD-REN-EXP85', '/img/parts/bumper-front.jpg', 1, 0),
('img-PAD-REN-CLIO96', 'p-PAD-REN-CLIO96', '/img/parts/bumper-front.jpg', 1, 0),
('img-P31-17902', 'p-P31-17902', '/img/parts/bumper-front.jpg', 1, 0),
('img-P02-3308', 'p-P02-3308', '/img/parts/bumper-front.jpg', 1, 0),
('img-PASET', 'p-PASET', '/img/parts/bumper-front.jpg', 1, 0),
('img-PACH208', 'p-PACH208', '/img/parts/bumper-front.jpg', 1, 0),
('img-P120515Q', 'p-P120515Q', '/img/parts/bumper-front.jpg', 1, 0),
('img-P1-30813AS', 'p-P1-30813AS', '/img/parts/bumper-front.jpg', 1, 0),
('img-A00A807', 'p-A00A807', '/img/parts/bumper-front.jpg', 1, 0),
('img-W0507CD', 'p-W0507CD', '/img/parts/bumper-front.jpg', 1, 0)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url;

