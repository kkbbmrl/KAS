import type { StockStatus, Product } from './products'

export interface AdFeature {
  icon: string
  title: string
  desc: string
}

export interface AdVariantChoice {
  id: string
  label: string
  partNumber?: string
  price: number
  oldPrice?: number
  stock: StockStatus
}

export interface CompatibleVehicle {
  make: string
  models: string[]
  years: string
  engine?: string
}

export interface AdReview {
  name: string
  city: string
  car: string
  rating: number
  date: string
  comment: string
  verified: boolean
}

export interface AdCampaignConfig {
  slug: string
  productId?: string | number
  productName: string
  productNameFr?: string
  brand: string
  brandLogo?: string
  partNumber: string
  sku?: string
  category: string
  badge?: string
  heroKicker: string
  heroTitle: string
  heroSubtitle: string
  heroBullets: string[]
  price: number
  oldPrice?: number
  savingsText?: string
  stock: StockStatus
  stockCountText?: string
  urgencyBadge?: string
  deliveryNote: string
  primaryImage: string
  galleryImages: string[]
  features: AdFeature[]
  compatibleVehicles: CompatibleVehicle[]
  specifications: { label: string; value: string }[]
  variants?: AdVariantChoice[]
  reviews?: AdReview[]
  faq: { q: string; a: string }[]
  customCtaText?: string
  whatsAppPrompt?: string
}

