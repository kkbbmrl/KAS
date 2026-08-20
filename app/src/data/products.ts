export type StockStatus = 'متوفر' | 'كمية محدودة' | 'غير متوفر'

export interface ProductVariant {
  id: string
  /** e.g. "بيجو 208 — 1.6 HDI" */
  label: string
  /** Matching compat strings for this variant */
  compat: string[]
  price?: number
  oldPrice?: number
  stock: StockStatus
  partNumber?: string
  image?: string
  /** Extra detail rows shown when this variant is selected */
  extraSpecs?: { label: string; value: string }[]
}

export interface Product {
  id: number
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

export const FEATURED_HOMEPAGE_PRODUCTS: {
  id: number
  fr: string
  name: string
  category: string
  brand: string
  partNumber: string
  image: string
  price: number
  oldPrice?: number
  stock: StockStatus
  badge: string
  desc: string
  specsSummary: string[]
  accentColor: string
}[] = [
  {
    id: 21,
    fr: 'Radiateur',
    name: 'مشعاع تبريد المحرك عالي الكفاءة',
    category: 'المشعاع',
    brand: 'VALEO',
    partNumber: 'RAD-8800',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1000&q=80',
    price: 16500,
    oldPrice: 19000,
    stock: 'متوفر',
    badge: 'الأكثر طلبًا في الصيف',
    desc: 'مشعاع ألومنيوم فائق الأداء بموصلية حرارية معززة وتصميم مطابق لمقاييس المصنع، يمنع ارتفاع حرارة المحرك حتى في أشد الظروف.',
    specsSummary: ['ألومنيوم مقوّى', 'سعة تبريد قصوى', 'ضمان 24 شهرًا'],
    accentColor: 'from-red-600/90 to-zinc-900/90',
  },
  {
    id: 17,
    fr: 'Verre de phare',
    name: 'زجاج المصباح الأمامي فائق الشفافية',
    category: 'زجاج المصباح',
    brand: 'HELLA',
    partNumber: 'GL-3309',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
    price: 3900,
    oldPrice: 4800,
    stock: 'متوفر',
    badge: 'مقاوم للاصفرار والخدوش',
    desc: 'عدسة زجاجية من البولي كربونات بطبقة حماية من الأشعة فوق البنفسجية UV، تعيد للمصباح بريقه ووضوحه الأصلي بتكلفة اقتصادية.',
    specsSummary: ['بولي كربونات UV', 'مقاوم للكسر', 'تركيب مباشر'],
    accentColor: 'from-zinc-900/90 to-red-950/90',
  },
  {
    id: 19,
    fr: 'Cache poussière',
    name: 'غطاء غبار المفاصل ونظام التوجيه',
    category: 'غطاء الغبار',
    brand: 'SKF',
    partNumber: 'DST-2144',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1000&q=80',
    price: 1800,
    stock: 'متوفر',
    badge: 'حماية متكاملة',
    desc: 'غطاء حماية مطاطي مرن ومقاوم للشحوم والزيوت، يمنع تسرب الأتربة والماء إلى مفاصل ونظام تعليق وتوجيه المركبة.',
    specsSummary: ['مطاط نيوبرين مرن', 'مقاوم للحرارة', 'عمر افتراضي طويل'],
    accentColor: 'from-red-700/90 to-zinc-950/90',
  },
  {
    id: 22,
    fr: 'Ventilateur',
    name: 'مروحة تبريد كهربائية هادئة وقوية',
    category: 'المروحة',
    brand: 'BOSCH',
    partNumber: 'FAN-4512',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80',
    price: 8700,
    oldPrice: 9900,
    stock: 'متوفر',
    badge: 'سحب هوائي مضاعف',
    desc: 'مروحة تبريد كهربائية بمحرك عديم الشفرات هادئ وقوي، تضمن تدفق هواء سريع عبر الرادياتور والمكيف مع استهلاك كهربائي منخفض.',
    specsSummary: ['12V ديناميكي', 'قطر 380 مم', 'ضمان 18 شهرًا'],
    accentColor: 'from-zinc-900/90 to-red-900/90',
  },
  {
    id: 15,
    fr: 'Phare',
    name: 'مصباح أمامي كامل بتقنية إضاءة واضحة',
    category: 'المصباح الأمامي',
    brand: 'HELLA',
    partNumber: 'HL-5501',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1000&q=80',
    price: 14500,
    oldPrice: 16800,
    stock: 'متوفر',
    badge: 'مطابق للمواصفات الأوروبية',
    desc: 'مصباح أمامي كامل بتصميم عصري وإضاءة واضحة ودقيقة تحسن الرؤية الليلية وتمنح الواجهة الأمامية مظهرًا فخمًا وأنيقًا.',
    specsSummary: ['عدسات LED/هالوجين', 'محرك ضبط المنسوب', 'ضمان 24 شهرًا'],
    accentColor: 'from-red-600/90 to-zinc-900/90',
  },
  {
    id: 25,
    fr: 'Essuie-glace',
    name: 'طقم ماسحات زجاج أمامية سيلكون صامتة',
    category: 'ماسحة الزجاج',
    brand: 'BOSCH',
    partNumber: 'WIP-600',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad346409?auto=format&fit=crop&w=1000&q=80',
    price: 2400,
    oldPrice: 3100,
    stock: 'متوفر',
    badge: 'مسح بدون خطوط أو صرير',
    desc: 'ماسحات أمامية هوائية بدون إطار (Aerotwin) مزودة بمطاط سيليكوني معالج بالجرافيت لمسح مثالي في الأمطار الغزيرة دون أي ضجيج.',
    specsSummary: ['تقنية Aerotwin', 'شفرات جرافيت', 'سهولة التركيب'],
    accentColor: 'from-zinc-950/90 to-red-800/90',
  },
]

export const PRODUCTS: Product[] = [
  // 1. المشعاع (Radiateur)
  {
    id: 21,
    name: 'مشعاع تبريد المحرك (Radiateur)',
    nameFr: 'Radiateur de refroidissement moteur',
    brand: 'VALEO',
    partNumber: 'RAD-8800',
    category: 'المشعاع',
    aliases: ['Radiateur', 'رادياتور', 'مبرد', 'مشعاع', 'رادياتير'],
    compat: ['تويوتا كورولا', 'تويوتا ياريس', 'هيونداي إلنترا', 'هيونداي أكسنت', 'كيا سيراتو', 'كيا ريو'],
    price: 16500,
    oldPrice: 19000,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
    badge: 'تبريد فائق',
    rating: 4.9,
    description: 'مشعاع ألومنيوم عالي الأداء مع خزانات جانبية مقواة من البلاستيك الحراري. يضمن تبديدًا حراريًا ممتازًا واستقرارًا لدرجة حرارة المحرك في أقسى الظروف المناخية الصيفية.',
    specs: [
      { label: 'المادة', value: 'ألومنيوم معالج + بولياميد مقوّى' },
      { label: 'الأبعاد', value: '650 × 415 × 26 مم' },
      { label: 'النوع', value: 'مشعاع تبريد محرك (Radiateur)' },
      { label: 'بلد التصنيع', value: 'فرنسا' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
    featuredHome: true,
    variants: [
      {
        id: 'rad-21-toyota',
        label: 'تويوتا كورولا / ياريس',
        compat: ['تويوتا كورولا', 'تويوتا ياريس'],
        price: 16500,
        oldPrice: 19000,
        stock: 'متوفر',
        partNumber: 'RAD-8800-TOY',
        extraSpecs: [{ label: 'التوافق', value: 'تويوتا كورولا / ياريس 2009-2019' }],
      },
      {
        id: 'rad-21-hyundai',
        label: 'هيونداي إلنترا / أكسنت',
        compat: ['هيونداي إلنترا', 'هيونداي أكسنت'],
        price: 15800,
        stock: 'متوفر',
        partNumber: 'RAD-8800-HYN',
        extraSpecs: [{ label: 'التوافق', value: 'هيونداي إلنترا / أكسنت 2010-2020' }],
      },
      {
        id: 'rad-21-kia',
        label: 'كيا سيراتو / ريو',
        compat: ['كيا سيراتو', 'كيا ريو'],
        price: 15500,
        stock: 'كمية محدودة',
        partNumber: 'RAD-8800-KIA',
        extraSpecs: [{ label: 'التوافق', value: 'كيا سيراتو / ريو 2011-2021' }],
      },
    ],
  },
  {
    id: 26,
    name: 'مشعاع تبريد ديزل معزز (Radiateur Turbo)',
    nameFr: 'Radiateur moteur Turbo Diesel',
    brand: 'NISSENS',
    partNumber: 'RAD-9420',
    category: 'المشعاع',
    aliases: ['Radiateur', 'رادياتور', 'مبرد ماء'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'داسيا لوغان', 'داسيا داستر', 'بيجو 208', 'بيجو 301'],
    price: 18200,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
    badge: 'محركات dCi / HDi',
    rating: 4.8,
    description: 'مشعاع تبريد مطابق للأصلي مصمم لتحمل الضغوط العالية في محركات الديزل والتيربو، مع وصلات سريعة مانعة للتسريب.',
    specs: [
      { label: 'المادة', value: 'ألومنيوم ملحوم بالنحاس' },
      { label: 'التوافق', value: 'محركات الديزل والتيربو' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 2. زجاج المصباح (Verre de phare)
  {
    id: 17,
    name: 'زجاج المصباح الأمامي (Verre de phare)',
    nameFr: 'Verre de phare avant transparent',
    brand: 'HELLA',
    partNumber: 'GL-3309',
    category: 'زجاج المصباح',
    aliases: ['Verre de phare', 'عدسة المصباح', 'زجاج الفانوس', 'بلورة الضوء'],
    compat: ['بيجو 208', 'بيجو 2008', 'بيجو 301', 'سيتروين C3', 'سيتروين C-Elysée'],
    price: 3900,
    oldPrice: 4800,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    badge: 'حماية UV',
    rating: 4.8,
    description: 'زجاج مصباح أمامي شفاف مصنوع من البولي كربونات المقاوم للصدمات مع طلاء حماية ضد الأشعة فوق البنفسجية لمنع الاصفرار والبهتان.',
    specs: [
      { label: 'المادة', value: 'بولي كربونات Polycarbonate مقوّى' },
      { label: 'الطلاء', value: 'طبقة UV Protect عازلة' },
      { label: 'الموضع', value: 'أمامي يمين / يسار' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
    featuredHome: true,
    variants: [
      {
        id: 'gl-17-peugeot208',
        label: 'بيجو 208 (2012-2019) — يمين',
        compat: ['بيجو 208'],
        price: 3900,
        oldPrice: 4800,
        stock: 'متوفر',
        partNumber: 'GL-3309-P208-R',
        extraSpecs: [{ label: 'الجانب', value: 'أمامي يمين' }],
      },
      {
        id: 'gl-17-peugeot208-l',
        label: 'بيجو 208 (2012-2019) — يسار',
        compat: ['بيجو 208'],
        price: 3900,
        stock: 'متوفر',
        partNumber: 'GL-3309-P208-L',
        extraSpecs: [{ label: 'الجانب', value: 'أمامي يسار' }],
      },
      {
        id: 'gl-17-peugeot301',
        label: 'بيجو 301 (2012-2021)',
        compat: ['بيجو 301'],
        price: 4100,
        stock: 'متوفر',
        partNumber: 'GL-3309-P301',
        extraSpecs: [{ label: 'التوافق', value: 'بيجو 301 جميع الإصدارات' }],
      },
      {
        id: 'gl-17-c3',
        label: 'سيتروين C3 / C-Elysée',
        compat: ['سيتروين C3', 'سيتروين C-Elysée'],
        price: 3700,
        stock: 'كمية محدودة',
        partNumber: 'GL-3309-C3',
        extraSpecs: [{ label: 'التوافق', value: 'سيتروين C3 / C-Elysée 2013-2022' }],
      },
    ],
  },
  {
    id: 27,
    name: 'طقم زجاج مصابيح أمامية يمين + يسار',
    nameFr: 'Paire de verres de phare avant',
    brand: 'TYC',
    partNumber: 'GL-SET-44',
    category: 'زجاج المصباح',
    aliases: ['Verre de phare', 'زجاج المصباح', 'طقم زجاج'],
    compat: ['فولكسفاغن غولف 7', 'فولكسفاغن بولو', 'سيات ليون', 'سيات إبيزا'],
    price: 7400,
    oldPrice: 8900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    badge: 'طقم كامل (زوج)',
    rating: 4.9,
    description: 'طقم عدسات زجاجية يمين ويسار يمنح المصابيح الأمامية مظهر الوكالة الجديد مع تحسين انبعاث الضوء بنسبة 40%.',
    specs: [
      { label: 'الكمية', value: 'زوج (2 قطع - يمين + يسار)' },
      { label: 'المقاومة', value: 'مقاوم للحرارة والرطوبة' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },

  // 3. غطاء الغبار (Cache poussière)
  {
    id: 19,
    name: 'غطاء غبار مفاصل المحور (Cache poussière)',
    nameFr: 'Soufflet de cardan / Cache poussière',
    brand: 'SKF',
    partNumber: 'DST-2144',
    category: 'غطاء الغبار',
    aliases: ['Cache poussière', 'واقي الغبار', 'كاش بوسيار', 'سوفليه', 'غطاء حماية'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'داسيا لوغان', 'داسيا سانديرو', 'داسيا داستر'],
    price: 1800,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    badge: 'مطاط متين',
    rating: 4.7,
    description: 'غطاء غبار مرن فائق الجودة مصنوع من مطاط النيوبرين الحراري، يحمي مفاصل نقل الحركة والمساعدات من الأوساخ والرمال والماء.',
    specs: [
      { label: 'المادة', value: 'مطاط نيوبرين حراري عالي المرونة' },
      { label: 'المحتوى', value: 'الغطاء + مشابك تثبيت ستانلس ستيل + شحم أصلي' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
    featuredHome: true,
  },
  {
    id: 28,
    name: 'طقم أغطية غبار المساعدات الأمامية',
    nameFr: 'Kit cache poussière amortisseurs',
    brand: 'MONROE',
    partNumber: 'PK-310',
    category: 'غطاء الغبار',
    aliases: ['Cache poussière', 'كاش بوسيار المساعدات', 'واقي صدمات'],
    compat: ['هيونداي أكسنت', 'هيونداي i20', 'كيا ريو', 'كيا بيكانتو', 'نيسان صني'],
    price: 3200,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    description: 'طقم أغطية واقية مع مصدات مطاطية مدمجة لحماية أعمدة المساعدات من الخدوش والتآكل المبكر لمانعات التسرب.',
    specs: [
      { label: 'الموضع', value: 'أمامي (طقم قطعتين)' },
      { label: 'الصلابة', value: 'ممتص صدمات إضافي' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },

  // 4. المروحة (Ventilateur)
  {
    id: 22,
    name: 'مروحة تبريد كهربائية كاملة (Ventilateur)',
    nameFr: 'Ventilateur de radiateur électrique',
    brand: 'BOSCH',
    partNumber: 'FAN-4512',
    category: 'المروحة',
    aliases: ['Ventilateur', 'فانلاتور', 'مروحة الرادياتور', 'مروحة التبريد'],
    compat: ['بيجو 208', 'بيجو 301', 'بيجو 2008', 'سيتروين C-Elysée', 'سيتروين C3'],
    price: 8700,
    oldPrice: 9900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    badge: 'محرك ديناميكي',
    rating: 4.9,
    description: 'مروحة تبريد كهربائية متكاملة مع الحامل ودائرة التحكم في السرعات. توفر تدفقًا هوائيًا قويًا ومستمرًا مع هدوء تام واستهلاك طاقة منخفض.',
    specs: [
      { label: 'الجهد التشغيلي', value: '12 فولت DC' },
      { label: 'القطر', value: '380 مم (7 ريش متطورة)' },
      { label: 'السرعات', value: 'سرعتان إلكترونيتان' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
    featuredHome: true,
  },
  {
    id: 29,
    name: 'مروحة تبريد مزدوجة مع وحدة تحكم',
    nameFr: 'Double ventilateur avec module',
    brand: 'VALEO',
    partNumber: 'FAN-8840',
    category: 'المروحة',
    aliases: ['Ventilateur', 'مروحة مزدوجة', 'فانلاتور'],
    compat: ['فولكسفاغن غولف 7', 'فولكسفاغن باسات', 'فولكسفاغن تيجوان', 'سيات ليون', 'سكودا أوكتافيا'],
    price: 15400,
    stock: 'كمية محدودة',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    badge: 'محركات TSI / TDI',
    rating: 4.9,
    description: 'وحدة مروحة مزدوجة لسيارات مجموعة VAG مجهزة بـ وحدة ECU مدمجة لتنظيم الحرارة الأوتوماتيكي للمحرك ومكيف الهواء.',
    specs: [
      { label: 'النوع', value: 'مروحة مزدوجة + كمبيوتر تحكم' },
      { label: 'القوة', value: '300W + 200W' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 5. المصباح الأمامي (Phare)
  {
    id: 15,
    name: 'مصباح أمامي أصلي LED (Phare)',
    nameFr: 'Phare avant complet LED',
    brand: 'HELLA',
    partNumber: 'HL-5501',
    category: 'المصباح الأمامي',
    aliases: ['Phare', 'فانوس', 'ضوء أمامي', 'مصباح', 'فار'],
    compat: ['فولكسفاغن غولف 7', 'فولكسفاغن بولو', 'سيات ليون', 'سيات إبيزا'],
    price: 14500,
    oldPrice: 16800,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    badge: 'إضاءة قوية',
    rating: 4.9,
    description: 'مصباح أمامي كامل أصلي بمطابقة تامة للمصنع، مجهز بإضاءة نهارية LED ومحرك تعديل كهربائي للمنسوب وعدسة تركيز عالية الدقة.',
    specs: [
      { label: 'التقنية', value: 'LED النهارية + عدسة هالوجين/زينون' },
      { label: 'الضبط', value: 'محرك كهربائي مدمج' },
      { label: 'المعايير', value: 'ECE الأوروبية للسلامة' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
    featuredHome: true,
    variants: [
      {
        id: 'hl-15-golf7-r',
        label: 'فولكسفاغن غولف 7 — يمين',
        compat: ['فولكسفاغن غولف 7'],
        price: 14500,
        oldPrice: 16800,
        stock: 'متوفر',
        partNumber: 'HL-5501-G7-R',
        extraSpecs: [{ label: 'الجانب', value: 'أمامي يمين' }, { label: 'السنوات', value: '2012-2020' }],
      },
      {
        id: 'hl-15-golf7-l',
        label: 'فولكسفاغن غولف 7 — يسار',
        compat: ['فولكسفاغن غولف 7'],
        price: 14500,
        stock: 'متوفر',
        partNumber: 'HL-5501-G7-L',
        extraSpecs: [{ label: 'الجانب', value: 'أمامي يسار' }],
      },
      {
        id: 'hl-15-polo-r',
        label: 'فولكسفاغن بولو — يمين',
        compat: ['فولكسفاغن بولو'],
        price: 13200,
        stock: 'متوفر',
        partNumber: 'HL-5501-PO-R',
        extraSpecs: [{ label: 'التوافق', value: 'بولو 2009-2017' }],
      },
      {
        id: 'hl-15-seat',
        label: 'سيات ليون / إبيزا',
        compat: ['سيات ليون', 'سيات إبيزا'],
        price: 12900,
        stock: 'كمية محدودة',
        partNumber: 'HL-5501-SE',
        extraSpecs: [{ label: 'التوافق', value: 'سيات ليون 3 / إبيزا 4' }],
      },
    ],
  },
  {
    id: 30,
    name: 'مصباح أمامي أصلي مع عدسة سوداء',
    nameFr: 'Phare avant fond noir OEM',
    brand: 'VALEO',
    partNumber: 'HL-3012',
    category: 'المصباح الأمامي',
    aliases: ['Phare', 'فانوس أمامي', 'فار'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'داسيا لوغان', 'داسيا سانديرو'],
    price: 11800,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    description: 'مصباح أمامي أصلي بخلفية سوداء رياضية تعطي واجهة السيارة مظهرًا حديثًا وجذابًا، مع توزيع متجانس لشعاع الضوء.',
    specs: [
      { label: 'اللون الداخلي', value: 'أسود رياضي Chrome Black' },
      { label: 'التوصيل', value: 'مباشر Plug & Play' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },

  // 6. ماسحة الزجاج (Essuie-glace)
  {
    id: 25,
    name: 'طقم ماسحات زجاج أمامية سيلكون (Essuie-glace)',
    nameFr: 'Balais d’essuie-glace plats Aerotwin',
    brand: 'BOSCH',
    partNumber: 'WIP-600',
    category: 'ماسحة الزجاج',
    aliases: ['Essuie-glace', 'مساحات', 'وايبر', 'ماسحة', 'شفرات مساحات'],
    compat: ['تويوتا كورولا', 'تويوتا ياريس', 'هيونداي أكسنت', 'هيونداي إلنترا', 'كيا ريو', 'نيسان صني'],
    price: 2400,
    oldPrice: 3100,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad346409?auto=format&fit=crop&w=900&q=80',
    badge: 'تقنية Aerotwin',
    rating: 4.9,
    description: 'طقم ماسحات أمامية بدون إطار بتقنية توزيع الضغط المتساوي. تمسح الزجاج بنعومة تامة بدون خطوط ماء أو صرير في درجات الحرارة المرتفعة والمنخفضة.',
    specs: [
      { label: 'المقاس', value: 'طقم زوج (600 مم / 400 مم)' },
      { label: 'المادة', value: 'مطاط طبيعي مطلي بطبقة Power Protection Plus' },
      { label: 'النوع', value: 'Flat Blade هوائي' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
    featuredHome: true,
  },
  {
    id: 31,
    name: 'ماسحة زجاج خلفية أصلية',
    nameFr: 'Balai d’essuie-glace arrière OEM',
    brand: 'VALEO',
    partNumber: 'WIP-R30',
    category: 'ماسحة الزجاج',
    aliases: ['Essuie-glace', 'مساحة خلفية', 'وايبر خلفي'],
    compat: ['بيجو 208', 'رينو كليو 4', 'فولكسفاغن بولو', 'سيات إبيزا', 'هيونداي i20'],
    price: 1350,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad346409?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    description: 'ماسحة زجاج خلفية مع ذراع التثبيت المخصص، تضمن رؤية واضحة ومسحًا فوريًا للزجاج الخلفي.',
    specs: [
      { label: 'الطول', value: '300 مم' },
      { label: 'التركيب', value: 'مشبك خلفي مخصص' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },

  // 7. بيرسو (Perceau)
  {
    id: 11,
    name: 'بيرسو أصلي للهيكل (Perceau)',
    nameFr: 'Berceau moteur / Perceau de caisse',
    brand: 'VALEO',
    partNumber: 'PRC-4410',
    category: 'بيرسو',
    aliases: ['Perceau', 'بيرسو', 'بيرسو المحرك', 'هيكل سفلي'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'داسيا لوغان', 'داسيا سانديرو', 'داسيا داستر'],
    price: 8900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    badge: 'فولاذ أصلي',
    rating: 4.7,
    description: 'قطعة بيرسو معززة للهيكل وحمالة المحرك بجودة تصنيع أصلية، تمنح تماسكًا عاليًا واستقرارًا للمقدمة عند المنعطفات والاصطدامات مع محاذاة دقيقة.',
    specs: [
      { label: 'المادة', value: 'فولاذ عالي المقاومة High Tensile Steel' },
      { label: 'الطلاء', value: 'معالجة إلكتروستاتيكية مضادة للتآكل' },
      { label: 'التركيب', value: 'مطابق لنقاط تثبيت الوكالة OEM' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 32,
    name: 'بيرسو أمامي سفلي مدعم',
    nameFr: 'Berceau avant renforcé',
    brand: 'TRW',
    partNumber: 'PRC-7720',
    category: 'بيرسو',
    aliases: ['Perceau', 'بيرسو', 'برسو'],
    compat: ['بيجو 208', 'بيجو 301', 'بيجو 2008', 'سيتروين C3', 'سيتروين C-Elysée'],
    price: 9600,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    description: 'بيرسو هيكل أمامي لتثبيت أذرع التعليق والميزانية بدقة تامة للحفاظ على ميزانية العجلات وسلامة القيادة.',
    specs: [
      { label: 'النوع', value: 'بيرسو تعليق أمامي' },
      { label: 'الوزن', value: '7.8 كغ' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 8. سيرسو (Cerceau)
  {
    id: 12,
    name: 'سيرسو تقوية الهيكل (Cerceau)',
    nameFr: 'Cerceau de renfort châssis',
    brand: 'BOSCH',
    partNumber: 'CRC-2208',
    category: 'سيرسو',
    aliases: ['Cerceau', 'سيرسو', 'طوق التقوية', 'دعامة دائرية'],
    compat: ['بيجو 208', 'بيجو 301', 'بيجو 308', 'سيتروين C3', 'سيتروين C4'],
    price: 6200,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    badge: 'تدعيم هيكلي',
    rating: 4.6,
    description: 'سيرسو معدني مشكل بدقة لتدعيم هيكل السيارة وتوزيع قوة الاصطدام وحماية المقصورة ومكونات الواجهة الأمامية.',
    specs: [
      { label: 'المادة', value: 'فولاذ مشكل على البارد Cold-Formed Steel' },
      { label: 'السماكة', value: '2.5 مم مقوى' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },

  // 9. الترافرس (Traverse)
  {
    id: 13,
    name: 'ترافرس أمامي معزز (Traverse)',
    nameFr: 'Traverse avant inférieure / supérieure',
    brand: 'TRW',
    partNumber: 'TRV-3315',
    category: 'الترافرس',
    aliases: ['Traverse', 'ترافرس', 'عارضة', 'ترافيرس', 'عارضة الصدام'],
    compat: ['تويوتا كورولا', 'تويوتا ياريس', 'هيونداي إلنترا', 'هيونداي أكسنت', 'كيا سيراتو', 'كيا ريو'],
    price: 9800,
    oldPrice: 11500,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
    badge: 'فولاذ هيكلي صلب',
    rating: 4.8,
    description: 'عارضة ترافرس أمامية لتثبيت الصدام والمشعاع والمصابيح بدقة متناهية، مقاومة للالتواء والاهتزازات عند القيادة على الطرق الوعرة.',
    specs: [
      { label: 'الموضع', value: 'أمامي سفلي / وسطي' },
      { label: 'المادة', value: 'فولاذ هيكلي عالي الصلابة' },
      { label: 'المعالجة', value: 'مضاد للصدأ والرطوبة' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 33,
    name: 'ترافرس خلفي لامتصاص الصدمات',
    nameFr: 'Traverse arrière pare-chocs',
    brand: 'MAGNETI MARELLI',
    partNumber: 'TRV-8901',
    category: 'الترافرس',
    aliases: ['Traverse', 'ترافرس خلفي', 'عارضة خلفية'],
    compat: ['رينو كليو 4', 'رينو ميغان 4', 'فولكسفاغن غولف 7', 'سيات ليون'],
    price: 8400,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    description: 'ترافرس خلفي لحماية مؤخرة السيارة وخزان الوقود وحمل الصدام الخلفي بمحاذاة تامة للأجنحة.',
    specs: [
      { label: 'الموضع', value: 'خلفي' },
      { label: 'المادة', value: 'ألومنيوم مقوى وفولاذ' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 10. حامل الصدام (Support pare-chocs)
  {
    id: 14,
    name: 'حامل الصدام الأمامي الجانبي (Support pare-chocs)',
    nameFr: 'Support et guide pare-chocs avant',
    brand: 'VALEO',
    partNumber: 'SPB-1180',
    category: 'حامل الصدام',
    aliases: ['Support pare-chocs', 'حامل المصد', 'سيبور بار شوك', 'مشابك الصدام', 'حامل الصدام'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'رينو ميغان 4', 'رينو داستر', 'داسيا داستر', 'داسيا لوغان'],
    price: 4100,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    badge: 'تثبيت محكم',
    rating: 4.6,
    description: 'حامل صدام أمامي بتشطيب أصلي يضمن استقامة المصد وعدم حدوث فراغات أو ارتخاء بين الصدام والرفرف والمصابيح.',
    specs: [
      { label: 'الموضع', value: 'أمامي يمين / يسار' },
      { label: 'المادة', value: 'بلاستيك هندسي ABS + دعامات معدنية' },
      { label: 'التركيب', value: 'كليبسات أصلية سهلة التثبيت' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 34,
    name: 'طقم حوامل صدام أمامي كامل (4 قطع)',
    nameFr: 'Kit supports pare-chocs avant complet',
    brand: 'DEPO',
    partNumber: 'SPB-KIT-4',
    category: 'حامل الصدام',
    aliases: ['Support pare-chocs', 'طقم حوامل صدام', 'سيبورات'],
    compat: ['هيونداي أكسنت', 'هيونداي إلنترا', 'كيا ريو', 'كيا سيراتو', 'نيسان صني'],
    price: 5900,
    oldPrice: 6800,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    description: 'طقم متكامل من 4 حوامل مركزية وجانبية لتثبيت الصدام الأمامي والشبكة بدقة الوكالة دون اهتزاز.',
    specs: [
      { label: 'المحتوى', value: '4 قطع (يمين + يسار + وسطي)' },
      { label: 'المتانة', value: 'مقاوم للحرارة والكسر' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },

  // 11. الضوء الخلفي (Feu arrière)
  {
    id: 16,
    name: 'ضوء خلفي أصلي كريستال (Feu arrière)',
    nameFr: 'Feu arrière complet cristal / LED',
    brand: 'HELLA',
    partNumber: 'TL-7702',
    category: 'الضوء الخلفي',
    aliases: ['Feu arrière', 'فانوس خلفي', 'ضوء خلفي', 'سطوب', 'فار أريير'],
    compat: ['هيونداي أكسنت', 'هيونداي إلنترا', 'كيا ريو', 'كيا سيراتو', 'نيسان صني'],
    price: 7600,
    oldPrice: 8900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    flip: true,
    badge: 'إضاءة فرملة واضحة',
    rating: 4.8,
    description: 'ضوء خلفي أصلي بزجاج أحمر كريستالي ناصع وخطوط LED للتوقف والرجوع للخلف، يضمن وضوحًا وأمانًا عاليًا أثناء القيادة الليلية.',
    specs: [
      { label: 'الموضع', value: 'خلفي (يمين / يسار)' },
      { label: 'التشغيل', value: '12V تيار مستمر' },
      { label: 'العزل', value: 'مانع تسرب سيليكوني ضد مياه الأمطار والغسيل' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },
  {
    id: 35,
    name: 'ضوء خلفي LED بتقنية إشارات متحركة',
    nameFr: 'Feu arrière dynamique LED',
    brand: 'MAGNETI MARELLI',
    partNumber: 'TL-9940',
    category: 'الضوء الخلفي',
    aliases: ['Feu arrière', 'فانوس خلفي LED', 'سطوب ديناميكي'],
    compat: ['فولكسفاغن غولف 7', 'فولكسفاغن بولو', 'سيات ليون', 'أودي A3', 'بيجو 208'],
    price: 13200,
    oldPrice: 15500,
    stock: 'كمية محدودة',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    badge: 'تصميم فاخر',
    rating: 4.9,
    description: 'ضوء خلفي حديث بإشارات انعطاف متدفقة Dynamic LED تعطي السيارة لمسة عصرية فاخرة وأمانًا فائقًا على الطرقات السريعة.',
    specs: [
      { label: 'النوع', value: 'Full LED ديناميكي' },
      { label: 'التوافق', value: 'Plug & Play بدون أخطاء لوحة العدادات' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 12. الصدام (Pare-chocs)
  {
    id: 18,
    name: 'صدام أمامي أصلي جاهز للدهان (Pare-chocs)',
    nameFr: 'Pare-chocs avant avec apprêt',
    brand: 'VALEO',
    partNumber: 'BMP-9004',
    category: 'الصدام',
    aliases: ['Pare-chocs', 'مصد', 'بار شوك', 'صدام', 'مصد أمامي'],
    compat: ['تويوتا ياريس', 'تويوتا كورولا', 'هيونداي i20', 'هيونداي أكسنت', 'كيا ريو'],
    price: 12800,
    oldPrice: 14900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    badge: 'طبقة تأسيس جاهزة',
    rating: 4.8,
    description: 'صدام أمامي بمقاسات المصنع الدقيقة مصنوع من بلاستيك البولي بروبيلين المقاوم للصدمات الخفيفة، مطلي بطبقة تأسيس (Apprêt) جاهزة للدهان المباشر.',
    specs: [
      { label: 'الموضع', value: 'أمامي' },
      { label: 'المادة', value: 'بولي بروبيلين PP عالي المرونة' },
      { label: 'التجهيز', value: 'فتحات لمصابيح الضباب وحساسات الركن' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },
  {
    id: 36,
    name: 'صدام خلفي أصلي مع مشتت هواء',
    nameFr: 'Pare-chocs arrière avec diffuseur',
    brand: 'DEPO',
    partNumber: 'BMP-7730',
    category: 'الصدام',
    aliases: ['Pare-chocs', 'صدام خلفي', 'بار شوك أريير', 'مصد خلفي'],
    compat: ['رينو كليو 4', 'رينو ميغان 4', 'بيجو 208', 'بيجو 308', 'فولكسفاغن غولف 7'],
    price: 13900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    description: 'صدام خلفي بتصميم انسيابي مزود بفتحات العواكس الضوئية وحساسات التراجع ومشتت هواء سفلي أنيق.',
    specs: [
      { label: 'الموضع', value: 'خلفي' },
      { label: 'الدهان', value: 'جاهز للصباغة' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },

  // 13. مقبض الباب (Poignée de porte)
  {
    id: 20,
    name: 'مقبض باب خارجي أصلي (Poignée de porte)',
    nameFr: 'Poignée de porte extérieure',
    brand: 'VALEO',
    partNumber: 'HND-6621',
    category: 'مقبض الباب',
    aliases: ['Poignée de porte', 'يد الباب', 'مقبض الباب', 'بوانيي دو بورت', 'مقبض خارجي'],
    compat: ['هيونداي أكسنت', 'هيونداي إلنترا', 'كيا ريو', 'كيا سيراتو', 'نيسان صني', 'نيسان ميكرا'],
    price: 3200,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    badge: 'آلية فتح سلسة',
    rating: 4.7,
    description: 'مقبض باب خارجي بآلية سحب معدنية سلسة ومقاومة للكسر، مطلي بدهان مقاوم للخدوش والعوامل الجوية ليطابق لون وشكل الباب الأصلي.',
    specs: [
      { label: 'الموضع', value: 'أمامي / خلفي (يمين أو يسار)' },
      { label: 'المادة', value: 'بوليمر ABS مقوى + أقفال سبائكية' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 37,
    name: 'مقبض باب كروم فاخر مع فتحة المفتاح الذكي',
    nameFr: 'Poignée de porte chromée Keyless',
    brand: 'MAGNETI MARELLI',
    partNumber: 'HND-9910',
    category: 'مقبض الباب',
    aliases: ['Poignée de porte', 'مقبض كروم', 'يد الباب ذكية'],
    compat: ['تويوتا كورولا', 'تويوتا كامري', 'هيونداي توسان', 'كيا سبورتاج', 'فولكسفاغن باسات'],
    price: 4900,
    oldPrice: 5800,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    description: 'مقبض باب مكسو بطبقة كروم لامعة مقاومة للتآكل مزود بحساس القفل الذكي Keyless Go لفتح السيارة بلمسة واحدة.',
    specs: [
      { label: 'التشطيب', value: 'كروم ثلاثي الطبقات' },
      { label: 'الخاصية', value: 'زر / حساس Keyless الدخول الذكي' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 14. غطاء المحرك (Capot)
  {
    id: 23,
    name: 'غطاء المحرك كبوت أصلي (Capot)',
    nameFr: 'Capot moteur en acier avec apprêt',
    brand: 'TRW',
    partNumber: 'CAP-1200',
    category: 'الغطاء الأمامي',
    aliases: ['Capot', 'كبوت', 'غطاء المحرك', 'كابو', 'غطاء أمامي'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'رينو ميغان 4', 'داسيا لوغان', 'داسيا سانديرو', 'داسيا داستر'],
    price: 18900,
    oldPrice: 21500,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    badge: 'محاذاة تامة',
    rating: 4.8,
    description: 'كبوت أصلي مصنوع من الفولاذ الخفيف المعالج بمقاييس المصنع، جاهز للدهان مع نقاط تثبيت دقيقة للمفصلات وقفل الأمان وعازل الصوت والحرارة.',
    specs: [
      { label: 'المادة', value: 'فولاذ مجلفن مضاد للصدأ' },
      { label: 'التجهيز', value: 'طبقة برايمر حامية جاهزة للدهان' },
      { label: 'المعايير', value: 'مطابق لقوانين السلامة عند الاصطدام' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 38,
    name: 'غطاء محرك ألومنيوم خفيف الوزن',
    nameFr: 'Capot moteur allégé en aluminium',
    brand: 'VALEO',
    partNumber: 'CAP-8840',
    category: 'الغطاء الأمامي',
    aliases: ['Capot', 'كبوت ألومنيوم', 'كابو خفيف'],
    compat: ['بيجو 208', 'بيجو 308', 'بيجو 2008', 'فولكسفاغن غولف 7', 'سيات ليون'],
    price: 24500,
    stock: 'كمية محدودة',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    badge: 'خفة وزن وصلابة',
    rating: 4.9,
    description: 'كبوت أمامي مصنوع من سبيكة ألومنيوم خفيفة تقلل وزن مقدمة السيارة وتحسن الثبات واستهلاك الوقود مع عزل حراري استثنائي.',
    specs: [
      { label: 'المادة', value: 'سبائك ألومنيوم 6000' },
      { label: 'الوزن', value: 'أخف بنسبة 45% من الفولاذ التقليدي' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // 15. الآرما تور (Armature)
  {
    id: 24,
    name: 'آرما تور هيكل الواجهة الأمامية (Armature)',
    nameFr: 'Armature de face avant / Support radiateur',
    brand: 'TRW',
    partNumber: 'ARM-3055',
    category: 'الآرما تور',
    aliases: ['Armature', 'آرماتور', 'آرما تور', 'هيكل الواجهة', 'حامل المشعاع والمصابيح', 'قفص'],
    compat: ['فولكسفاغن بولو', 'فولكسفاغن غولف 7', 'سيات ليون', 'سيات إبيزا', 'سكودا أوكتافيا'],
    price: 11200,
    oldPrice: 12900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    badge: 'هيكل متكامل',
    rating: 4.7,
    description: 'آرما تور أمامي مركب من ألياف زجاجية مقواة وفولاذ هيكلي، يعمل كحامل رئيسي للرادياتور ومروحة التبريد والمصابيح والصدام مع امتصاص متطور للصدمات.',
    specs: [
      { label: 'الموضع', value: 'الواجهة الأمامية الكاملة Front End Carrier' },
      { label: 'المادة', value: 'مركب البولي بروبيلين والألياف الزجاجية (PP-GF30) + فولاذ' },
      { label: 'الدقة', value: 'قوالب ليزرية متطابقة بنسبة 100%' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 39,
    name: 'آرما تور واجهة أمامية كاملة',
    nameFr: 'Armature support face avant OEM',
    brand: 'VALEO',
    partNumber: 'ARM-4490',
    category: 'الآرما تور',
    aliases: ['Armature', 'آرماتور', 'واجهة أمامية'],
    compat: ['رينو كليو 4', 'رينو سيمبول', 'داسيا لوغان', 'داسيا سانديرو', 'بيجو 208', 'بيجو 301'],
    price: 9900,
    stock: 'متوفر',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    description: 'واجهة آرما تور أصلية لتثبيت كافة أجزاء مقدمة السيارة بمتانة وصلابة ضد الاهتزازات وعوامل الطريق.',
    specs: [
      { label: 'المادة', value: 'بلاستيك مقوى + شاسيه معدني' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },

  // فلاتر وأقراص فرامل كلاسيكية محفوظة لضمان تكامل المتجر
  {
    id: 1,
    name: 'فلتر زيت المحرك الأصلي',
    brand: 'BOSCH',
    partNumber: 'P-0451103314',
    category: 'فلاتر الزيت',
    aliases: ['Filtre à huile', 'فلتر زيت', 'فيلتر دويل'],
    compat: ['تويوتا كورولا', 'هيونداي أكسنت', 'كيا ريو', 'نيسان صني'],
    price: 1450,
    stock: 'متوفر',
    image: '/img/oil-filter.png',
    rating: 4.8,
    description: 'فلتر زيت أصلي من BOSCH مصمم لحماية المحرك من الشوائب والجزيئات الدقيقة وضمان تدفق مثالي للزيت.',
    specs: [
      { label: 'النوع', value: 'فلتر زيت لولبي' },
      { label: 'قطر الفلتر', value: '76 مم' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 3,
    name: 'فلتر هواء المحرك عالي النقاء',
    brand: 'MANN',
    partNumber: 'C-2543',
    category: 'فلاتر الهواء',
    aliases: ['Filtre à air', 'فلتر هواء', 'فيلتر دير'],
    compat: ['بيجو 301', 'بيجو 208', 'سيتروين C-Elysée', 'رينو سيمبول', 'داسيا لوغان'],
    price: 2600,
    stock: 'متوفر',
    image: '/img/air-filter.png',
    rating: 4.7,
    description: 'فلتر هواء أصلي يمنع دخول الأتربة لغرفة الاحتراق ويحافظ على قوة عزم المحرك واستهلاك وقود مثالي.',
    specs: [
      { label: 'النوع', value: 'فلتر مسطح' },
      { label: 'كفاءة الترشيح', value: '99.9%' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 6,
    name: 'قرص فرامل أمامي مهوّى مثقوب',
    brand: 'BREMBO',
    partNumber: '09.A427.11',
    category: 'أقراص الفرامل',
    aliases: ['Disques de frein', 'ديسك دو فران', 'أقراص فرامل'],
    compat: ['تويوتا ياريس', 'تويوتا كورولا', 'هيونداي i20', 'كيا ريو', 'فولكسفاغن بولو'],
    price: 6800,
    stock: 'متوفر',
    image: '/img/brake-disc.png',
    badge: 'جودة سباقات',
    rating: 4.9,
    description: 'قرص فرامل مهوى ومثقوب لتبريد فوري وأداء فرملة قوي وثابت دون اهتزاز.',
    specs: [
      { label: 'القطر', value: '280 مم' },
      { label: 'السماكة', value: '22 مم' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 8,
    name: 'طقم بطانات فرامل أمامية سيراميك',
    brand: 'BOSCH',
    partNumber: 'BP-0986494124',
    category: 'بطانات الفرامل',
    aliases: ['Plaquettes de frein', 'بلاكيت دو فران', 'بطانات فرامل', 'تيل فرامل'],
    compat: ['بيجو 208', 'بيجو 2008', 'بيجو 301', 'سيتروين C3', 'رينو كليو 4'],
    price: 4600,
    oldPrice: 5900,
    stock: 'متوفر',
    image: '/img/brake-pads.png',
    badge: 'خصم 22%',
    rating: 4.8,
    description: 'طقم بطانات فرامل سيراميك تمنح فرملة هادئة بدون صرير وغبار أقل مع عمر أطول للأقراص.',
    specs: [
      { label: 'العدد', value: '4 قطع (طقم كامل)' },
      { label: 'المادة', value: 'سيراميك متطور' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },
]

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

export const YEARS = Array.from({ length: 18 }, (_, i) => String(2026 - i))

export const ENGINE_TYPES = ['بنزين (Essence)', 'ديزل (Diesel)', 'هايبرد (Hybrid)', 'غاز (GPL)']

export interface VehicleSearch {
  brand: string
  model: string
  year?: string
  engine?: string
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
  volkswagen: ['volkswagen', 'فولكسفاغن'],
  'فولكسفاغن': ['فولكسفاغن', 'volkswagen'],
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
  mercedes: ['mercedes', 'مرسيدس'],
  'مرسيدس': ['مرسيدس', 'mercedes'],
  bmw: ['bmw', 'بي أم دبليو'],
  'بي أم دبليو': ['بي أم دبليو', 'bmw'],
  audi: ['audi', 'أودي'],
  'أودي': ['أودي', 'audi'],
}

export function normalizeSearchText(value: string): string {
  if (!value) return ''

  const arabicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  }

  return value
    .replace(/[٠-٩]/g, (digit) => arabicDigits[digit] ?? digit)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0610-\u061F\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function getVehicleAliases(value: string): string[] {
  const raw = normalizeSearchText(value)
  if (!raw) return []

  const aliases = new Set<string>([raw])
  const lower = raw.toLowerCase()

  Object.entries(VEHICLE_BRAND_ALIASES).forEach(([key, variants]) => {
    if (lower.includes(key) || variants.some((variant) => lower.includes(normalizeSearchText(variant)))) {
      variants.forEach((variant) => aliases.add(normalizeSearchText(variant)))
    }
  })

  return [...aliases].filter(Boolean)
}

export function productHaystack(p: Product): string {
  return [
    p.name,
    p.nameFr ?? '',
    p.brand,
    p.partNumber,
    p.category,
    ...(p.aliases ?? []),
    ...(p.compat ?? []),
  ]
    .map((segment) => normalizeSearchText(segment))
    .join(' ')
}

export function matchesVehicle(p: Product, brand: string, model: string): boolean {
  if (!brand) return true

  const brandAliases = getVehicleAliases(brand)
  const modelAliases = getVehicleAliases(model)

  return p.compat.some((compatValue) => {
    const compatText = normalizeSearchText(compatValue)
    const brandMatches = brandAliases.length === 0 || brandAliases.some((alias) => compatText.includes(alias))
    if (!brandMatches) return false
    if (!model) return true
    return modelAliases.some((alias) => compatText.includes(alias))
  })
}

export function searchProducts(filter: VehicleSearch): Product[] {
  const q = normalizeSearchText(filter.query)
  return PRODUCTS.filter((p) => {
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
  // Always use Latin digits with space thousand-separators
  return n.toLocaleString('fr-FR', {
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

