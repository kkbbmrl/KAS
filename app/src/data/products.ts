export type StockStatus = 'متوفر' | 'كمية محدودة' | 'غير متوفر'

export interface ProductVariant {
  id: string
  /** e.g. "بيجو 208 — 1.6 HDI" */
  label: string
  /** Matching compat strings for this variant */
  compat?: string[]
  price?: number
  oldPrice?: number
  stock: StockStatus
  partNumber?: string
  image?: string
  /** Extra detail rows shown when this variant is selected */
  extraSpecs?: { label: string; value: string }[]
}

/**
 * A catalogue product.
 *
 * Always sourced from the owner's database via GET /api/v1/products (see
 * server/routes/catalog.ts) and managed in the Admin Dashboard. There is
 * deliberately no bundled product data in this file — shipping sample parts
 * would show customers stock the owner never listed.
 */
export interface Product {
  /** UUID string from the database */
  id: number | string
  sku?: string
  name: string
  nameFr?: string
  brand: string
  partNumber: string
  category: string
  compat: string[]
  price: number
  oldPrice?: number
  stock: StockStatus
  image: string
  flip?: boolean
  badge?: string
  rating: number
  description: string
  specs: { label: string; value: string }[]
  aliases?: string[]
  featuredHome?: boolean
  variants?: ProductVariant[]
}

export interface FeaturedCategory {
  fr: string
  name: string
  category: string
  image: string
  accent: string
  badge?: string
  desc: string
  priceFrom: number
}

/** Category taxonomy — reference data, also seeded into the `categories` table. */
export const CATEGORIES: { name: string; fr: string; icon: string; available: boolean; count?: number }[] = [
  { name: 'المشعاع', fr: 'Radiateur', icon: 'Snowflake', available: true },
  { name: 'زجاج المصباح', fr: 'Verre de phare', icon: 'Scan', available: true },
  { name: 'غطاء الغبار', fr: 'Cache poussière', icon: 'Shield', available: true },
  { name: 'المروحة', fr: 'Ventilateur', icon: 'Fan', available: true },
  { name: 'المصباح الأمامي', fr: 'Phare', icon: 'Lightbulb', available: true },
  { name: 'ماسحة الزجاج', fr: 'Essuie-glace', icon: 'Wind', available: true },
  { name: 'بيرسو', fr: 'Perceau', icon: 'Box', available: true },
  { name: 'سيرسو', fr: 'Cerceau', icon: 'CircleDashed', available: true },
  { name: 'الترافرس', fr: 'Traverse', icon: 'Minus', available: true },
  { name: 'حامل الصدام', fr: 'Support pare-chocs', icon: 'Frame', available: true },
  { name: 'الضوء الخلفي', fr: 'Feu arrière', icon: 'Lamp', available: true },
  { name: 'الصدام', fr: 'Pare-chocs', icon: 'RectangleHorizontal', available: true },
  { name: 'مقبض الباب', fr: 'Poignée de porte', icon: 'DoorOpen', available: true },
  { name: 'الغطاء الأمامي', fr: 'Capot', icon: 'PanelTop', available: true },
  { name: 'الآرما تور', fr: 'Armature', icon: 'Grid3x3', available: true },
  { name: 'فلاتر الزيت', fr: 'Filtre à huile', icon: 'Droplet', available: true },
  { name: 'فلاتر الهواء', fr: 'Filtre à air', icon: 'Wind', available: true },
  { name: 'أقراص الفرامل', fr: 'Disques de frein', icon: 'Disc3', available: true },
  { name: 'بطانات الفرامل', fr: 'Plaquettes de frein', icon: 'Layers', available: true },
  { name: 'المساعدات', fr: 'Amortisseurs', icon: 'MoveVertical', available: false },
  { name: 'البطاريات', fr: 'Batteries', icon: 'BatteryCharging', available: false },
  { name: 'شمعات الإشعال', fr: 'Bougies', icon: 'Zap', available: false },
]