export const CAMPAIGN_PRESETS: AdCampaignConfig[] = [
  {
    slug: 'radiateur-peugeot-208',
    productId: 21,
    productName: 'مشعاع تبريد محرك أصلي فاليوفيكس',
    productNameFr: 'Radiateur Moteur Valeo Peugeot 208 / 301 / Citroën C3',
    brand: 'VALEO',
    partNumber: 'RAD-VALEO-8800',
    sku: 'VAL-RAD-208-OEM',
    category: 'المشعاع',
    badge: 'قطعة أصلية 100% — ضمان 24 شهراً',
    heroKicker: 'حل نهائي لمشكلة ارتفاع حرارة المحرك في الصيف',
    heroTitle: 'مشعاع تبريد محرك أصلي VALEO لسيارات بيجو وسيتروين',
    heroSubtitle: 'مطابق تماماً لمواصفات الوكالة مع تبريد مضاعف يتحمل درجات الحرارة العالية والطرقات الجزائرية الصعبة دون أي تسريب.',
    heroBullets: [
      'ألومنيوم معالج ضد الصدأ والتآكل مع خلايا تبريد عالية الكثافة',
      'تركيب مباشر Plug & Play بدون أي تعديل أو تلحيم',
      'ضمان استبدال رسمي لمدة 24 شهراً كاملاً ضد عيوب الصناعة',
      'توصيل سريع لـ 58 ولاية مع حق المعاينة والفحص قبل الدفع',
    ],
    price: 16500,
    oldPrice: 19500,
    savingsText: 'وفر 3 000 دج اليوم + توصيل سريع',
    stock: 'متوفر',
    stockCountText: 'متوفر حالياً في المخزن — شحن فوري',
    urgencyBadge: 'أكثر من 45 قطعة سُلمت هذا الشهر في الجزائر',
    deliveryNote: 'توصيل لباب منزلك لجميع الولايات (24–48 ساعة) والدفع عند الاستلام',
    primaryImage: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
    ],
    features: [
      {
        icon: 'ThermometerSnowflake',
        title: 'كفاءة تبريد قصوى',
        desc: 'أنابيب ألومنيوم ذات مسامية عالية تضمن خفض درجة حرارة سائل التبريد بنسبة تصل إلى 28% في ذروة الصيف.',
      },
      {
        icon: 'ShieldCheck',
        title: 'جودة أصلية OEM معتمدة',
        desc: 'مصنوع وفق المعايير الأوروبية الدقيقة لشركة VALEO لمنع التسريبات وتحمل الضغط المرتفع لدورة التبريد.',
      },
      {
        icon: 'Wrench',
        title: 'تركيب دقيق وسريع',
        desc: 'قواعد التثبيت ومنافذ خراطيم المياه مطابقة 100% للمقاسات الأصلية للسيارة دون أي فراغات.',
      },
      {
        icon: 'Truck',
        title: 'توصيل آمن لـ 58 ولاية',
        desc: 'تغليف مقوى ضد الصدمات وشحن سريع لباب بيتك مع فحص الصندوق قبل تسليم المبلغ لمندوب الشحن.',
      },
    ],
    compatibleVehicles: [
      { make: 'Peugeot', models: ['208 (Phase 1 & 2)', '301'], years: '2012 – 2020', engine: '1.2 VTi / 1.6 HDI / 1.6 VTi' },
      { make: 'Citroën', models: ['C3 II & III', 'C-Elysée'], years: '2012 – 2022', engine: '1.2 PureTech / 1.6 HDi' },
      { make: 'DS', models: ['DS3'], years: '2010 – 2016', engine: '1.6 e-HDi' },
    ],
    specifications: [
      { label: 'رقم القطعة الأصلي (OEM)', value: 'VALEO 734320 / 9673432080' },
      { label: 'الماركة والمصنّع', value: 'VALEO (France / European Standard)' },
      { label: 'مادة الصنع', value: 'ألومنيوم مقوى + خزانات بلاستيكية حرارية PA66' },
      { label: 'أبعاد الشبكة', value: '540 مم × 378 مم × 18 مم' },
      { label: 'الضمان', value: '24 شهراً مع وصل الضمان الرسمي' },
      { label: 'نوع ناقل الحركة', value: 'متوافق مع اليدوي والأوتوماتيكي' },
    ],
    variants: [
      { id: 'var-1', label: 'النسخة القياسية (محرك 1.2 / 1.6 بنزين و ديزل)', partNumber: 'VAL-734320', price: 16500, oldPrice: 19500, stock: 'متوفر' },
      { id: 'var-2', label: 'النسخة المعززة توربو ديزل (1.6 BlueHDi)', partNumber: 'VAL-734321', price: 18200, oldPrice: 21000, stock: 'متوفر' },
    ],
    reviews: [
      { name: 'كريم م.', city: 'الجزائر العاصمة', car: 'Peugeot 208 1.6 HDI', rating: 5, date: 'منذ 4 أيام', comment: 'مشعاع ممتاز ركبته في 208 الحرارة رجعت مستقرة 90 درجة ثابتة حتى في عقبة بوزريعة ومكيف شغال. توصيل سريع ومغلف مليح.', verified: true },
      { name: 'سمير ب.', city: 'وهران', car: 'Citroën C-Elysée', rating: 5, date: 'منذ أسبوع', comment: 'جودة فاليوفيكس أصلية بالكرتونة والباركود تاعها. شفتها مع الميكانيكي وقالي هادي لي تجي في لا ميزون. شكرا KAS.', verified: true },
      { name: 'ياسين ع.', city: 'سطيف', car: 'Peugeot 301 1.2', rating: 5, date: 'منذ أسبوعين', comment: 'سعر مناسب مقارنة بالسوق وتوصيل حتى للدار في سطيف خلال 24 ساعة. تعامل احترافي.', verified: true },
    ],
    faq: [
      { q: 'هل المشعاع متوافق تماماً مع سيارتي بدون أي تعديل؟', a: 'نعم، المشعاع مطابق 100% لمقاسات وقواعد سيارات بيجو 208 و301 وسيتروين C3، ويتم تركيبه مباشرة (Plug & Play).' },
      { q: 'كيف أستفيد من الضمان في حال حدوث مشكل؟', a: 'يأتي المنتج مرفقاً بوصل ضمان رسمي لمدة 24 شهراً. في حال وجود أي عيب مصنعي يتم استبدال القطعة فوراً دون تعقيد.' },
      { q: 'هل يمكنني فتح الطرد وفحص المشعاع قبل دفع المبلغ؟', a: 'نعم بالتأكيد! سياستنا تسمح لك بمعاينة المشعاع والتأكد من سلامته ووجود علامة الماركة الأصلية قبل تسليم المبلغ لموزع التوصيل.' },
      { q: 'كم تستغرق مدة التوصيل لولايتي؟', a: 'التوصيل يتم خلال 24 ساعة لولايات الوسط والشرق والغرب، و48 ساعة كأقصى تقدير لولايات الجنوب.' },
    ],
  },
  {
    slug: 'phare-renault-clio4',
    productId: 30,
    productName: 'مصباح أمامي أصلي VALEO رينو كليو 4',
    productNameFr: 'Optique Avant Phare Valeo Renault Clio 4 / Symbol',
    brand: 'VALEO',
    partNumber: 'HL-VALEO-3012',
    sku: 'VAL-PHARE-CLIO4',
    category: 'المصباح الأمامي',
    badge: 'وضوح ليلي فائق — زجاج UV غير قابل للاصفرار',
    heroKicker: 'استعد إنارة سيارتك بقوة الوكالة الأصلية',
    heroTitle: 'مصباح أمامي أصلي VALEO لسيارة رينو كليو 4 وسيمبول',
    heroSubtitle: 'إضاءة قوية وواضحة جداً مطابقة للمواصفات الأوروبية بدون أي مشاكل في الفحص التقني أو ضعف في العاكسات الداخلية.',
    heroBullets: [
      'عدسة بولي كربونات معالجة بطبقة UV تمنع الاصفرار والبهتان',
      'عاكسات داخلية عالية النقاء لمدى رؤية ليلي واسع وآمن',
      'فيش أصلي متوافق مباشرة مع ضفيرة السيارة الأصلية',
      'متوفر للجهتين (يمين ويسار) مع إمكانية طلب طقم كامل بسعر خاص',
    ],
    price: 11800,
    oldPrice: 14500,
    savingsText: 'وفر 2 700 دج الآن',
    stock: 'متوفر',
    stockCountText: 'متوفر في المخزن — تسليم سريع',
    urgencyBadge: 'طلب مرتفع على قطع رينو كليو 4',
    deliveryNote: 'توصيل مضمون لـ 58 ولاية — الدفع بعد الفحص والمعاينة',
    primaryImage: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
    ],
    features: [
      { icon: 'Sun', title: 'رؤية ليلية كاشفة', desc: 'توزيع ضوئي متجانس يمنحك رؤية واضحة للطريق بدون تشتيت أو إبهار للسائقين القادمين.' },
      { icon: 'ShieldCheck', title: 'مقاوم للماء والأتربة', desc: 'إحكام غلق حراري كامل يمنع تسرب مياه الأمطار أو بخار الرطوبة داخل العدسة.' },
      { icon: 'Zap', title: 'توصيل مباشر', desc: 'مخارج المصابيح الكهربائية مطابقة للفيش الأصلي بدون أي قص في الأسلاك.' },
      { icon: 'Truck', title: 'توصيل آمن محمي', desc: 'شحن في صناديق ممتصة للصدمات مع ضمان وصول القطعة سليمة 100%.' },
    ],
    compatibleVehicles: [
      { make: 'Renault', models: ['Clio 4 (Phase 1 & 2)', 'Symbol III'], years: '2012 – 2019', engine: 'Tous moteurs' },
      { make: 'Dacia', models: ['Logan II', 'Sandero II'], years: '2013 – 2020', engine: '1.2 / 1.5 dCi / 0.9 TCe' },
    ],
    specifications: [
      { label: 'رقم القطعة الأصلي (OEM)', value: 'VALEO 044778 / 260105344R' },
      { label: 'الماركة', value: 'VALEO Original Equipment' },
      { label: 'النوع', value: 'هالوجين + ليد نهاري DRL' },
      { label: 'الضمان', value: '18 شهراً ضد عيوب التصنيع واصفرار العدسة' },
    ],
    variants: [
      { id: 'right', label: 'الجهة اليمنى (جهة الراكب - Côté Passager)', partNumber: 'HL-VALEO-3012-R', price: 11800, oldPrice: 14500, stock: 'متوفر' },
      { id: 'left', label: 'الجهة اليسرى (جهة السائق - Côté Conducteur)', partNumber: 'HL-VALEO-3012-L', price: 11800, oldPrice: 14500, stock: 'متوفر' },
      { id: 'pair', label: 'طقم كامل الجهتين (يمين + يسار مع تخفيض إضافي)', partNumber: 'HL-VALEO-3012-PAIR', price: 22500, oldPrice: 29000, stock: 'متوفر' },
    ],
    reviews: [
      { name: 'بلال ت.', city: 'البليدة', car: 'Renault Clio 4 GT-Line', rating: 5, date: 'منذ 3 أيام', comment: 'الفار طلع تحفة وضوء قوي بزاف. الموديل الأصلي تاع فاليوفيكس فيه طابع لا ميزون. شكرا على السرعة.', verified: true },
      { name: 'مراد ق.', city: 'قسنطينة', car: 'Renault Symbol 2018', rating: 5, date: 'منذ أسبوع', comment: 'توصيل حتى للباب في قسنطينة في يومين ومغلف مليح بدون خدوش.', verified: true },
    ],
    faq: [
      { q: 'هل يشمل المصباح محرك ضبط الارتفاع الكهربائي؟', a: 'نعم، المصباح مجهز بمحرك الضبط الكهربائي المدمج الأصلي.' },
      { q: 'هل العدسة تصفر مع شمس الصيف؟', a: 'لا، العدسة الخارجية معالجة بطبقة UV Protect الأوروبية التي تحمي البولي كربونات من الاصفرار والتأكسد.' },
      { q: 'هل يمكنني طلب الجهتين معاً؟', a: 'نعم، يمكنك اختيار خيار "طقم كامل الجهتين" للحصول على تخفيض خاص وتوصيل مجاني.' },
    ],
  },
  {
    slug: 'disques-frein-brembo-golf7',
    productId: 12,
    productName: 'طقم ديسكات فرامل أصلية BREMBO جولف 7 / ليون / أوكتافيا',
    productNameFr: 'Disques de Frein Ventilés Brembo Golf 7 / Seat Leon / Octavia',
    brand: 'BREMBO',
    partNumber: 'BR-09.9772.11',
    sku: 'BR-DSK-VAG-MQB',
    category: 'الفرامل ونظام التوقف',
    badge: 'فرملة دقيقة واستجابة فورية — جودة إيطالية أصلية',
    heroKicker: 'أقصى درجات الأمان والتحكم في أصعب الظروف',
    heroTitle: 'ديسكات فرامل مهواة BREMBO الإيطالية لمجموعة VAG',
    heroSubtitle: 'كبح فوري بدون اهتزازات ولا تصفير، مع سبائك حديد معالج حرارياً ومقاوم للتآكل الناتج عن الكبح المتكرر في المنحدرات.',
    heroBullets: [
      'تهوية داخلية متطورة لتشتيت الحرارة ومنع ظاهرة فقدان الفرملة (Brake Fade)',
      'طلاء واقي ضد الصدأ UV Coated يمنح مظهراً رياضياً نقياً ويقاوم العوامل الجوية',
      'سطح مخرط بدقة ميكرونية لمنع رجة عجلة القيادة أثناء الفرملة على السرعات العالية',
      'متوافق تماماً مع منصة MQB (Golf 7, Leon, Octavia, Audi A3, Caddy 4)',
    ],
    price: 13500,
    oldPrice: 16800,
    savingsText: 'وفر 3 300 دج اليوم',
    stock: 'متوفر',
    stockCountText: 'متوفر — تسليم سريع لجميع الولايات',
    urgencyBadge: 'العلامة رقم 1 عالمياً في أنظمة الفرامل الرياضية',
    deliveryNote: 'توصيل مأمون لباب المنزل — حق الفحص قبل الدفع',
    primaryImage: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
    ],
    features: [
      { icon: 'ShieldAlert', title: 'مسافة فرملة أقصر', desc: 'استجابة سريعة جداً عند الضغط على دواسة الفرامل تقلل مسافة التوقف بنسبة تصل إلى 15%.' },
      { icon: 'Disc', title: 'صامت وبدون رجة', desc: 'توازن ديناميكي عالي الدقة يلغي أي اهتزازات أو أصوات تصفير مزعجة.' },
      { icon: 'ShieldCheck', title: 'معتمد بمعيار ECE R90', desc: 'مطابق لأعلى مواصفات السلامة الأوروبية المعتمدة لسيارات الأداء العالي.' },
      { icon: 'Truck', title: 'شحن سريع لـ 58 ولاية', desc: 'استلم الطرد عند باب بيتك وادفع لموزع التوصيل بعد المعاينة.' },
    ],
    compatibleVehicles: [
      { make: 'Volkswagen', models: ['Golf 7 / 7.5', 'Golf 6', 'Caddy 4', 'Passat B8', 'Tiguan'], years: '2012 – 2021', engine: '1.6 TDI / 2.0 TDI / 1.4 TSI' },
      { make: 'Seat', models: ['Leon 3', 'Ibiza (Cupra/FR)', 'Ateca'], years: '2013 – 2020', engine: '1.6 TDI / 2.0 TDI' },
      { make: 'Skoda', models: ['Octavia A7', 'Superb III'], years: '2013 – 2020', engine: '1.6 TDI / 2.0 TDI' },
      { make: 'Audi', models: ['A3 8V'], years: '2012 – 2020', engine: '1.6 TDI / 2.0 TDI' },
    ],
    specifications: [
      { label: 'رقم القطعة', value: 'BREMBO 09.9772.11 / 5Q0615301F' },
      { label: 'الماركة', value: 'BREMBO (Italy)' },
      { label: 'نوع الديسك', value: 'مهوى من الداخل (Ventilé)' },
      { label: 'القطر الخارجي', value: '288 مم / 312 مم' },
      { label: 'عدد الثقوب', value: '5 ثقوب (5x112)' },
      { label: 'الضمان', value: '24 شهراً' },
    ],
    variants: [
      { id: 'd288', label: 'طقم ديسكات أمامية 288 مم (لمحركات 1.6 TDI و 1.2/1.4 TSI)', partNumber: 'BR-288-VENT', price: 13500, oldPrice: 16800, stock: 'متوفر' },
      { id: 'd312', label: 'طقم ديسكات أمامية 312 مم (لمحركات 2.0 TDI و GTD/GTI)', partNumber: 'BR-312-VENT', price: 15900, oldPrice: 19200, stock: 'متوفر' },
      { id: 'full-pack', label: 'باك كامل: ديسكات أمامية + طقم بلاكات فرامل Brembo', partNumber: 'BR-PACK-FRONT', price: 19500, oldPrice: 24500, stock: 'متوفر' },
    ],
    reviews: [
      { name: 'طارق م.', city: 'عنابة', car: 'Golf 7 GTD 2.0 TDI', rating: 5, date: 'منذ 5 أيام', comment: 'كبح خرافي وسكوت تام بلا تصفير، بريمبو لا يعلى عليها. القطعة فيها كود التحقق الأصلي.', verified: true },
      { name: 'رضا س.', city: 'تيزي وزو', car: 'Seat Leon 1.6 TDI', rating: 5, date: 'منذ أسبوعين', comment: 'بدلت الديسكات القديمة لي كانو يرعدو في لوطوروت، بهادو الفرملة رجعت ناعمة وثابتة بزاف. شكرا كاس.', verified: true },
    ],
    faq: [
      { q: 'هل السعر المعروض للقرص الواحد أم للطقم؟', a: 'السعر المعروض يشمل طقم كامل يتكون من قرصين (علبة أصلية لقرصين أماميين للجهتين اليمين واليسار).' },
      { q: 'هل هناك كود للتأكد من أصالة منتجات بريمبو؟', a: 'نعم، تحتوي كل علبة أصلية من بريمبو على كود QR أمني فريد وبطاقة خربشة للتحقق المباشر من موقع Brembo الرسمي.' },
      { q: 'هل تحتاج الديسكات لتطبيع (Rodage) بعد التركيب؟', a: 'نعم، يُنصح بتجنب الفرملة العنيفة المفاجئة خلال أول 200 كم لضمان استقرار السطح وتكامل الديسكات مع البلاكات.' },
    ],
  },
]

