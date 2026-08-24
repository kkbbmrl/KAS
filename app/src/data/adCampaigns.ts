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

/**
 * Local placeholder for a product with no image. Never a stock photo from an
 * image host — the storefront must only show the owner's own photography.
 */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f4f4f5'/%3E%3Cg fill='none' stroke='%23a1a1aa' stroke-width='6' stroke-linecap='round'%3E%3Ccircle cx='200' cy='140' r='42'/%3E%3Cpath d='M200 74v-16M200 222v-16M258 140h16M126 140h-16M243 97l11-11M146 183l-11 11M243 183l11 11M146 97l-11-11'/%3E%3C/g%3E%3C/svg%3E"

/**
 * Builds an ad landing page configuration from a real product or landing offer.
 *
 * There are deliberately no bundled campaign presets: every campaign resolves
 * from the owner's `landing_offers` table (Admin → Marketing → Landing Pages) via
 * GET /api/v1/offers/:slug. A dead link must render a not-found screen rather
 * than a sample campaign advertising a product the owner never listed.
 */
export function buildCampaignFromProduct(product: Product | any, campaignSlug?: string): AdCampaignConfig {
  const price = Number(product.price ?? product.customPrice ?? 0)
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : undefined
  const diff = oldPrice && oldPrice > price ? oldPrice - price : 0

  const primaryImg = product.image || product.images?.[0] || PLACEHOLDER_IMAGE

  const gallery =
    Array.isArray(product.images) && product.images.length > 0 ? product.images : [primaryImg]

  const compatList = Array.isArray(product.compat)
    ? product.compat.join(' / ')
    : typeof product.compat === 'string' && product.compat
      ? product.compat
      : 'متوافق مع عدة موديلات'

  const displayName = product.name || product.nameAr || product.title || 'قطعة غيار'

  return {
    slug: campaignSlug || product.slug || `product-${product.id}`,
    productId: product.productId ?? product.id,
    productName: displayName,
    productNameFr: product.nameFr || '',
    brand: product.brand || '',
    partNumber: product.partNumber || product.base_part_number || product.sku || '',
    sku: product.sku || product.partNumber || '',
    category: product.category || 'قطع الغيار',
    badge: product.badge || undefined,
    heroKicker: product.urgencyText || 'عرض ترويجي مع توصيل سريع',
    heroTitle: product.title || `${displayName} الأصلية لسيارتك`,
    heroSubtitle:
      product.subtitle ||
      product.description ||
      'قطعة غيار عالية الجودة مطابقة لمواصفات الوكالة، تضمن الأداء والموثوقية لسيارتك.',
    heroBullets: [
      product.brand ? `قطعة غيار أصلية ومضمونة من علامة ${product.brand}` : 'قطعة غيار أصلية ومضمونة',
      'مطابقة لمقاسات الوكالة وتركيب مباشر بدون تعديل',
      'توصيل سريع ومضمون لـ 58 ولاية خلال 24–48 ساعة',
      'حق المعاينة والفحص عند الباب قبل دفع أي دينار',
    ],
    price,
    oldPrice,
    savingsText: diff > 0 ? `وفر ${diff.toLocaleString('fr-FR')} دج اليوم` : undefined,
    stock: (product.stock as StockStatus) || 'متوفر',
    stockCountText: 'متوفر في المخزن — جاهز للشحن',
    urgencyBadge: product.urgencyText || undefined,
    deliveryNote:
      product.deliveryNote ||
      'توصيل مأمون لباب المنزل لجميع ولايات الجزائر مع الدفع عند الاستلام',
    primaryImage: primaryImg,
    galleryImages: gallery,
    features:
      Array.isArray(product.features) && product.features.length > 0
        ? product.features.map((f: any) => ({
            icon: f.icon || 'CheckCircle2',
            title: f.text || f.title || '',
            desc: f.desc || '',
          }))
        : [
            { icon: 'ShieldCheck', title: 'جودة معتمدة وضمان رسمي', desc: 'كل قطعة تُفحص بدقة قبل الشحن وتأتي مع ضمان ضد عيوب الصناعة.' },
            { icon: 'Wrench', title: 'تركيب مطابق للوكالة', desc: 'أبعاد دقيقة ومنافذ تثبيت مطابقة لضمان سهولة التركيب بدون تعديل.' },
            { icon: 'Truck', title: 'توصيل لباب منزلك لـ 58 ولاية', desc: 'خدمة توصيل سريعة تغطي كامل التراب الوطني والدفع عند الاستلام.' },
            { icon: 'Headphones', title: 'استشارة تقنية مجانية', desc: 'فريقنا جاهز للتأكد من توافق القطعة مع رقم الشاسيه أو بطاقة السيارة.' },
          ],
    compatibleVehicles: [
      { make: 'السيارات المتوافقة', models: [compatList], years: 'جميع السنوات المتوافقة', engine: 'حسب مواصفات المحرك' },
    ],
    specifications:
      Array.isArray(product.specs) && product.specs.length > 0
        ? product.specs.map((s: any) => ({ label: s.label, value: s.value }))
        : [
            { label: 'رقم القطعة (PN)', value: product.partNumber || product.sku || '—' },
            { label: 'الماركة والمصنّع', value: product.brand || '—' },
            { label: 'الفئة', value: product.category || 'قطع الغيار' },
            { label: 'الضمان', value: 'ضمان استبدال رسمي من KAS Auto Parts' },
          ],
    variants:
      Array.isArray(product.variants) && product.variants.length > 1
        ? product.variants.map((v: any) => ({
            id: String(v.id || v.sku),
            label: v.label || v.label_ar || 'متغير',
            partNumber: v.partNumber || v.part_number,
            price: Number(v.price ?? price),
            oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
            stock: v.stock || 'متوفر',
          }))
        : undefined,
    // Reviews are only shown when they are real, owner-supplied testimonials.
    reviews: Array.isArray(product.reviews) ? product.reviews : undefined,
    faq: [
      { q: 'كيف أتأكد من أن هذه القطعة تركب في سيارتي؟', a: 'يمكنك إرسال رقم الشاسيه (Châssis / VIN) أو صورة البطاقة الرمادية عبر واتساب وسيتأكد فريقنا فوراً من التوافق.' },
      { q: 'كيف يتم الدفع؟', a: 'الدفع نقداً عند الاستلام بعد معاينة الطرد والتأكد من سلامة القطعة.' },
      { q: 'كم تستغرق مدة التوصيل؟', a: 'من 24 إلى 48 ساعة لجميع ولايات الوطن.' },
      { q: 'ماذا لو كانت القطعة غير متوافقة؟', a: 'لك حق الاستبدال أو الإرجاع في حال عدم توافق القطعة.' },
    ],
  }
}