/** Vehicle taxonomy — reference data, also seeded into vehicle_makes/vehicle_models. */
export const CAR_BRANDS: Record<string, string[]> = {
  'تويوتا': ['كورولا', 'ياريس', 'كامري', 'هيلوكس', 'راف 4'],
  'رينو': ['كليو 4', 'كليو 5', 'سيمبول', 'ميغان 4', 'داستر', 'كابتور'],
  'بيجو': ['208', '301', '2008', '308', '3008', '508'],
  'فولكسفاغن': ['غولف 7', 'غولف 8', 'بولو', 'باسات', 'تيجوان', 'كادي'],
  'داسيا': ['لوغان', 'سانديرو', 'داستر', 'ستيبواي'],
  'هيونداي': ['أكسنت', 'إلنترا', 'i20', 'i30', 'توسان', 'كريتا'],
  'كيا': ['ريو', 'سيراتو', 'بيكانتو', 'سبورتاج', 'سيلتوس'],
  'مرسيدس': ['Class A', 'Class C', 'Class E', 'GLA', 'GLC'],
  'BMW': ['الفئة 1', 'الفئة 3', 'الفئة 5', 'X1', 'X3'],
  'نيسان': ['صني', 'ميكرا', 'قشقاي', 'جوك', 'باترول'],
  'سيات': ['ليون', 'إبيزا', 'أرونا', 'أتيكا'],
  'سكودا': ['أوكتافيا', 'فابيا', 'سوبرب'],
  'فورد': ['فييستا', 'فوكس', 'إيكوسبورت', 'رينجر'],
  'سيتروين': ['C3', 'C-Elysée', 'C4', 'برلينغو'],
}

export interface VehicleSearch {
  brand: string
  model: string
  query: string
  inStockOnly?: boolean
}