/**
 * Resolves a campaign preset by slug or builds a dynamic conversion config from a product
 */
export function getCampaignBySlug(slug: string): AdCampaignConfig | undefined {
  return CAMPAIGN_PRESETS.find((c) => c.slug === slug || c.slug.toLowerCase() === slug.toLowerCase())
}

/**
 * Builds a dynamic high-converting ad landing page configuration for ANY product in KAS
 */
export function buildCampaignFromProduct(product: Product | any, campaignSlug?: string): AdCampaignConfig {
  const price = Number(product.price || product.customPrice || 15000)
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : price > 0 ? Math.round(price * 1.2) : undefined
  const diff = oldPrice && oldPrice > price ? oldPrice - price : 0

  const primaryImg =
    product.image ||
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85'

  const gallery =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [primaryImg]

  const compatList = Array.isArray(product.compat)
    ? product.compat.join(' / ')
    : typeof product.compat === 'string'
    ? product.compat
    : 'متوافق مع عدة موديلات في الجزائر'

  return {
    slug: campaignSlug || `product-${product.id}`,
    productId: product.id,
    productName: product.name || product.nameAr || 'قطعة غيار أصلية',
    productNameFr: product.nameFr || product.name || '',
    brand: product.brand || 'VALEO',
    partNumber: product.partNumber || product.base_part_number || product.sku || 'OEM-PART',
    sku: product.sku || product.partNumber || 'KAS-PROD',
    category: product.category || 'قطع الغيار',
    badge: product.badge || 'قطعة أصلية مضمونة 100%',
    heroKicker: 'عرض ترويجي حصري لفترة محدودة مع شحن فوري',
    heroTitle: `${product.name || product.nameAr} الأصلية لسيارتك`,
    heroSubtitle: product.description || `قطعة غيار عالية الجودة مصنعة طبقاً لمواصفات الوكالة، تضمن أعلى درجات الأداء والموثوقية لسيارتك في الطرقات الجزائرية.`,
    heroBullets: [
      `قطعة غيار أصلية ومضمونة من علامة ${product.brand || 'معتمدة'}`,
      'مطابقة لمقاسات الوكالة وتركيب مباشر بدون تعديل',
      'توصيل سريع ومضمون لـ 58 ولاية خلال 24–48 ساعة',
      'حق المعاينة والفحص عند الباب قبل دفع أي دينار',
    ],
    price,
    oldPrice,
    savingsText: diff > 0 ? `وفر ${diff.toLocaleString('fr-FR')} دج اليوم` : undefined,
    stock: (product.stock as StockStatus) || 'متوفر',
    stockCountText: 'متوفر في المخزن الرئيسي — جاهز للشحن الفوري',
    urgencyBadge: 'عرض خاص — ساري حتى نفاد الكمية المخصصة للحملة',
    deliveryNote: 'توصيل مأمون لباب المنزل لجميع ولايات الجزائر مع الدفع عند الاستلام',
    primaryImage: primaryImg,
    galleryImages: gallery,
    features: [
      { icon: 'ShieldCheck', title: 'جودة معتمدة وضمان رسمي', desc: 'كل قطعة تفحص بدقة قبل الشحن وتأتي مع ضمان حقيقي ضد عيوب الصناعة.' },
      { icon: 'Wrench', title: 'تركيب مطابق للوكالة', desc: 'أبعاد دقيقة ومنافذ تثبيت مطابقة 100% لضمان سهولة التركيب بدون أي تعديل.' },
      { icon: 'Truck', title: 'توصيل لباب منزلك لـ 58 ولاية', desc: 'خدمة توصيل سريعة ومحترفة تغطي كامل التراب الوطني والدفع عند الاستلام.' },
      { icon: 'Headphones', title: 'استشارة ومرافقة تقنية مجانية', desc: 'فريقنا التقني جاهز لمساعدتك في التأكد من توافق القطعة مع رقم الشاسيه أو بطاقة السيارة.' },
    ],
    compatibleVehicles: [
      { make: 'السيارات المتوافقة', models: [compatList], years: 'جميع السنوات المتوافقة', engine: 'حسب مواصفات المحرك' },
    ],
    specifications:
      Array.isArray(product.specs) && product.specs.length > 0
        ? product.specs.map((s: any) => ({ label: s.label, value: s.value }))
        : [
            { label: 'رقم القطعة (PN)', value: product.partNumber || product.sku || 'OEM' },
            { label: 'الماركة والمصنّع', value: product.brand || 'GENUINE / OEM' },
            { label: 'الفئة', value: product.category || 'قطع الغيار' },
            { label: 'الضمان', value: 'ضمان استبدال رسمي من KAS Auto Parts' },
          ],
    variants: Array.isArray(product.variants) && product.variants.length > 1
      ? product.variants.map((v: any) => ({
          id: String(v.id || v.sku),
          label: v.label || v.label_ar || 'متغير',
          partNumber: v.partNumber || v.part_number,
          price: Number(v.price || price),
          oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
          stock: v.stock || 'متوفر',
        }))
      : undefined,
    reviews: [
      { name: 'أحمد ب.', city: 'الجزائر العاصمة', car: 'سيارة زبون موثق', rating: 5, date: 'مؤخراً', comment: 'القطعة أصلية وركبت بدون أي مشكل، تعامل راقي وسرعة في الرد عبر واتساب.', verified: true },
      { name: 'فؤاد ل.', city: 'سطيف', car: 'زبون دائم', rating: 5, date: 'مؤخراً', comment: 'ثاني مرة نطلب من عند KAS، التوصيل في الوقت والقطع أصلية ومضمونة.', verified: true },
    ],
    faq: [
      { q: 'كيف أتأكد من أن هذه القطعة تركب في سيارتي؟', a: 'يمكنك إرسال رقم الشاسيه (Châssis / VIN) أو صورة البطاقة الرمادية عبر واتساب وسيتأكد خبراؤنا فوراً من التوافق.' },
      { q: 'كيف يتم الدفع؟', a: 'الدفع يتم نقداً عند الاستلام (Paiement à la livraison) بعد معاينة الطرد والتأكد من سلامة القطعة.' },
      { q: 'كم تستغرق مدة التوصيل؟', a: 'تستغرق من 24 إلى 48 ساعة لجميع ولايات الوطن.' },
      { q: 'ماذا لو كانت القطعة غير متوافقة؟', a: 'نضمن لك حق الاستبدال أو الإرجاع المجاني واسترداد أموالك في حال عدم توافق القطعة.' },
    ],
  }
}
