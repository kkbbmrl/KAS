import { useEffect, useState, useMemo } from 'react'
import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  Edit,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Layout,
  Loader2,
  Megaphone,
  Palette,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react'

import {
  fetchAdminCampaigns,
  createAdminCampaign,
  fetchAdminLandingPages,
  fetchAdminLandingPageDetails,
  createAdminLandingPage,
  updateAdminLandingPage,
  deleteAdminLandingPage,
  duplicateAdminLandingPage,
  toggleAdminLandingPage,
  fetchAdminProducts,
} from '@/lib/adminApi'
import { formatPrice } from '@/data/products'
import { resolveImageUrl } from '@/lib/api'

// ─── PRESET CONVERSION THEMES ───
// Theme definitions — each theme includes inline preview styles and preset copy
const CONVERSION_THEMES = [
  {
    id: 'oem-factory',
    name: 'المصنع الأصلي (OEM Factory)',
    tagline: 'للقطع الأصلية، التبريد، الكهرباء، المحرك',
    icon: ShieldCheck,
    // Preview inline styles
    preview: {
      bg: '#0f172a',                       // slate-900
      cardBg: '#1e293b',                   // slate-800
      border: '#334155',                   // slate-700
      accentColor: '#3b82f6',              // blue-500
      accentBadgeBg: 'rgba(59,130,246,0.15)',
      accentBadgeBorder: 'rgba(59,130,246,0.35)',
      accentBadgeText: '#93c5fd',          // blue-300
      ctaBg: '#2563eb',                    // blue-600
      ctaShadow: 'rgba(37,99,235,0.4)',
      priceColor: '#93c5fd',
      featureCheck: '#60a5fa',
    },
    // Auto-fill preset copy when theme selected
    presets: {
      badgeText: 'قطعة أصلية 100% — ضمان صناعي 24 شهراً',
      urgencyText: 'الكمية محدودة — توصيل فوري لـ 58 ولاية',
      deliveryNote: 'دفع عند الاستلام والمعاينة — شحن لباب منزلك',
    },
  },
  {
    id: 'sport-performance',
    name: 'الأداء الرياضي (Sport Performance)',
    tagline: 'للفرامل Brembo، التعليق، العوادم الرياضية',
    icon: Flame,
    preview: {
      bg: '#1c0a0a',
      cardBg: '#2d1010',
      border: '#7f1d1d',
      accentColor: '#ef4444',
      accentBadgeBg: 'rgba(239,68,68,0.15)',
      accentBadgeBorder: 'rgba(239,68,68,0.35)',
      accentBadgeText: '#fca5a5',
      ctaBg: '#dc2626',
      ctaShadow: 'rgba(220,38,38,0.45)',
      priceColor: '#fca5a5',
      featureCheck: '#f87171',
    },
    presets: {
      badgeText: 'أداء رياضي عالي — معتمد من السباقات الدولية',
      urgencyText: 'آخر 3 قطع في المخزن — اطلب الآن قبل النفاذ!',
      deliveryNote: 'تركيب مباشر بدون تعديل — ضمان الأداء الكامل',
    },
  },
  {
    id: 'flash-deal',
    name: 'عرض ترويجي سريع (Flash Deal)',
    tagline: 'للتصفيات الموسمية والتخفيضات الكبرى',
    icon: Zap,
    preview: {
      bg: '#1c1000',
      cardBg: '#2d1c00',
      border: '#92400e',
      accentColor: '#f59e0b',
      accentBadgeBg: 'rgba(245,158,11,0.15)',
      accentBadgeBorder: 'rgba(245,158,11,0.35)',
      accentBadgeText: '#fcd34d',
      ctaBg: '#d97706',
      ctaShadow: 'rgba(217,119,6,0.45)',
      priceColor: '#fcd34d',
      featureCheck: '#fbbf24',
    },
    presets: {
      badgeText: '⚡ تخفيض خاص لفترة محدودة — ادخر أكثر اليوم',
      urgencyText: '🔥 العرض ينتهي قريباً — لا تفوّت الفرصة!',
      deliveryNote: 'الشحن مجاني على الطلبات فوق 5000 دج — دفع عند الاستلام',
    },
  },
  {
    id: 'eco-maintenance',
    name: 'باقة الصيانة (Maintenance Pack)',
    tagline: 'للفلاتر، البواجي، الزيوت، وباقات الصيانة',
    icon: Wrench,
    preview: {
      bg: '#071916',
      cardBg: '#0d2b21',
      border: '#065f46',
      accentColor: '#10b981',
      accentBadgeBg: 'rgba(16,185,129,0.15)',
      accentBadgeBorder: 'rgba(16,185,129,0.35)',
      accentBadgeText: '#6ee7b7',
      ctaBg: '#059669',
      ctaShadow: 'rgba(5,150,105,0.4)',
      priceColor: '#6ee7b7',
      featureCheck: '#34d399',
    },
    presets: {
      badgeText: 'باقة صيانة كاملة — كل ما تحتاجه في مكان واحد',
      urgencyText: 'صيانتك في الموعد — أطل عمر سيارتك الآن',
      deliveryNote: 'اطلب اليوم والتركيب غداً — 58 ولاية بدون تنقل',
    },
  },
] as const