const VEHICLE_BRAND_ALIASES: Record<string, string[]> = {
  peugeot: ['peugeot', 'بيجو'],
  'بيجو': ['بيجو', 'peugeot'],
  renault: ['renault', 'رينو'],
  'رينو': ['رينو', 'renault'],
  toyota: ['toyota', 'تويوتا'],
  'تويوتا': ['تويوتا', 'toyota'],
  hyundai: ['hyundai', 'هيونداي'],
  'هيونداي': ['هيونداي', 'hyundai'],
  kia: ['kia', 'كيا'],
  'كيا': ['كيا', 'kia'],
  volkswagen: ['volkswagen', 'فولكسفاغن', 'فولكس فاجن', 'vw'],
  'فولكسفاغن': ['فولكسفاغن', 'فولكس فاجن', 'volkswagen', 'vw'],
  dacia: ['dacia', 'داسيا'],
  'داسيا': ['داسيا', 'dacia'],
  citroen: ['citroen', 'سيتروين'],
  'سيتروين': ['سيتروين', 'citroen'],
  seat: ['seat', 'سيات'],
  'سيات': ['سيات', 'seat'],
  skoda: ['skoda', 'سكودا'],
  'سكودا': ['سكودا', 'skoda'],
  nissan: ['nissan', 'نيسان'],
  'نيسان': ['نيسان', 'nissan'],
  ford: ['ford', 'فورد'],
  'فورد': ['فورد', 'ford'],
  mercedes: ['mercedes', 'مرسيدس', 'benz'],
  'مرسيدس': ['مرسيدس', 'mercedes', 'benz'],
  bmw: ['bmw', 'بي أم دبليو', 'بي ام دبليو'],
  'بي أم دبليو': ['بي أم دبليو', 'بي ام دبليو', 'bmw'],
  audi: ['audi', 'أودي', 'اوزي'],
  'أودي': ['أودي', 'audi'],
  // Common models aliases
  'كورولا': ['كورولا', 'corolla'],
  'ياريس': ['ياريس', 'yaris'],
  'كامري': ['كامري', 'camry'],
  'هيلوكس': ['هيلوكس', 'هايلوكس', 'hilux'],
  'راف 4': ['راف 4', 'راف4', 'rav4', 'rav 4'],
  'كليو 4': ['كليو 4', 'كليو4', 'clio 4', 'clio4', 'كليو', 'clio'],
  'كليو 5': ['كليو 5', 'كليو5', 'clio 5', 'clio5', 'كليو', 'clio'],
  'سيمبول': ['سيمبول', 'symbole', 'symbol'],
  'ميغان 4': ['ميغان 4', 'ميجان 4', 'megane 4', 'ميغان', 'ميجان', 'megane'],
  'داستر': ['داستر', 'duster'],
  'كابتور': ['كابتور', 'captur'],
  '208': ['208'],
  '301': ['301'],
  '2008': ['2008'],
  '308': ['308'],
  '3008': ['3008'],
  '508': ['508'],
  'غولف 7': ['غولف 7', 'غولف7', 'جولف 7', 'golf 7', 'golf7', 'غولف', 'golf'],
  'غولف 8': ['غولف 8', 'غولف8', 'جولف 8', 'golf 8', 'golf8', 'غولف', 'golf'],
  'بولو': ['بولو', 'polo'],
  'باسات': ['باسات', 'passat'],
  'تيجوان': ['تيجوان', 'tiguan'],
  'كادي': ['كادي', 'caddy'],
  'لوغان': ['لوغان', 'لوجان', 'logan'],
  'سانديرو': ['سانديرو', 'sandero'],
  'ستيبواي': ['ستيبواي', 'stepway'],
  'أكسنت': ['أكسنت', 'اكسنت', 'accent'],
  'إلنترا': ['إلنترا', 'النترا', 'elantra'],
  'i20': ['i20', 'i 20'],
  'i30': ['i30', 'i 30'],
  'توسان': ['توسان', 'tucson'],
  'كريتا': ['كريتا', 'creta'],
  'ريو': ['ريو', 'rio'],
  'سيراتو': ['سيراتو', 'cerato'],
  'بيكانتو': ['بيكانتو', 'picanto'],
  'سبورتاج': ['سبورتاج', 'sportage'],
  'سيلتوس': ['سيلتوس', 'seltos'],
  'Class A': ['class a', 'classe a', 'الفئة a'],
  'Class C': ['class c', 'classe c', 'الفئة c'],
  'Class E': ['class e', 'classe e', 'الفئة e'],
  'GLA': ['gla'],
  'GLC': ['glc'],
  'الفئة 1': ['الفئة 1', 'serie 1', 'series 1', '1 series'],
  'الفئة 3': ['الفئة 3', 'serie 3', 'series 3', '3 series'],
  'الفئة 5': ['الفئة 5', 'serie 5', 'series 5', '5 series'],
  'X1': ['x1'],
  'X3': ['x3'],
  'صني': ['صني', 'sunny'],
  'ميكرا': ['ميكرا', 'micra'],
  'قشقاي': ['قشقاي', 'qashqai'],
  'جوك': ['جوك', 'juke'],
  'باترول': ['باترول', 'patrol'],
  'ليون': ['ليون', 'leon'],
  'إبيزا': ['إبيزا', 'ابيزا', 'ibiza'],
  'أرونا': ['أرونا', 'ارونا', 'arona'],
  'أتيكا': ['أتيكا', 'اتيكا', 'ateca'],
  'أوكتافيا': ['أوكتافيا', 'اوكتافيا', 'octavia'],
  'فابيا': ['فابيا', 'fabia'],
  'سوبرب': ['سوبرب', 'superb'],
  'فييستا': ['فييستا', 'fiesta'],
  'فوكس': ['فوكس', 'focus'],
  'إيكوسبورت': ['إيكوسبورت', 'ecosport'],
  'رينجر': ['رينجر', 'ranger'],
  'C3': ['c3', 'c 3'],
  'C-Elysée': ['c-elysee', 'c elysee', 'c-elysée', 'c elysee', 'elysee', 'إليزيه', 'اليزيه'],
  'C4': ['c4', 'c 4'],
  'برلينغو': ['برلينغو', 'berlingo'],
}

// Codepoint escapes, not literal marks: combining characters are invisible in an
// editor and trivially corrupted by tooling.
const COMBINING_DIACRITICS = /[̀-ͯ]/g          // French accents post-NFKD
const ARABIC_TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g
const ARABIC_TATWEEL = /ـ/g

/**
 * Folds Arabic and French text into a comparable form: Arabic-Indic digits →
 * Latin, tashkeel and tatweel stripped, French accents removed, punctuation
 * collapsed. Lets "Radiateur", "radiateur", "مِشعاع" and "مشعاع" all match.
 */
