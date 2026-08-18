export type StockStatus = 'متوفر' | 'كمية محدودة' | 'غير متوفر'

export interface Product {
  id: number
  name: string
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
}

export const CATEGORIES: { name: string; icon: string; available: boolean }[] = [
  { name: 'فلاتر الزيت', icon: 'Droplet', available: true },
  { name: 'فلاتر الهواء', icon: 'Wind', available: true },
  { name: 'أقراص الفرامل', icon: 'Disc3', available: true },
  { name: 'بطانات الفرامل', icon: 'Layers', available: true },
  { name: 'المساعدات', icon: 'MoveVertical', available: false },
  { name: 'البطاريات', icon: 'BatteryCharging', available: false },
  { name: 'شمعات الإشعال', icon: 'Zap', available: false },
  { name: 'سيور المحرك', icon: 'Cable', available: false },
  { name: 'قطع المحرك', icon: 'Cog', available: false },
  { name: 'قطع التعليق', icon: 'CarFront', available: false },
  { name: 'كهرباء السيارة', icon: 'PlugZap', available: false },
  { name: 'المصابيح', icon: 'Lightbulb', available: false },
  { name: 'المرايا', icon: 'Scan', available: false },
  { name: 'الإكسسوارات', icon: 'Sparkles', available: false },
  { name: 'زيوت المحرك', icon: 'Droplets', available: false },
  { name: 'قطع التبريد', icon: 'Snowflake', available: false },
  { name: 'قطع ناقل الحركة', icon: 'Settings2', available: false },
]

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'فلتر زيت المحرك الأصلي',
    brand: 'BOSCH',
    partNumber: 'P-0451103314',
    category: 'فلاتر الزيت',
    compat: ['تويوتا كورولا', 'هيونداي أكسنت', 'كيا ريو'],
    price: 1450,
    stock: 'متوفر',
    image: '/img/oil-filter.png',
    rating: 4.8,
    description:
      'فلتر زيت أصلي من BOSCH مصمم لحماية المحرك من الشوائب والجزيئات الدقيقة. يضمن تدفقًا مثاليًا للزيت وترشيحًا عالي الكفاءة حتى في ظروف القيادة القاسية، مما يطيل عمر المحرك ويحافظ على أدائه.',
    specs: [
      { label: 'النوع', value: 'فلتر زيت لولبي' },
      { label: 'قطر الفلتر', value: '76 مم' },
      { label: 'الارتفاع', value: '89 مم' },
      { label: 'كفاءة الترشيح', value: '99%' },
      { label: 'بلد التصنيع', value: 'ألمانيا' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 2,
    name: 'فلتر زيت عالي الأداء',
    brand: 'MANN',
    partNumber: 'W712-95',
    category: 'فلاتر الزيت',
    compat: ['بيجو 208', 'بيجو 301', 'رينو كليو', 'سيتروين C3'],
    price: 1750,
    stock: 'متوفر',
    image: '/img/oil-filter.png',
    flip: true,
    rating: 4.9,
    description:
      'فلتر زيت MANN الألماني بجودة التصنيع الأصلية OEM. وسط ترشيح متطور يحافظ على نظافة الزيت لفترات أطول، مع صمام مضاد للرجوع يحمي المحرك عند التشغيل البارد.',
    specs: [
      { label: 'النوع', value: 'فلتر زيت لولبي' },
      { label: 'صمام anti-retour', value: 'متوفر' },
      { label: 'ضغط التشغيل', value: 'حتى 6 بار' },
      { label: 'كفاءة الترشيح', value: '99.5%' },
      { label: 'بلد التصنيع', value: 'ألمانيا' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 3,
    name: 'فلتر هواء المحرك',
    brand: 'MANN',
    partNumber: 'C-2543',
    category: 'فلاتر الهواء',
    compat: ['بيجو 301', 'سيتروين C-Elysée', 'رينو سيمبول'],
    price: 2600,
    stock: 'متوفر',
    image: '/img/air-filter.png',
    rating: 4.7,
    description:
      'فلتر هواء أصلي يمنع دخول الغبار والأتربة إلى غرفة الاحتراق، مما يحسّن استهلاك الوقود ويحافظ على قوة المحرك. ورق ترشيح عالي الجودة بإطار مطاطي محكم الإغلاق.',
    specs: [
      { label: 'الشكل', value: 'مستطيل مسطح' },
      { label: 'الأبعاد', value: '254 × 165 × 58 مم' },
      { label: 'كفاءة الترشيح', value: '99.9%' },
      { label: 'دورة التغيير', value: 'كل 20,000 كم' },
      { label: 'بلد التصنيع', value: 'ألمانيا' },
      { label: 'الضمان', value: '12 شهرًا' },
    ],
  },
  {
    id: 4,
    name: 'فلتر هواء رياضي عالي التدفق',
    brand: 'K&N',
    partNumber: '33-2865',
    category: 'فلاتر الهواء',
    compat: ['فولكسفاغن غولف 7', 'سيات ليون', 'أودي A3'],
    price: 4900,
    stock: 'كمية محدودة',
    image: '/img/air-filter.png',
    flip: true,
    badge: 'الأكثر مبيعًا',
    rating: 5,
    description:
      'فلتر هواء رياضي قابل للغسل وإعادة الاستخدام، يزيد تدفق الهواء إلى المحرك بنسبة تصل إلى 50% لتحسين الاستجابة والأداء. الخيار الأول لعشاق القيادة الرياضية.',
    specs: [
      { label: 'النوع', value: 'فلتر رياضي قابل للغسل' },
      { label: 'زيادة التدفق', value: 'حتى 50%' },
      { label: 'العمر الافتراضي', value: '1.6 مليون كم' },
      { label: 'التنظيف', value: 'كل 80,000 كم' },
      { label: 'بلد التصنيع', value: 'الولايات المتحدة' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 5,
    name: 'فلتر مكيف المقصورة',
    brand: 'BOSCH',
    partNumber: 'R-2546',
    category: 'فلاتر الهواء',
    compat: ['هيونداي i20', 'كيا بيكانتو', 'نيسان ميكرا'],
    price: 1900,
    stock: 'متوفر',
    image: '/img/air-filter.png',
    rating: 4.6,
    description:
      'فلتر مقصورة بطبقة كربون نشط ينقّي هواء المقصورة من الغبار وحبوب اللقاح والروائح، لقيادة صحية ومريحة لك ولعائلتك.',
    specs: [
      { label: 'النوع', value: 'فلتر كربون نشط' },
      { label: 'الأبعاد', value: '235 × 190 × 30 مم' },
      { label: 'كفاءة الترشيح', value: 'PM2.5 حتى 99%' },
      { label: 'دورة التغيير', value: 'كل 15,000 كم' },
      { label: 'بلد التصنيع', value: 'ألمانيا' },
      { label: 'الضمان', value: '6 أشهر' },
    ],
  },
  {
    id: 6,
    name: 'قرص فرامل أمامي مهوّى مثقوب',
    brand: 'BREMBO',
    partNumber: '09.A427.11',
    category: 'أقراص الفرامل',
    compat: ['تويوتا ياريس', 'هيونداي i20', 'كيا ريو'],
    price: 6800,
    stock: 'متوفر',
    image: '/img/brake-disc.png',
    badge: 'جودة سباقات',
    rating: 4.9,
    description:
      'قرص فرامل BREMBO مهوّى ومثقوب بتصميم رياضي يمنح تبريدًا أسرع وثباتًا في الأداء عند الفرملة القوية المتكررة. طلاء مقاوم للصدأ وتوازن ديناميكي دقيق لقيادة آمنة وثقة مطلقة.',
    specs: [
      { label: 'القطر الخارجي', value: '280 مم' },
      { label: 'السماكة', value: '22 مم' },
      { label: 'النوع', value: 'مهوّى ومثقوب' },
      { label: 'عدد الفتحات', value: '5 براغي' },
      { label: 'بلد التصنيع', value: 'إيطاليا' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 7,
    name: 'قرص فرامل خلفي',
    brand: 'TRW',
    partNumber: 'DF-4294',
    category: 'أقراص الفرامل',
    compat: ['رينو سيمبول', 'داسيا لوغان', 'نيسان صني'],
    price: 5400,
    stock: 'متوفر',
    image: '/img/brake-disc.png',
    flip: true,
    rating: 4.7,
    description:
      'قرص فرامل خلفي من TRW بمعايير التصنيع الأصلية، سطح مصقول بدقة لتوزيع مثالي لضغط الفرملة وتقليل الاهتزاز والضوضاء.',
    specs: [
      { label: 'القطر الخارجي', value: '260 مم' },
      { label: 'السماكة', value: '9 مم' },
      { label: 'النوع', value: 'مصمت' },
      { label: 'عدد الفتحات', value: '4 براغي' },
      { label: 'بلد التصنيع', value: 'إسبانيا' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
  {
    id: 8,
    name: 'طقم بطانات فرامل أمامية سيراميك',
    brand: 'BOSCH',
    partNumber: 'BP-0986494124',
    category: 'بطانات الفرامل',
    compat: ['بيجو 208', 'بيجو 2008', 'سيتروين C3'],
    price: 4600,
    oldPrice: 5900,
    stock: 'متوفر',
    image: '/img/brake-pads.png',
    badge: 'خصم 22%',
    rating: 4.8,
    description:
      'طقم بطانات سيراميك (4 قطع) بخلطة متطورة تمنح فرملة هادئة بدون صرير، غبار أقل، وعمر أطول للبطانات والأقراص معًا. أداء ثابت في جميع درجات الحرارة.',
    specs: [
      { label: 'عدد القطع', value: '4 بطانات (طقم كامل)' },
      { label: 'المادة', value: 'سيراميك متطور' },
      { label: 'مستوى الضوضاء', value: 'منخفض جدًا' },
      { label: 'درجة حرارة التشغيل', value: 'حتى 650°' },
      { label: 'بلد التصنيع', value: 'ألمانيا' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },
  {
    id: 9,
    name: 'طقم بطانات فرامل خلفية',
    brand: 'TRW',
    partNumber: 'GDB-1621',
    category: 'بطانات الفرامل',
    compat: ['هيونداي أكسنت', 'كيا ريو', 'نيسان صني'],
    price: 3400,
    stock: 'كمية محدودة',
    image: '/img/brake-pads.png',
    flip: true,
    rating: 4.6,
    description:
      'طقم بطانات خلفية أصلي من TRW يضمن توازنًا مثاليًا بين قوة الفرملة والراحة، مع لوحات خلفية مقاومة للحرارة والتآكل.',
    specs: [
      { label: 'عدد القطع', value: '4 بطانات (طقم كامل)' },
      { label: 'المادة', value: 'شبه معدنية محسّنة' },
      { label: 'معامل الاحتكاك', value: '0.42' },
      { label: 'درجة حرارة التشغيل', value: 'حتى 600°' },
      { label: 'بلد التصنيع', value: 'إسبانيا' },
      { label: 'الضمان', value: '18 شهرًا' },
    ],
  },
  {
    id: 10,
    name: 'طقم فرامل كامل أمامي (قرصان + بطانات)',
    brand: 'BREMBO',
    partNumber: 'KIT-BR-440',
    category: 'أقراص الفرامل',
    compat: ['تويوتا كورولا', 'هيونداي إلنترا', 'كيا سيراتو'],
    price: 11900,
    oldPrice: 13900,
    stock: 'متوفر',
    image: '/img/brake-disc.png',
    badge: 'عرض خاص',
    rating: 5,
    description:
      'طقم متكامل يشمل قرصين أماميين مهوّين وطقم بطانات سيراميك أصلية. كل ما تحتاجه لتجديد نظام الفرملة الأمامي دفعة واحدة وبسعر مخفّض.',
    specs: [
      { label: 'محتوى الطقم', value: 'قرصان + 4 بطانات' },
      { label: 'قطر القرص', value: '280 مم' },
      { label: 'مادة البطانات', value: 'سيراميك' },
      { label: 'التركيب', value: 'مباشر بدون تعديل' },
      { label: 'بلد التصنيع', value: 'إيطاليا' },
      { label: 'الضمان', value: '24 شهرًا' },
    ],
  },
]

export const CAR_BRANDS: Record<string, string[]> = {
  'تويوتا': ['كورولا', 'ياريس', 'كامري', 'هيلوكس'],
  'رينو': ['كليو', 'سيمبول', 'ميغان', 'داستر'],
  'بيجو': ['208', '301', '2008', '508'],
  'فولكسفاغن': ['غولف 7', 'بولو', 'باسات', 'تيجوان'],
  'مرسيدس': ['Class A', 'Class C', 'GLA'],
  'BMW': ['الفئة 1', 'الفئة 3', 'X1'],
  'هيونداي': ['أكسنت', 'إلنترا', 'i20', 'توسان'],
  'كيا': ['ريو', 'سيراتو', 'بيكانتو', 'سبورتاج'],
  'فورد': ['فييستا', 'فوكس', 'إيكوسبورت'],
  'نيسان': ['صني', 'ميكرا', 'قشقاي', 'جوك'],
}

export const YEARS = Array.from({ length: 17 }, (_, i) => String(2026 - i))

export const ENGINE_TYPES = ['بنزين', 'ديزل', 'هايبرد', 'غاز طبيعي']

export function formatPrice(n: number): string {
  return n.toLocaleString('en-US').replace(/,/g, ' ') + ' د.ج'
}

export const WHATSAPP_NUMBER = '213555123456'
export const PHONE_DISPLAY = '0555 12 34 56'
export const EMAIL = 'contact@khaledautospart.dz'
export const ADDRESS = 'شارع الاستقلال رقم 42، الجزائر العاصمة'
export const WORK_HOURS = 'السبت – الخميس: 8:30 – 18:00'