const PRESET_BADGES = [
  'قطعة أصلية 100% — ضمان 24 شهراً',
  'الأكثر طلباً في الجزائر',
  'تخفيض خاص لفترة محدودة',
  'شحن فوري لـ 58 ولاية',
  'ضمان استبدال معتمد',
  'آخر 5 قطع في المخزن',
]

const ICON_CHOICES = [
  'ShieldCheck',
  'Truck',
  'Wrench',
  'ThermometerSnowflake',
  'Zap',
  'Star',
  'CheckCircle2',
  'Eye',
  'Flame',
]

interface OfferFeatureItem {
  icon: string
  text: string
}

export default function AdminMarketing() {
  const [tab, setTab] = useState<'landing_pages' | 'campaigns'>('landing_pages')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [landingPages, setLandingPages] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [landingSearch, setLandingSearch] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Builder Modal (Create / Edit)
  const [builderModalOpen, setBuilderModalOpen] = useState(false)
  const [editOfferId, setEditOfferId] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [saving, setSaving] = useState(false)
  const [builderError, setBuilderError] = useState<string | null>(null)
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null)

  // Campaign Modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [cForm, setCForm] = useState({
    name: '',
    platform: 'facebook',
    utmSource: 'facebook',
    utmMedium: 'cpc',
    utmCampaign: '',
    budget: 35000,
  })

  // Visual Offer Builder State
  const [selectedTheme, setSelectedTheme] = useState('oem-factory')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [form, setForm] = useState({
    slug: '',
    productId: '',
    titleAr: '',
    subtitleAr: '',
    titleFr: '',
    badgeText: 'قطعة أصلية 100% — ضمان 24 شهراً',
    urgencyText: 'الكمية محدودة — شحن فوري لـ 58 ولاية',
    deliveryNote: 'توصيل لباب منزلك لـ 58 ولاية — الدفع بعد المعاينة والفحص',
    customPrice: 15000,
    customOldPrice: 18500,
    heroImageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
    features: [
      { icon: 'ShieldCheck', text: 'قطعة غيار أصلية مع وصل ضمان رسمي مختوم' },
      { icon: 'Truck', text: 'توصيل سريع لباب منزلك لـ 58 ولاية والدفع عند الاستلام' },
      { icon: 'Wrench', text: 'مطابق لمواصفات ومقاسات الوكالة مع تركيب مباشر' },
      { icon: 'Eye', text: 'حق المعاينة وفحص القطعة عند الباب قبل دفع أي دينار' },
    ] as OfferFeatureItem[],
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetchAdminLandingPages().catch(() => []),
      fetchAdminCampaigns().catch(() => []),
      fetchAdminProducts({ limit: 150 }).catch(() => ({ products: [] })),
    ])
      .then(([landRes, campRes, prodRes]) => {
        setLandingPages(landRes || [])
        setCampaigns(campRes || [])
        setProducts(prodRes?.products || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered products for quick auto-fill picker
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return products.slice(0, 15)
    const term = productSearchTerm.toLowerCase()
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.partNumber?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term)
      )
      .slice(0, 15)
  }, [products, productSearchTerm])

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === form.productId)
  }, [products, form.productId])

  // Handle 1-Click Product Selection & Template Auto-fill
  const handleSelectProduct = (p: any) => {
    const rawPrice = Number(p.price || 15000)
    const oldPrice = p.oldPrice ? Number(p.oldPrice) : Math.round(rawPrice * 1.22)
    const cleanBrand = (p.brand || 'VALEO').toUpperCase()
    const cleanPart = (p.partNumber || 'PART').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

    setForm((prev) => ({
      ...prev,
      productId: p.id,
      slug: prev.slug || `offer-${cleanPart}-${cleanBrand.toLowerCase()}`,
      titleAr: prev.titleAr || `${p.name} الأصلي (${cleanBrand})`,
      subtitleAr:
        prev.subtitleAr ||
        `قطعة غيار أصلية ومضمونة من علامة ${cleanBrand} مصنعة وفق أعلى معايير الجودة لسيارتك.`,
      titleFr: prev.titleFr || p.nameFr || p.name,
      customPrice: rawPrice,
      customOldPrice: oldPrice,
      heroImageUrl: p.image || prev.heroImageUrl,
      features: [
        { icon: 'ShieldCheck', text: `قطعة أصلية معتمدة من علامة ${cleanBrand} مع ضمان رسمي` },
        { icon: 'Truck', text: 'توصيل سريع لـ 58 ولاية مع حق المعاينة والفحص عند الباب' },
        { icon: 'Wrench', text: `رقم القطعة الأصلي (${p.partNumber || 'OEM'}) تركيب مباشر بدون تعديل` },
        { icon: 'Eye', text: 'الدفع نقداً عند استلام الطرد والتأكد من سلامة القطعة' },
      ],
    }))
    setProductSearchTerm('')
  }

  const openCreateBuilder = () => {
    setEditOfferId(null)
    setBuilderError(null)
    setBuilderSuccess(null)

    const defaultProd = products[0]
    setForm({
      slug: `offer-${Date.now().toString().slice(-5)}`,
      productId: defaultProd?.id || '',
      titleAr: defaultProd ? `${defaultProd.name} الأصلي` : 'مشعاع تبريد محرك أصلي VALEO',
      subtitleAr: 'مطابق تماماً لمواصفات الوكالة مع ضمان استبدال رسمي لمدة 24 شهراً كاملاً.',
      titleFr: defaultProd?.nameFr || 'Radiateur de Refroidissement Moteur',
      badgeText: 'قطعة أصلية 100% — ضمان 24 شهراً',
      urgencyText: 'الكمية محدودة — اطلب الآن!',
      deliveryNote: 'توصيل سريع لـ 58 ولاية — الدفع بعد المعاينة والفحص',
      customPrice: defaultProd?.price || 16500,
      customOldPrice: defaultProd?.oldPrice || 19500,
      heroImageUrl: defaultProd?.image || 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
      features: [
        { icon: 'ShieldCheck', text: 'قطعة غيار أصلية مع وصل ضمان رسمي مختوم' },
        { icon: 'Truck', text: 'توصيل سريع لباب منزلك لـ 58 ولاية والدفع عند الاستلام' },
        { icon: 'Wrench', text: 'مطابق لمواصفات ومقاسات الوكالة مع تركيب مباشر' },
        { icon: 'Eye', text: 'حق المعاينة وفحص القطعة عند الباب قبل دفع أي دينار' },
      ],
    })
    setBuilderModalOpen(true)
  }

  const openEditBuilder = async (id: string) => {
    setEditOfferId(id)
    setBuilderError(null)
    setBuilderSuccess(null)

    // Attempt to load full detail from new endpoint; fall back to list data if unavailable
    const populateForm = (details: any) => {
      setForm({
        slug: details.slug || '',
        productId: details.productId || '',
        titleAr: details.titleAr || details.title || '',
        subtitleAr: details.subtitleAr || details.subtitle || '',
        titleFr: details.titleFr || details.nameFr || '',
        badgeText: details.badgeText || details.badge || 'أصلي ومضمون 100%',
        urgencyText: details.urgencyText || 'الكمية محدودة — اطلب الآن!',
        deliveryNote: details.deliveryNote || 'توصيل سريع لـ 58 ولاية — الدفع بعد المعاينة',
        customPrice: Number(details.customPrice || details.price || 15000),
        customOldPrice: Number(details.customOldPrice || details.oldPrice || 0),
        heroImageUrl: details.heroImageUrl || details.image || '',
        features:
          Array.isArray(details.features) && details.features.length > 0
            ? details.features
            : [
                { icon: 'ShieldCheck', text: 'قطعة غيار أصلية مع وصل ضمان رسمي مختوم' },
                { icon: 'Truck', text: 'توصيل سريع لباب منزلك لـ 58 ولاية والدفع عند الاستلام' },
                { icon: 'Wrench', text: 'مطابق لمواصفات ومقاسات الوكالة مع تركيب مباشر' },
                { icon: 'Eye', text: 'حق المعاينة وفحص القطعة عند الباب قبل دفع أي دينار' },
              ],
      })
      setBuilderModalOpen(true)
    }

    try {
      const details = await fetchAdminLandingPageDetails(id)
      populateForm(details)
    } catch {
      // Endpoint not yet available on production backend — use list data as fallback
      const cached = landingPages.find((l) => l.id === id)
      if (cached) {
        populateForm(cached)
      } else {
        setBuilderError('تعذّر تحميل بيانات الصفحة. يرجى المحاولة مجدداً.')
        setBuilderModalOpen(true)
      }
    }
  }

  const handleSaveBuilder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setBuilderError(null)
    setBuilderSuccess(null)

    if (!form.slug.trim()) {
      setBuilderError('يرجى تحديد رابط الصفحة (Slug)')
      setSaving(false)
      return
    }
    if (!form.productId) {
      setBuilderError('يرجى اختيار المنتج من الكتالوج')
      setSaving(false)
      return
    }
    if (!form.titleAr.trim()) {
      setBuilderError('يرجى كتابة عنوان العرض الترويجي')
      setSaving(false)
      return
    }

    try {
      if (editOfferId) {
        await updateAdminLandingPage(editOfferId, form)
        setBuilderSuccess('تم تحديث صفحة الهبوط بنجاح!')
      } else {
        await createAdminLandingPage(form)
        setBuilderSuccess('تم نشر صفحة الهبوط بنجاح!')
      }
      setTimeout(() => {
        setBuilderModalOpen(false)
        loadData()
      }, 600)
    } catch (err: any) {
      setBuilderError(err.message || 'حدث خطأ أثناء حفظ صفحة الهبوط')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف صفحة الهبوط هذه نهائياً؟')) return
    try {
      await deleteAdminLandingPage(id)
      loadData()
    } catch (err: any) {
      alert(err.message || 'فشل حذف الصفحة')
    }
  }

  const handleDuplicateOffer = async (id: string) => {
    try {
      await duplicateAdminLandingPage(id)
      loadData()
    } catch (err: any) {
      alert(err.message || 'فشل تكرار الصفحة')
    }
  }

  const handleToggleOffer = async (id: string) => {
    try {
      await toggleAdminLandingPage(id)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, { icon: 'ShieldCheck', text: '' }],
    }))
  }

  const handleRemoveFeature = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }))
  }

  const handleFeatureChange = (idx: number, field: 'icon' | 'text', val: string) => {
    setForm((prev) => {
      const next = [...prev.features]
      next[idx] = { ...next[idx], [field]: val }
      return { ...prev, features: next }
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(label)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const filteredLandingPages = useMemo(() => {
    if (!landingSearch.trim()) return landingPages
    const q = landingSearch.toLowerCase()
    return landingPages.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.slug?.toLowerCase().includes(q) ||
        l.productName?.toLowerCase().includes(q) ||
        l.partNumber?.toLowerCase().includes(q)
    )
  }, [landingPages, landingSearch])

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
            <Megaphone className="h-3.5 w-3.5" /> نظام إدارة العروض وصفحات الهبوط الإعلانية
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            منشئ صفحات الهبوط والقوالب (No-Code Offer Builder)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            أنشئ صفحات هبوط إعلانية عالية التحويل لحملاتك بدون كتابة أي سطر كود
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateBuilder}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>إنشاء صفحة هبوط جديدة</span>
          </button>
          <button
            onClick={loadData}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setTab('landing_pages')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 font-cairo text-xs font-black transition-colors ${
            tab === 'landing_pages'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Layout className="h-4 w-4" />
          <span>صفحات الهبوط النشطة ({landingPages.length})</span>
        </button>
        <button
          onClick={() => setTab('campaigns')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 font-cairo text-xs font-black transition-colors ${
            tab === 'campaigns'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>تتبع الحملات الإعلانية ({campaigns.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: LANDING PAGES TABLE ─── */}
      {tab === 'landing_pages' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-zinc-400 me-1" />
            <input
              value={landingSearch}
              onChange={(e) => setLandingSearch(e.target.value)}
              placeholder="ابحث في صفحات الهبوط باسم المنتج، العنوان، أو الرابط..."
              className="flex-1 font-cairo text-xs font-bold text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
                  <tr>
                    <th className="p-4">صفحة الهبوط والمنتج</th>
                    <th className="p-4">رابط الصفحة (Slug)</th>
                    <th className="p-4">سعر العرض</th>
                    <th className="p-4 text-center">الطلبات المسجلة</th>
                    <th className="p-4 text-center">الزيارات</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">روابط الحملة (UTM)</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-zinc-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                        جاري تحميل صفحات الهبوط...
                      </td>
                    </tr>
                  ) : filteredLandingPages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-zinc-400">
                        <Layout className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
                        لا توجد صفحات هبوط منشأة حالياً
                      </td>
                    </tr>
                  ) : (
                    filteredLandingPages.map((l) => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kas-gamma-woad.vercel.app'
                      const publicUrl = `${origin}/ads/${l.slug}`
                      const fbUtmUrl = `${publicUrl}?utm_source=facebook&utm_medium=cpc&utm_campaign=${l.slug}`
                      const tiktokUtmUrl = `${publicUrl}?utm_source=tiktok&utm_medium=cpc&utm_campaign=${l.slug}`

                      return (
                        <tr key={l.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {l.image ? (
                                <img
                                  src={resolveImageUrl(l.image)}
                                  alt={l.title}
                                  className="h-12 w-12 rounded-xl object-contain bg-zinc-50 p-1 border"
                                />
                              ) : (
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                                  <Layers className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <p className="font-cairo font-black text-zinc-900">{l.title}</p>
                                <p className="text-[10px] text-zinc-400">
                                  المنتج: <span className="font-black text-zinc-700">{l.productName}</span> ({l.partNumber || l.brand})
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-cairo text-brand-600 font-bold" dir="ltr">
                            /ads/{l.slug}
                          </td>

                          <td className="p-4">
                            <span className="font-cairo font-black text-zinc-900 block">
                              {formatPrice(l.price || 0)}
                            </span>
                            {l.oldPrice && (
                              <span className="text-[10px] text-zinc-400 line-through" dir="ltr">
                                {formatPrice(l.oldPrice)}
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center font-cairo font-black text-emerald-600">
                            {l.ordersCount || 0} طلب
                          </td>

                          <td className="p-4 text-center font-cairo text-zinc-600">
                            {l.visitsCount || 0} زيارة
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleOffer(l.id)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border transition-colors ${
                                l.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                              }`}
                            >
                              {l.isActive ? 'مفعل ✓' : 'موقف'}
                            </button>
                          </td>

                          {/* Quick UTM Share Tools */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => copyToClipboard(fbUtmUrl, `fb-${l.id}`)}
                                className="rounded-lg border px-2 py-1 text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-colors"
                                title="نسخ رابط إعلان فيسبوك مع UTM"
                              >
                                {copiedLink === `fb-${l.id}` ? 'تم النسخ ✓' : 'Facebook'}
                              </button>
                              <button
                                onClick={() => copyToClipboard(tiktokUtmUrl, `tt-${l.id}`)}
                                className="rounded-lg border px-2 py-1 text-[10px] font-black text-pink-600 hover:bg-pink-50 transition-colors"
                                title="نسخ رابط إعلان تيك توك مع UTM"
                              >
                                {copiedLink === `tt-${l.id}` ? 'تم النسخ ✓' : 'TikTok'}
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                title="معاينة الصفحة الحية"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => openEditBuilder(l.id)}
                                className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateOffer(l.id)}
                                className="rounded-lg p-1.5 text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
                                title="تكرار كنسخة جديدة"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOffer(l.id)}
                                className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-50 hover:text-red-600"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CAMPAIGNS ─── */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setCampaignModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 font-cairo text-xs font-black text-white hover:bg-black transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>تسجيل حملة جديدة</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
                <tr>
                  <th className="p-4">اسم الحملة والمنصة</th>
                  <th className="p-4">معلمات UTM</th>
                  <th className="p-4">الميزانية</th>
                  <th className="p-4 text-center">الزيارات</th>
                  <th className="p-4 text-center">الطلبات</th>
                  <th className="p-4 text-center">معدل التحويل (CR)</th>
                  <th className="p-4 text-center">الإيرادات المحققة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-bold">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-4 font-cairo font-black text-zinc-900">
                      {c.name}
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        منصة: {c.platform}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600" dir="ltr">
                      {c.utmSource} / {c.utmCampaign}
                    </td>
                    <td className="p-4 font-cairo">{formatPrice(c.budget || 0)}</td>
                    <td className="p-4 text-center font-cairo">{c.visits || 0}</td>
                    <td className="p-4 text-center font-cairo text-emerald-600">{c.orders || 0}</td>
                    <td className="p-4 text-center font-cairo text-brand-600 font-black">
                      {c.conversionRate || 0}%
                    </td>
                    <td className="p-4 text-center font-cairo font-black text-zinc-900">
                      {formatPrice(c.revenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VISUAL NO-CODE OFFER BUILDER MODAL ─── */}
      {builderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-3 sm:p-6 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setBuilderModalOpen(false)} />

          <div
            className="modal-in relative w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl max-h-[94vh] flex flex-col"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-brand-600" />
                <h3 className="font-cairo text-lg font-black text-zinc-900">
                  {editOfferId ? 'تعديل وتخصيص صفحة الهبوط' : 'منشئ صفحة الهبوط والعرض الترويجي'}
                </h3>
              </div>

              {/* Device Toggle for Preview */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">معاينة:</span>
                <div className="flex items-center gap-1 bg-zinc-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg border transition-all ${
                      previewDevice === 'desktop' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600'
                    }`}
                    title="عرض سطح المكتب"
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg border transition-all ${
                      previewDevice === 'mobile' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600'
                    }`}
                    title="عرض الهاتف المحمول"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Banner Messages */}
            {builderError && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{builderError}</span>
              </div>
            )}
            {builderSuccess && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{builderSuccess}</span>
              </div>
            )}

            {/* Modal Body - Split View */}
            <div className="flex-1 overflow-hidden flex flex-row">
              {/* Editor Panel */}
              <div className="flex-1 overflow-y-auto p-6 border-l border-zinc-200">
                <form onSubmit={handleSaveBuilder} className="space-y-6">
                  {/* Step 1: Select Theme */}
                  <div className="space-y-3">
                    <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                      1. اختر قالب وثيم التصميم (Design Theme)
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {CONVERSION_THEMES.map((theme) => {
                        const Icon = theme.icon
                        const isSelected = selectedTheme === theme.id
                        return (
                          <div
                            key={theme.id}
                            onClick={() => {
                              setSelectedTheme(theme.id)
                              // Apply theme preset copy to form
                              setForm((prev) => ({
                                ...prev,
                                badgeText: theme.presets.badgeText,
                                urgencyText: theme.presets.urgencyText,
                                deliveryNote: theme.presets.deliveryNote,
                              }))
                            }}
                            className={`rounded-2xl border-2 p-3.5 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-600/20 shadow-md'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-900 text-white">
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="font-cairo text-xs font-black text-zinc-900">
                                {theme.name}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 leading-snug">
                              {theme.tagline}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Step 2: 1-Click Product Picker */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                        2. اختر المنتج من الكتالوج (تعبئة تلقائية للمواصفات)
                      </h4>
                      {selectedProduct && (
                        <span className="text-[11px] font-black text-emerald-600">
                          المنتج المختار: {selectedProduct.name} ({selectedProduct.brand})
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        placeholder="ابحث بالاسم، رقم القطعة PN، أو الماركة لاختيار المنتج فوراً..."
                        className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 p-2.5 pe-4 ps-10 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Quick suggestions pills */}
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className={`flex items-center gap-2 rounded-xl border p-2 text-right text-xs transition-all ${
                            form.productId === p.id
                              ? 'border-brand-600 bg-brand-50 text-brand-900 font-black ring-1 ring-brand-600'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          {p.image && (
                            <img src={p.image} alt={p.name} className="h-6 w-6 rounded object-contain" />
                          )}
                          <span className="truncate max-w-[200px]">{p.name}</span>
                          <span className="text-[10px] text-zinc-400" dir="ltr">({p.brand})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Offer Copy & Text */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                      3. نصوص وعناوين العرض الترويجي
                    </h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          عنوان العرض بالعربية (Headline) *
                        </label>
                        <input
                          required
                          value={form.titleAr}
                          onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                          placeholder="مشعاع تبريد محرك أصلي VALEO لسيارات بيجو 208..."
                          className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          رابط الصفحة الفرعي (Slug URL) *
                        </label>
                        <div className="relative">
                          <input
                            required
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            placeholder="radiateur-peugeot-208"
                            className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-black text-brand-600 focus:border-brand-600 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-zinc-700 block mb-1">
                        الشرح الترويجي وعرض القيمة (Subheadline / Value Proposition)
                      </label>
                      <textarea
                        value={form.subtitleAr}
                        onChange={(e) => setForm({ ...form, subtitleAr: e.target.value })}
                        rows={2}
                        placeholder="مطابق تماماً لمواصفات الوكالة مع تبريد مضاعف يتحمل درجات الحرارة العالية..."
                        className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 resize-none focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          شارة العرض الترويجي (Badge)
                        </label>
                        <input
                          value={form.badgeText}
                          onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                          placeholder="أصلي 100% — ضمان 24 شهراً"
                          className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {PRESET_BADGES.map((b, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setForm({ ...form, badgeText: b })}
                              className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 hover:bg-zinc-200"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          نص الاستعجال والشحن (Urgency Note)
                        </label>
                        <input
                          value={form.urgencyText}
                          onChange={(e) => setForm({ ...form, urgencyText: e.target.value })}
                          placeholder="الكمية محدودة — شحن فوري لـ 58 ولاية"
                          className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Pricing & Image */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                      4. التسعير وصورة العرض
                    </h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          سعر العرض المخفض (دج) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.customPrice}
                          onChange={(e) => setForm({ ...form, customPrice: Number(e.target.value) })}
                          className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-black text-brand-600 font-cairo focus:border-brand-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          السعر الأصلي المشطوب (دج)
                        </label>
                        <input
                          type="number"
                          value={form.customOldPrice || ''}
                          onChange={(e) => setForm({ ...form, customOldPrice: Number(e.target.value) })}
                          placeholder="19500"
                          className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-400 font-cairo focus:border-brand-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-700 block mb-1">
                          رابط صورة المنتج
                        </label>
                        <input
                          value={form.heroImageUrl}
                          onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Trust Highlights & Features */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                        5. نقاط القوة والضمانات (Trust Highlights)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" /> إضافة ميزة
                      </button>
                    </div>

                    <div className="space-y-2">
                      {form.features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            value={f.icon}
                            onChange={(e) => handleFeatureChange(idx, 'icon', e.target.value)}
                            className="rounded-xl border border-zinc-300 bg-white p-2 text-xs font-bold text-zinc-700"
                          >
                            {ICON_CHOICES.map((ic) => (
                              <option key={ic} value={ic}>
                                {ic}
                              </option>
                            ))}
                          </select>
                          <input
                            value={f.text}
                            onChange={(e) => handleFeatureChange(idx, 'text', e.target.value)}
                            placeholder="نص الضمان أو الميزة..."
                            className="flex-1 rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="p-2 text-zinc-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-2 pt-5 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setBuilderModalOpen(false)}
                      className="rounded-xl border border-zinc-300 px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>{editOfferId ? 'حفظ التعديلات' : 'نشر صفحة الهبوط فوراً'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Preview Panel */}
              <div className="w-1/2 overflow-y-auto p-4 bg-zinc-50">
                <div className="mb-3">
                  <span className="font-cairo text-xs font-black text-zinc-700">
                    معاينة حية: <span className="text-brand-600">/ads/{form.slug}</span>
                  </span>
                </div>

                {/* Preview Container */}
                {(() => {
                  const activeTheme = CONVERSION_THEMES.find((t) => t.id === selectedTheme)!
                  const p = activeTheme.preview
                  return (
                    <div
                      className="flex justify-center rounded-2xl overflow-hidden transition-all duration-300"
                      style={{ background: p.bg }}
                    >
                      <div
                        className={`rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                          previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'
                        }`}
                        style={{ background: p.bg, border: `1px solid ${p.border}` }}
                      >
                        {/* Fake Landing Hero */}
                        <div className="p-6 space-y-4" style={{ background: p.bg }}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className="rounded-full px-3 py-1 text-[10px] font-black border"
                              style={{
                                background: p.accentBadgeBg,
                                borderColor: p.accentBadgeBorder,
                                color: p.accentBadgeText,
                              }}
                            >
                              {form.badgeText}
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: p.accentBadgeText }}>
                              {form.urgencyText}
                            </span>
                          </div>

                          <h2 className="font-cairo text-xl sm:text-2xl font-black text-white">
                            {form.titleAr || 'عنوان العرض الترويجي'}
                          </h2>

                          <p className="text-xs font-bold leading-relaxed" style={{ color: '#cbd5e1' }}>
                            {form.subtitleAr || 'شرح تفصيلي حول القطعة ومميزاتها والتوافق...'}
                          </p>

                          <div
                            className="aspect-video w-full rounded-xl overflow-hidden flex items-center justify-center p-2"
                            style={{ background: p.cardBg, border: `1px solid ${p.border}` }}
                          >
                            <img
                              src={form.heroImageUrl}
                              alt="معاينة"
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <div
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: p.cardBg, border: `1px solid ${p.border}` }}
                          >
                            <div>
                              <span className="font-cairo text-xl font-black" style={{ color: p.priceColor }}>
                                {formatPrice(form.customPrice)}
                              </span>
                              {form.customOldPrice > 0 && (
                                <span className="text-xs text-zinc-500 line-through block" dir="ltr">
                                  {formatPrice(form.customOldPrice)}
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[10px] font-bold px-2 py-1 rounded"
                              style={{
                                color: p.accentBadgeText,
                                background: p.accentBadgeBg,
                                border: `1px solid ${p.accentBadgeBorder}`,
                              }}
                            >
                              {form.deliveryNote}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-2">
                            {form.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs font-bold" style={{ color: '#cbd5e1' }}>
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: p.featureCheck }} />
                                <span>{f.text}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              className="w-full rounded-xl py-3 font-cairo text-xs font-black text-white transition-all"
                              style={{
                                background: p.ctaBg,
                                boxShadow: `0 8px 24px ${p.ctaShadow}`,
                              }}
                            >
                              اطلب الآن — الدفع عند الاستلام ({formatPrice(form.customPrice)})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CAMPAIGN MODAL ─── */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setCampaignModalOpen(false)} />
          <div className="modal-in relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-cairo text-lg font-black text-zinc-900">تسجيل حملة إعلانية جديدة</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setSaving(true)
                try {
                  await createAdminCampaign(cForm)
                  setCampaignModalOpen(false)
                  loadData()
                } catch (err) {
                  console.error(err)
                } finally {
                  setSaving(false)
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">اسم الحملة *</label>
                <input
                  required
                  value={cForm.name}
                  onChange={(e) => setCForm({ ...cForm, name: e.target.value })}
                  placeholder="حملة الصيف — فرامل وفلاتر"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">المنصة</label>
                <select
                  value={cForm.platform}
                  onChange={(e) => setCForm({ ...cForm, platform: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                >
                  <option value="facebook">Facebook Ads</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="instagram">Instagram Ads</option>
                  <option value="google">Google Ads</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCampaignModalOpen(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700"
                >
                  حفظ الحملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