export function normalizeSearchText(value: string): string {
  if (!value) return ''

  const arabicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  }

  return value
    .replace(/[٠-٩]/g, (digit) => arabicDigits[digit] ?? digit)
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(ARABIC_TASHKEEL, '')
    .replace(ARABIC_TATWEEL, '')
    // Unify alef forms (أ إ آ ٱ → ا), taa marbuta (ة → ه) and yaa (ى → ي)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function getVehicleAliases(value: string): string[] {
  const raw = normalizeSearchText(value)
  if (!raw) return []

  const aliases = new Set<string>([raw])

  Object.entries(VEHICLE_BRAND_ALIASES).forEach(([key, variants]) => {
    const normalizedKey = normalizeSearchText(key)
    if (
      raw === normalizedKey ||
      raw.includes(normalizedKey) ||
      variants.some((variant) => raw.includes(normalizeSearchText(variant)))
    ) {
      variants.forEach((variant) => aliases.add(normalizeSearchText(variant)))
    }
  })

  return [...aliases].filter(Boolean)
}

export function productHaystack(p: Product): string {
  const parts: (string | undefined)[] = [
    p.name,
    p.nameFr,
    p.brand,
    p.sku,
    p.partNumber,
    p.category,
    p.badge,
    p.description,
    ...(p.aliases ?? []),
    ...(p.compat ?? []),
  ]

  if (p.specs) {
    p.specs.forEach((s) => {
      parts.push(s.label)
      parts.push(s.value)
    })
  }

  if (p.variants) {
    p.variants.forEach((v) => {
      parts.push(v.label)
      parts.push(v.partNumber)
      parts.push(v.image)
      if (v.extraSpecs) {
        v.extraSpecs.forEach((spec) => {
          parts.push(spec.label)
          parts.push(spec.value)
        })
      }
    })
  }

  return parts
    .filter(Boolean)
    .map((segment) => normalizeSearchText(String(segment)))
    .join(' ')
}

export function matchesVehicle(p: Product, brand: string, model: string): boolean {
  if (!brand && !model) return true

  const brandAliases = brand ? getVehicleAliases(brand) : []
  const modelAliases = model ? getVehicleAliases(model) : []

  // Collect all text that might contain vehicle info
  const textsToCheck: string[] = [
    ...(p.compat ?? []),
    p.name,
    p.nameFr ?? '',
    p.description ?? '',
    ...(p.aliases ?? []),
  ]

  // Add variants label and extraSpecs
  if (p.variants) {
    p.variants.forEach((v) => {
      textsToCheck.push(v.label)
      if (v.partNumber) textsToCheck.push(v.partNumber)
      if (v.extraSpecs) {
        v.extraSpecs.forEach((spec) => {
          textsToCheck.push(spec.label)
          textsToCheck.push(spec.value)
        })
      }
    })
  }

  const combinedText = textsToCheck.map(normalizeSearchText).join(' ')

  if (brand) {
    const brandMatches = brandAliases.length === 0 || brandAliases.some((alias) => combinedText.includes(alias))
    if (!brandMatches) return false
  }

  if (model) {
    const modelMatches = modelAliases.length === 0 || modelAliases.some((alias) => combinedText.includes(alias))
    if (!modelMatches) return false
  }

  return true
}

/**
 * Filters an already-fetched list of products in memory.
 *
 * The catalogue itself always comes from the API — this only refines what the
 * server returned, so Arabic normalisation and French accent folding keep
 * working where a raw SQL LIKE cannot.
 */
export function filterProducts(list: Product[], filter: VehicleSearch): Product[] {
  const q = normalizeSearchText(filter.query)
  return list.filter((p) => {
    const textOk = !q || productHaystack(p).includes(q)
    const vehicleOk = matchesVehicle(p, filter.brand, filter.model)
    const stockOk = !filter.inStockOnly || p.stock !== 'غير متوفر'
    return textOk && vehicleOk && stockOk
  })
}

/**
 * Format a price in the European/French style used in Algeria:
 * 12500 → "12 500 DA"
 */
export function formatPrice(n: number): string {
  // Coerce: NUMERIC columns arrive as strings from Postgres.
  const value = Number(n)
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('fr-FR', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' DA'
}

export const PHONE_DISPLAY = '0555 12 34 56'
export const PHONE_CALL = '+213555123456'
export const EMAIL = 'contact@khaledautospart.dz'
export const ADDRESS = 'شارع الاستقلال رقم 42، الجزائر العاصمة'
export const WORK_HOURS = 'السبت – الخميس: 8:30 – 18:00'
