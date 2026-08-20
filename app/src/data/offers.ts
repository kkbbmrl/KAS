import type { StockStatus } from './products'

export interface OfferFeature {
  icon: string // lucide icon name
  text: string
}

export interface OfferProduct {
  slug: string
  productId: number // links to PRODUCTS array
  title: string // Arabic title for the ad
  subtitle: string // e.g. "متوافق مع بيجو 208"
  nameFr: string
  brand: string
  image: string
  price: number
  oldPrice?: number
  stock: StockStatus
  partNumber: string
  compat: string // short compat string for the hero
  features: OfferFeature[]
  badge?: string
  urgencyText?: string // e.g. "آخر 3 قطع متبقية!"
  deliveryNote?: string
}

export const OFFERS: OfferProduct[] = [
  {
    slug: 'radiateur-peugeot-208',
    productId: 21,
    title: 'مشعاع تبريد أصلي',
    subtitle: 'متوافق مع بيجو 208 / 301 / سيتروين C3',
    nameFr: 'Radiateur Peugeot 208',
    brand: 'VALEO',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
    price: 16500,
    oldPrice: 19000,
    stock: 'متوفر',
    partNumber: 'RAD-8800',
    compat: 'بيجو 208 / 301 / سيتروين C3 / C-Elysée',
    badge: 'الأكثر طلبًا في الصيف',
    urgencyText: 'الكمية محدودة — اطلب الآن!',
    deliveryNote: 'توصيل سريع لجميع ولايات الجزائر خلال 24-48 ساعة',
    features: [
      { icon: 'ShieldCheck', text: 'قطعة أصلية VALEO مضمونة 24 شهرًا' },
      { icon: 'Thermometer', text: 'تبريد فائق للمحرك حتى في الصيف' },
      { icon: 'Truck', text: 'توصيل للباب مع الدفع عند الاستلام' },
      { icon: 'Wrench', text: 'تركيب سهل مطابق لمقاييس الوكالة' },
      { icon: 'Star', text: 'تقييم 4.9/5 من عملائنا' },
    ],
  },
  {
    slug: 'phare-renault-clio4',
    productId: 30,
    title: 'مصباح أمامي أصلي',
    subtitle: 'متوافق مع رينو كليو 4 / سيمبول / داسيا لوغان',
    nameFr: 'Phare Renault Clio 4',
    brand: 'VALEO',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85',
    price: 11800,
    oldPrice: 14500,
    stock: 'متوفر',
    partNumber: 'HL-3012',
    compat: 'رينو كليو 4 / سيمبول / داسيا لوغان / سانديرو',
    badge: 'وضوح ليلي ممتاز',
    urgencyText: 'توصيل خلال 24 ساعة!',
    deliveryNote: 'الدفع عند الاستلام — بدون دفع مسبق',
    features: [
      { icon: 'Lightbulb', text: 'إضاءة LED نهارية + هالوجين عالي الكثافة' },
      { icon: 'ShieldCheck', text: 'قطعة أصلية VALEO مضمونة 18 شهرًا' },
      { icon: 'Truck', text: 'توصيل لجميع الولايات — دفع عند الاستلام' },
      { icon: 'Zap', text: 'توصيل مباشر Plug & Play بدون تعديل' },
      { icon: 'CheckCircle2', text: 'مطابق للمواصفات الأوروبية ECE' },
    ],
  },
  {
    slug: 'verre-phare-peugeot-208',
    productId: 17,
    title: 'زجاج مصباح أمامي شفاف',
    subtitle: 'متوافق مع بيجو 208 / 2008 / 301 / سيتروين C3',
    nameFr: 'Verre de phare Peugeot 208',
    brand: 'HELLA',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
    price: 3900,
    oldPrice: 4800,
    stock: 'متوفر',
    partNumber: 'GL-3309',
    compat: 'بيجو 208 / 2008 / 301 / سيتروين C3 / C-Elysée',
    badge: 'حماية UV — بدون اصفرار',
    urgencyText: 'سعر خاص لفترة محدودة!',
    deliveryNote: 'سعر اقتصادي + توصيل سريع',
    features: [
      { icon: 'Eye', text: 'بولي كربونات شفاف 100% يعيد بريق مصباحك' },
      { icon: 'ShieldCheck', text: 'طبقة UV Protect تمنع الاصفرار لسنوات' },
      { icon: 'Truck', text: 'توصيل لجميع الولايات — دفع عند الاستلام' },
      { icon: 'Zap', text: 'تركيب بسيط في 10 دقائق' },
      { icon: 'Star', text: 'الأكثر مبيعًا في فئة زجاج المصابيح' },
    ],
  },
  {
    slug: 'ventilateur-peugeot-208',
    productId: 22,
    title: 'مروحة تبريد كهربائية',
    subtitle: 'متوافق مع بيجو 208 / 301 / سيتروين C3',
    nameFr: 'Ventilateur Peugeot 208',
    brand: 'BOSCH',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85',
    price: 8700,
    oldPrice: 9900,
    stock: 'متوفر',
    partNumber: 'FAN-4512',
    compat: 'بيجو 208 / 301 / 2008 / سيتروين C-Elysée / C3',
    badge: 'محرك هادئ وقوي',
    urgencyText: 'احمِ محركك قبل حرارة الصيف!',
    deliveryNote: 'توصيل سريع + دفع عند الاستلام',
    features: [
      { icon: 'Thermometer', text: 'تدفق هوائي قوي يمنع ارتفاع حرارة المحرك' },
      { icon: 'Volume2', text: 'محرك بدون ضجيج — هادئ أثناء التشغيل' },
      { icon: 'Truck', text: 'توصيل لجميع الولايات الـ 58' },
      { icon: 'ShieldCheck', text: 'قطعة BOSCH مضمونة 18 شهرًا' },
      { icon: 'Zap', text: 'استهلاك كهربائي منخفض 12V' },
    ],
  },
  {
    slug: 'cache-poussiere-renault-clio4',
    productId: 19,
    title: 'غطاء غبار المفاصل',
    subtitle: 'متوافق مع رينو كليو 4 / داسيا لوغان / سانديرو / داستر',
    nameFr: 'Cache poussière Renault Clio 4',
    brand: 'SKF',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=85',
    price: 1800,
    stock: 'متوفر',
    partNumber: 'DST-2144',
    compat: 'رينو كليو 4 / سيمبول / داسيا لوغان / سانديرو / داستر',
    badge: 'مطاط نيوبرين متين',
    deliveryNote: 'سعر اقتصادي + شحن سريع',
    features: [
      { icon: 'ShieldCheck', text: 'نيوبرين حراري يحمي المفاصل من الأتربة والماء' },
      { icon: 'Zap', text: 'مع مشابك ستانلس ستيل + شحم أصلي' },
      { icon: 'Truck', text: 'توصيل لجميع الولايات الـ 58' },
      { icon: 'Star', text: 'قطعة SKF — ثقة عالمية في قطع الغيار' },
      { icon: 'Wrench', text: 'تركيب سهل ومطابق للأصلي' },
    ],
  },
  {
    slug: 'essuie-glace-bosch',
    productId: 25,
    title: 'طقم ماسحات زجاج سيليكون',
    subtitle: 'مناسب لجميع السيارات الشائعة — تويوتا، هيونداي، كيا',
    nameFr: 'Essuie-glace Bosch Aerotwin',
    brand: 'BOSCH',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad346409?auto=format&fit=crop&w=1200&q=85',
    price: 2400,
    oldPrice: 3100,
    stock: 'متوفر',
    partNumber: 'WIP-600',
    compat: 'تويوتا كورولا / ياريس — هيونداي أكسنت / إلنترا — كيا ريو',
    badge: 'تقنية Aerotwin — بدون صرير',
    urgencyText: 'عرض خاص — خصم 22%',
    deliveryNote: 'أسرع توصيل في الجزائر',
    features: [
      { icon: 'Eye', text: 'مسح نظيف بدون خطوط أو صرير في الأمطار' },
      { icon: 'ShieldCheck', text: 'مطاط جرافيت BOSCH مضمون 12 شهرًا' },
      { icon: 'Truck', text: 'توصيل لجميع الولايات — دفع عند الاستلام' },
      { icon: 'Zap', text: 'تقنية Aerotwin — ضغط متساوٍ على الزجاج' },
      { icon: 'Star', text: 'الماركة الأولى في الجزائر للمساحات' },
    ],
  },
]

export function getOfferBySlug(slug: string): OfferProduct | undefined {
  return OFFERS.find((o) => o.slug === slug)
}
