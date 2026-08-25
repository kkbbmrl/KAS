import { randomUUID } from 'node:crypto'
import { query } from './db.js'
import { initDatabase } from './init.js'
import { ALGERIA_WILAYAS } from '../../src/data/wilayas.js'
import { CATEGORIES, CAR_BRANDS } from '../../src/data/products.js'

export async function seedDatabase() {
  await initDatabase()
  console.log('🌱 Seeding reference and catalog data...')

  // 1. Wilayas — real Algerian delivery zones and shipping fees
  console.log(`🇩🇿 Seeding ${ALGERIA_WILAYAS.length} Wilayas of Algeria...`)
  for (const w of ALGERIA_WILAYAS) {
    await query(
      `INSERT INTO algeria_wilayas (code, name_ar, name_fr, delivery_time_text, shipping_fee)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO UPDATE SET
         name_ar = EXCLUDED.name_ar,
         name_fr = EXCLUDED.name_fr,
         delivery_time_text = EXCLUDED.delivery_time_text,
         shipping_fee = EXCLUDED.shipping_fee`,
      [w.code, w.nameAr, w.nameFr, w.deliveryTime, w.shippingFee]
    )
  }

  // 2. Categories
  console.log(`📂 Seeding ${CATEGORIES.length} Categories...`)
  const categoryIdMap: Record<string, string> = {}
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    const slug = c.fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${i}`

    const existing = await query(`SELECT id FROM categories WHERE slug = $1`, [slug])
    let catId = existing.rows[0]?.id
    if (catId) {
      await query(
        `UPDATE categories SET name_ar = $1, name_fr = $2, icon_name = $3, is_available = $4, display_order = $5 WHERE id = $6`,
        [c.name, c.fr, c.icon, c.available ? 1 : 0, i, catId]
      )
    } else {
      catId = randomUUID()
      await query(
        `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [catId, slug, c.name, c.fr, c.icon, c.available ? 1 : 0, i]
      )
    }
    categoryIdMap[c.name] = catId
    categoryIdMap[c.fr] = catId
  }

  // 3. Brands
  console.log('🏷️ Seeding Auto Parts Brands...')
  const BRANDS_LIST = [
    { name: 'VALEO', origin: 'France', featured: 1 },
    { name: 'BOSCH', origin: 'Germany', featured: 1 },
    { name: 'HELLA', origin: 'Germany', featured: 1 },
    { name: 'DENSO', origin: 'Japan', featured: 1 },
    { name: 'MAHLE', origin: 'Germany', featured: 1 },
    { name: 'BREMBO', origin: 'Italy', featured: 1 },
    { name: 'FERODO', origin: 'UK', featured: 1 },
    { name: 'SKF', origin: 'Sweden', featured: 1 },
    { name: 'SNR', origin: 'France', featured: 1 },
    { name: 'INA', origin: 'Germany', featured: 1 },
    { name: 'GATES', origin: 'USA', featured: 1 },
    { name: 'CONTITECH', origin: 'Germany', featured: 1 },
    { name: 'NGK', origin: 'Japan', featured: 1 },
    { name: 'MANN-FILTER', origin: 'Germany', featured: 1 },
    { name: 'MAGNETI MARELLI', origin: 'Italy', featured: 1 },
  ]

  const brandIdMap: Record<string, string> = {}
  for (let i = 0; i < BRANDS_LIST.length; i++) {
    const b = BRANDS_LIST[i]
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await query(`SELECT id FROM brands WHERE slug = $1`, [slug])
    let bId = existing.rows[0]?.id
    if (!bId) {
      bId = randomUUID()
      await query(
        `INSERT INTO brands (id, slug, name, origin_country, is_featured, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bId, slug, b.name, b.origin, b.featured, i + 1]
      )
    }
    brandIdMap[b.name] = bId
  }

  // 4. Vehicle taxonomy — makes & models
  console.log('🚗 Seeding Vehicle Taxonomy...')
  const MAKE_METADATA: Record<string, { slug: string; fr: string; displayOrder: number }> = {
    'تويوتا': { slug: 'toyota', fr: 'Toyota', displayOrder: 1 },
    'رينو': { slug: 'renault', fr: 'Renault', displayOrder: 2 },
    'بيجو': { slug: 'peugeot', fr: 'Peugeot', displayOrder: 3 },
    'فولكسفاغن': { slug: 'volkswagen', fr: 'Volkswagen', displayOrder: 4 },
    'داسيا': { slug: 'dacia', fr: 'Dacia', displayOrder: 5 },
    'هيونداي': { slug: 'hyundai', fr: 'Hyundai', displayOrder: 6 },
    'كيا': { slug: 'kia', fr: 'Kia', displayOrder: 7 },
    'مرسيدس': { slug: 'mercedes', fr: 'Mercedes-Benz', displayOrder: 8 },
    'BMW': { slug: 'bmw', fr: 'BMW', displayOrder: 9 },
    'نيسان': { slug: 'nissan', fr: 'Nissan', displayOrder: 10 },
    'سيات': { slug: 'seat', fr: 'Seat', displayOrder: 11 },
    'سكودا': { slug: 'skoda', fr: 'Skoda', displayOrder: 12 },
    'فورد': { slug: 'ford', fr: 'Ford', displayOrder: 13 },
    'سيتروين': { slug: 'citroen', fr: 'Citroën', displayOrder: 14 },
  }

  const MODEL_SLUGS: Record<string, string> = {
    'كورولا': 'corolla', 'ياريس': 'yaris', 'كامري': 'camry', 'هيلوكس': 'hilux', 'راف 4': 'rav4',
    'كليو 4': 'clio-4', 'كليو 5': 'clio-5', 'سيمبول': 'symbol', 'ميغان 4': 'megane-4', 'داستر': 'duster', 'كابتور': 'captur',
    '208': '208', '301': '301', '2008': '2008', '308': '308', '3008': '3008', '508': '508',
    'غولف 7': 'golf-7', 'غولف 8': 'golf-8', 'بولو': 'polo', 'باسات': 'passat', 'تيجوان': 'tiguan', 'كادي': 'caddy',
    'لوغان': 'logan', 'سانديرو': 'sandero', 'ستيبواي': 'stepway',
    'أكسنت': 'accent', 'إلنترا': 'elantra', 'i20': 'i20', 'i30': 'i30', 'توسان': 'tucson', 'كريتا': 'creta',
    'ريو': 'rio', 'سيراتو': 'cerato', 'بيكانتو': 'picanto', 'سبورتاج': 'sportage', 'سيلتوس': 'seltos',
    'Class A': 'class-a', 'Class C': 'class-c', 'Class E': 'class-e', 'GLA': 'gla', 'GLC': 'glc',
    'الفئة 1': 'serie-1', 'الفئة 3': 'serie-3', 'الفئة 5': 'serie-5', 'X1': 'x1', 'X3': 'x3',
    'صني': 'sunny', 'ميكرا': 'micra', 'قشقاي': 'qashqai', 'جوك': 'juke', 'باترول': 'patrol',
    'ليون': 'leon', 'إبيزا': 'ibiza', 'أرونا': 'arona', 'أتيكا': 'ateca',
    'أوكتافيا': 'octavia', 'فابيا': 'fabia', 'سوبرب': 'superb',
    'فييستا': 'fiesta', 'فوكس': 'focus', 'إيكوسبورت': 'ecosport', 'رينجر': 'ranger',
    'C3': 'c3', 'C-Elysée': 'c-elysee', 'C4': 'c4', 'برلينغو': 'berlingo',
  }

  for (const [makeName, models] of Object.entries(CAR_BRANDS)) {
    const meta = MAKE_METADATA[makeName] || { slug: `make-${randomUUID().slice(0, 6)}`, fr: makeName, displayOrder: 99 }
    const existingMake = await query(`SELECT id FROM vehicle_makes WHERE slug = $1`, [meta.slug])
    let makeId = existingMake.rows[0]?.id
    if (!makeId) {
      makeId = randomUUID()
      await query(
        `INSERT INTO vehicle_makes (id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5)`,
        [makeId, meta.slug, makeName, meta.fr, meta.displayOrder]
      )
    }

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i]
      const modelClean = MODEL_SLUGS[modelName] || modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `m-${i + 1}`
      const modelSlug = `${meta.slug}-${modelClean}`
      const existingModel = await query(
        `SELECT id FROM vehicle_models WHERE make_id = $1 AND slug = $2`,
        [makeId, modelSlug]
      )
      if (existingModel.rows.length === 0) {
        await query(
          `INSERT INTO vehicle_models (id, make_id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), makeId, modelSlug, modelName, modelName, i + 1]
        )
      }
    }
  }

  // 5. Products — 19 authentic parts
  console.log('📦 Seeding Products Catalogue...')
  const checkProds = await query(`SELECT COUNT(*) AS count FROM products`)
  if (Number(checkProds.rows[0]?.count || 0) === 0) {
    const defaultCatId = Object.values(categoryIdMap)[0] || (await query(`SELECT id FROM categories LIMIT 1`)).rows[0]?.id
    const defaultBrandId = Object.values(brandIdMap)[0] || (await query(`SELECT id FROM brands LIMIT 1`)).rows[0]?.id

    const SAMPLE_PARTS = [
      { name: 'مشعاع تبريد المحرك (Radiateur)', nameFr: 'Radiateur de refroidissement moteur', brand: 'VALEO', cat: 'المشعاع', partNo: 'VAL-734321', price: 14500, oldPrice: 16800, badge: 'الأكثر مبيعاً', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/parts/radiator.jpg', desc: 'مشعاع تبريد محرك ألومنيوم فائق الجودة، مصمم لتحمل درجات الحرارة العالية وتوفير تبريد مثالي في أشد الظروف.' },
      { name: 'مصباح أمامي LED كامل (Phare)', nameFr: 'Projecteur principal Full LED', brand: 'HELLA', cat: 'المصباح الأمامي', partNo: 'HEL-1EX012', price: 28500, oldPrice: 32000, badge: 'تكنولوجيا متطورة', featured: 1, stock: 'in_stock', rating: 5.0, img: '/img/parts/headlight-led.jpg', desc: 'مصباح أمامي كامل بإضاءة LED ديناميكية فائقة الوضوح مع عدسة تركيز ومقاومة تامة للمياه والغبار.' },
      { name: 'غطاء المحرك الأمامي (Capot)', nameFr: 'Capot moteur avant métallique', brand: 'VALEO', cat: 'الغطاء الأمامي', partNo: 'CP-981204', price: 22000, oldPrice: 25500, badge: 'مطابق للأصل', featured: 1, stock: 'in_stock', rating: 4.8, img: '/img/parts/hood-capot.jpg', desc: 'غطاء محرك من الفولاذ المجلفن المعالج ضد الصدأ والتآكل، دقيق الأبعاد وسهل التركيب المباشر.' },
      { name: 'ترافرس أمامي سفلي (Traverse)', nameFr: 'Traverse avant inférieure', brand: 'BOSCH', cat: 'الترافرس', partNo: 'TRV-44219', price: 11500, oldPrice: 13000, badge: 'هيكل مقوى', featured: 1, stock: 'in_stock', rating: 4.7, img: '/img/parts/traverse-front.jpg', desc: 'ترافرس هيكل سفلي شديد المتانة لامتصاص الصدمات وتثبيت المشعاع وحامل الصدام بدقة تامة.' },
      { name: 'صدام أمامي مع فتحات شبك (Pare-chocs)', nameFr: 'Pare-chocs avant avec calandre', brand: 'VALEO', cat: 'الصدام', partNo: 'PC-208941', price: 18500, oldPrice: 21000, badge: 'جاهز للدهان', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/parts/bumper-front.jpg', desc: 'صدام أمامي مصنوع من مادة البوليمر المرنة المقاومة للكسر والحرارة، جاهز للطلاء المباشر.' },
      { name: 'مروحة تبريد المشعاع (Ventilateur)', nameFr: 'Ventilateur de refroidissement complet', brand: 'DENSO', cat: 'المروحة', partNo: 'DEN-DER210', price: 13200, oldPrice: 15000, badge: 'أداء هادئ', featured: 1, stock: 'in_stock', rating: 4.8, img: '/img/parts/radiator-fan.jpg', desc: 'مجموعة مروحة ومحرك كهربائي فائق الكفاءة لضمان تدفق الهواء الأمثل للمحرك والمكيف.' },
      { name: 'زجاج المصباح الأمامي (Verre de phare)', nameFr: 'Glace de phare polycarbonate', brand: 'HELLA', cat: 'زجاج المصباح', partNo: 'VP-882190', price: 4200, oldPrice: 5000, badge: 'مقاوم للاصفرار', featured: 1, stock: 'in_stock', rating: 4.7, img: '/img/parts/headlight-lens.jpg', desc: 'زجاج بديل للمصباح الأمامي من البولي كربونات الشفاف المعالج بطبقة حماية ضد الأشعة فوق البنفسجية.' },
      { name: 'غطاء غبار ممتص الصدمات (Cache poussière)', nameFr: 'Kit soufflet et butée amortisseur', brand: 'SKF', cat: 'غطاء الغبار', partNo: 'SKF-VKDP31', price: 3400, oldPrice: 4000, badge: 'حماية قصوى', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/parts/dust-cover-boot.jpg', desc: 'طقم غطاء غبار ومصدة مطاطية لحماية ممتصات الصدمات من الأتربة والرطوبة وإطالة عمرها الافتراضي.' },
      { name: 'مقبض باب خارجي (Poignée de porte)', nameFr: 'Poignée de porte extérieure', brand: 'MAGNETI MARELLI', cat: 'مقبض الباب', partNo: 'MM-PG771', price: 2900, oldPrice: 3500, badge: 'أصلي', featured: 1, stock: 'in_stock', rating: 4.6, img: '/img/parts/door-handle.jpg', desc: 'مقبض باب خارجي مريح وعالي التحمل مع آلية قفل سلسة ومطابقة تماماً لمواصفات المصنع.' },
      { name: 'ماسحات الزجاج الأمامي Silencio (Essuie-glace)', nameFr: 'Balais d essuie-glace plats Silencio', brand: 'VALEO', cat: 'ماسحة الزجاج', partNo: 'VAL-574678', price: 3800, oldPrice: 4500, badge: 'مسح صامت', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/parts/wiper-blades.jpg', desc: 'ماسحات زجاج مسطحة بتقنية المطاط المغلف بالغرافيت لمسح مثالي خالٍ من الخطوط والضجيج.' },
      { name: 'ضوء خلفي LED كامل (Feu arrière)', nameFr: 'Feu arrière complet LED fumé', brand: 'VALEO', cat: 'الضوء الخلفي', partNo: 'VAL-044819', price: 19800, oldPrice: 23000, badge: 'أناقة وأمان', featured: 1, stock: 'in_stock', rating: 5.0, img: '/img/parts/taillight-led.jpg', desc: 'ضوء خلفي عصري بإضاءة متناسقة وإشارات ديناميكية وعدسة بلورية حمراء نقية.' },
      { name: 'بيرسو الهيكل الأمامي (Berceau)', nameFr: 'Berceau moteur train avant', brand: 'BOSCH', cat: 'بيرسو', partNo: 'BRC-90112', price: 34000, oldPrice: 39000, badge: 'هيكل صلب', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/parts/berceau-front.jpg', desc: 'جسر تثبيت المحرك ومحور العجلات الأمامي، ملحوم آلياً ومفحوص لتحمل أعلى درجات الإجهاد.' },
      { name: 'سيرسو عجلة القيادة ونظام التعليق (Cerceau)', nameFr: 'Support de berceau et train', brand: 'SNR', cat: 'سيرسو', partNo: 'SNR-CR881', price: 8900, oldPrice: 10500, badge: 'توازن دقيق', featured: 1, stock: 'in_stock', rating: 4.8, img: '/img/parts/cerceau-reinforce.jpg', desc: 'حلقة تثبيت وتوجيه التعليق لضمان دقة التوجيه وتقليل الاهتزازات أثناء القيادة بسرعات عالية.' },
      { name: 'حامل الصدام الأمامي (Support pare-chocs)', nameFr: 'Guide et support pare-chocs', brand: 'VALEO', cat: 'حامل الصدام', partNo: 'SUP-10948', price: 2600, oldPrice: 3200, badge: 'تثبيت متين', featured: 1, stock: 'in_stock', rating: 4.7, img: '/img/parts/bumper-brackets.jpg', desc: 'دليل وحامل تثبيت الصدام بجانب الرفرف لضمان ثبات الصدام ومحاذاته الدقيقة مع الهيكل.' },
      { name: 'الآرماتور وهيكل التثبيت (Armature)', nameFr: 'Armature de face avant composite', brand: 'HELLA', cat: 'الآرما تور', partNo: 'ARM-55021', price: 16500, oldPrice: 19000, badge: 'مقاوم للصدمات', featured: 1, stock: 'in_stock', rating: 4.8, img: '/img/parts/armature-front.jpg', desc: 'واجهة أمامية مجمعة لحمل المشعاع والمصابيح وتثبيت القفل بجودة ومقاسات دقيقة للغاية.' },
      { name: 'فلتر زيت أصلي عالي الكفاءة (Filtre à huile)', nameFr: 'Filtre à huile moteur haute filtration', brand: 'MANN-FILTER', cat: 'فلاتر الزيت', partNo: 'HU-711/51z', price: 1800, oldPrice: 2200, badge: 'حماية المحرك', featured: 1, stock: 'in_stock', rating: 5.0, img: '/img/oil-filter.png', desc: 'فلتر زيت ورقي اصطناعي يحتجز أدق جزيئات الشوائب لضمان تدفق زيت نقي بنسبة 99.9%.' },
      { name: 'فلتر هواء المحرك الرياضي (Filtre à air)', nameFr: 'Filtre à air moteur débit optimisé', brand: 'BOSCH', cat: 'فلاتر الهواء', partNo: 'BOS-F026400', price: 2400, oldPrice: 2900, badge: 'أداء وقوة', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/air-filter.png', desc: 'فلتر هواء معالج يضمن تنفس المحرك بحرية مع حماية غرف الاحتراق من ذرات الغبار والرمال.' },
      { name: 'أقراص فرامل مهواة (Disques de frein)', nameFr: 'Jeu de disques de frein ventilés', brand: 'BREMBO', cat: 'أقراص الفرامل', partNo: 'BRM-09.A115', price: 13500, oldPrice: 15800, badge: 'قوة كبح قصوى', featured: 1, stock: 'in_stock', rating: 5.0, img: '/img/brake-disc.png', desc: 'زوج أقراص فرامل أمامية مهواة ومطلية بمادة مضادة للتآكل لتقليل مسافة التوقف ومنع الاهتزاز.' },
      { name: 'بطانات فرامل سيراميك (Plaquettes de frein)', nameFr: 'Plaquettes de frein avant céramique', brand: 'FERODO', cat: 'بطانات الفرامل', partNo: 'FDB-4210', price: 6200, oldPrice: 7500, badge: 'كبح ناعم وبدون غبار', featured: 1, stock: 'in_stock', rating: 4.9, img: '/img/brake-pads.png', desc: 'طقم بطانات فرامل عالية الأداء بمركب السيراميك الذي يمنع الصفير ويقلل من انبعاث الغبار الأسود.' },
    ]

    for (let i = 0; i < SAMPLE_PARTS.length; i++) {
      const p = SAMPLE_PARTS[i]
      const prodId = randomUUID()
      const sku = `KAS-${p.brand.slice(0, 3)}-${1000 + i}`
      const catId = categoryIdMap[p.cat] || defaultCatId
      const bId = brandIdMap[p.brand] || defaultBrandId

      await query(
        `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, rating, description_ar, description_fr, featured_home, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)`,
        [prodId, sku, p.partNo, p.name, p.nameFr, catId, bId, p.badge, p.rating, p.desc, p.nameFr, p.featured]
      )

      // Variant
      const varId = randomUUID()
      await query(
        `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)`,
        [varId, prodId, `${sku}-V1`, p.partNo, 'القطعة القياسية الأصلية', 'Pièce d origine standard', p.price, p.oldPrice, 25, p.stock]
      )

      // Image
      await query(
        `INSERT INTO product_images (id, product_id, image_url, is_primary)
         VALUES ($1, $2, $3, 1)`,
        [randomUUID(), prodId, p.img]
      )
    }
  }

  // 6. Populate vehicle compatibility links
  await seedPartCompatibility()

  // 7. System settings
  console.log('⚙️ Seeding System Settings...')
  const defaultSettings = [
    { key: 'store_name', value: 'Khaled Auto Spart', cat: 'general' },
    { key: 'store_phone', value: '0555 12 34 56', cat: 'general' },
    { key: 'store_email', value: 'contact@khaledautospart.dz', cat: 'general' },
    { key: 'store_address', value: 'شارع الاستقلال رقم 42، الجزائر العاصمة', cat: 'general' },
    { key: 'store_currency', value: 'DA', cat: 'general' },
    { key: 'default_courier', value: 'Yalidine Fast Logistics', cat: 'shipping' },
    { key: 'free_shipping_threshold', value: '15000', cat: 'shipping' },
    { key: 'low_stock_threshold', value: '5', cat: 'inventory' },
    { key: 'auto_reserve_stock', value: 'true', cat: 'orders' },
  ]

  for (const s of defaultSettings) {
    const existing = await query(`SELECT setting_key FROM system_settings WHERE setting_key = $1`, [s.key])
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category)
         VALUES ($1, $2, $3)`,
        [s.key, s.value, s.cat]
      )
    }
  }

  const { ensureAdminAccounts } = await import('./ensureAdmins.js')
  await ensureAdminAccounts()

  console.log('✅ All reference data, products, categories, vehicle compatibility, and admin accounts seeded.')
}

export async function seedPartCompatibility() {
  console.log('🚗 Linking products with vehicle make and model compatibility...')
  
  const makes = await query(`SELECT id, slug, name_ar AS "nameAr" FROM vehicle_makes`)
  const models = await query(`SELECT id, make_id AS "makeId", slug, name_ar AS "nameAr" FROM vehicle_models`)
  
  const modelLookup: Record<string, { makeId: string; modelId: string }> = {}
  for (const m of models.rows) {
    const mk = makes.rows.find((k: any) => k.id === m.makeId)
    if (mk) {
      modelLookup[`${mk.nameAr}::${m.nameAr}`] = { makeId: mk.id, modelId: m.id }
      modelLookup[`${mk.slug}::${m.slug}`] = { makeId: mk.id, modelId: m.id }
      modelLookup[m.nameAr] = { makeId: mk.id, modelId: m.id }
      modelLookup[m.slug] = { makeId: mk.id, modelId: m.id }
    }
  }

  const prods = await query(`SELECT id, name_ar AS name, category_id AS "categoryId" FROM products`)
  if (prods.rows.length === 0) return

  const POPULAR_MODELS = [
    { make: 'رينو', models: ['كليو 4', 'كليو 5', 'سيمبول', 'ميغان 4', 'داستر', 'كابتور'] },
    { make: 'بيجو', models: ['208', '301', '2008', '308', '3008'] },
    { make: 'فولكسفاغن', models: ['غولف 7', 'غولف 8', 'بولو', 'باسات', 'كادي'] },
    { make: 'داسيا', models: ['لوغان', 'سانديرو', 'ستيبواي', 'داستر'] },
    { make: 'هيونداي', models: ['أكسنت', 'إلنترا', 'i20', 'i30', 'توسان'] },
    { make: 'تويوتا', models: ['كورولا', 'ياريس', 'هيلوكس', 'راف 4'] },
    { make: 'كيا', models: ['ريو', 'سيراتو', 'بيكانتو', 'سبورتاج'] },
    { make: 'سيات', models: ['ليون', 'إبيزا', 'أرونا'] },
    { make: 'سيتروين', models: ['C3', 'C-Elysée', 'C4', 'برلينغو'] },
    { make: 'فورد', models: ['فييستا', 'فوكس'] },
    { make: 'مرسيدس', models: ['Class A', 'Class C', 'GLA'] },
    { make: 'BMW', models: ['الفئة 1', 'الفئة 3', 'X1'] },
    { make: 'نيسان', models: ['صني', 'ميكرا', 'قشقاي'] },
    { make: 'سكودا', models: ['أوكتافيا', 'فابيا'] }
  ]

  for (const prod of prods.rows) {
    for (const group of POPULAR_MODELS) {
      for (const modelName of group.models) {
        const entry = modelLookup[`${group.make}::${modelName}`] || modelLookup[modelName]
        if (entry) {
          const exists = await query(
            `SELECT id FROM part_compatibility WHERE product_id = $1 AND make_id = $2 AND model_id = $3`,
            [prod.id, entry.makeId, entry.modelId]
          )
          if (exists.rows.length === 0) {
            await query(
              `INSERT INTO part_compatibility (id, product_id, make_id, model_id) VALUES ($1, $2, $3, $4)`,
              [randomUUID(), prod.id, entry.makeId, entry.modelId]
            )
          }
        }
      }
    }
  }

  console.log('✅ Vehicle compatibility successfully linked for all products.')
}
