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
  Palette,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
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

// ─── PRESET CONVERSION THEMES / AD BLUEPRINTS ───
const CONVERSION_THEMES = [
  {
    id: 'oem-factory',
    name: 'المصنع الأصلي (OEM Factory)',
    tagline: 'للقطع الأصلية، التبريد، الكهرباء، المحرك، والقطع المعتمدة',
    icon: ShieldCheck,
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    preview: {
      bg: '#090d16',
      cardBg: '#131c2e',
      border: '#1e293b',
      accentColor: '#3b82f6',
      accentBadgeBg: 'rgba(59,130,246,0.15)',
      accentBadgeBorder: 'rgba(59,130,246,0.35)',
      accentBadgeText: '#93c5fd',
      ctaBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      ctaShadow: 'rgba(37,99,235,0.4)',
      priceColor: '#60a5fa',
      featureCheck: '#38bdf8',
    },
    presets: {
      badgeText: '🛡️ قطعة أصلية 100% — جودة الوكالة المعتمدة',
      urgencyText: '⚡ شحن فوري متوفر لـ 58 ولاية خلال 24-48 ساعة',
      deliveryNote: '🚚 فحص ومعاينة القطعة قبل الدفع مع ضمان 24 شهراً',
    },
  },
  {
    id: 'sport-performance',
    name: 'الأداء الرياضي (Sport Performance)',
    tagline: 'للفرامل الرياضية Brembo، التعليق، العوادم، والقطع عالية التحمل',
    icon: Flame,
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
    preview: {
      bg: '#140505',
      cardBg: '#240a0a',
      border: '#450a0a',
      accentColor: '#ef4444',
      accentBadgeBg: 'rgba(239,68,68,0.15)',
      accentBadgeBorder: 'rgba(239,68,68,0.35)',
      accentBadgeText: '#fca5a5',
      ctaBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      ctaShadow: 'rgba(220,38,38,0.45)',
      priceColor: '#f87171',
      featureCheck: '#ef4444',
    },
    presets: {
      badgeText: '🏎️ أداء رياضي خارق — مصمم لتحمل أصعب الظروف',
      urgencyText: '🔥 كمية محدودة جداً — متبقي 3 قطع في المستودع!',
      deliveryNote: '⚡ تركيب مباشر Plug & Play بدون أي تعديل',
    },
  },
  {
    id: 'flash-deal',
    name: 'إعلان تيك توك وفيسبوك الحارق (Viral Ads Killer)',
    tagline: 'مخصص للحملات الإعلانية الممولة مع نسبة تحويل قصوى (High CR)',
    icon: Zap,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    preview: {
      bg: '#120b02',
      cardBg: '#221504',
      border: '#451a03',
      accentColor: '#f59e0b',
      accentBadgeBg: 'rgba(245,158,11,0.15)',
      accentBadgeBorder: 'rgba(245,158,11,0.35)',
      accentBadgeText: '#fcd34d',
      ctaBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      ctaShadow: 'rgba(245,158,11,0.4)',
      priceColor: '#fbbf24',
      featureCheck: '#f59e0b',
    },
    presets: {
      badgeText: '💥 تخفيض استثنائي 25% — لفترة محدودة فقط',
      urgencyText: '⏳ ينتهي العرض عند نفاد المخزون الحالي — اطلب الآن',
      deliveryNote: '🎁 هدية فحص مجاني + الدفع عند الاستلام',
    },
  },
  {
    id: 'gold-bundle',
    name: 'باقة التوفير الذهبية (VIP Gold Bundle)',
    tagline: 'للعروض المزدوجة 1+1، الصيانة الشاملة، والطلبات المميزة',
    icon: Sparkles,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    preview: {
      bg: '#05130f',
      cardBg: '#09211a',
      border: '#064e3b',
      accentColor: '#10b981',
      accentBadgeBg: 'rgba(16,185,129,0.15)',
      accentBadgeBorder: 'rgba(16,185,129,0.35)',
      accentBadgeText: '#6ee7b7',
      ctaBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      ctaShadow: 'rgba(16,185,129,0.4)',
      priceColor: '#34d399',
      featureCheck: '#10b981',
    },
    presets: {
      badgeText: '✨ باقة التوفير الكبرى — ادخر حتى 4000 دج اليوم',
      urgencyText: '🚚 شحن مجاني لكافة الولايات مع شركة ياليدين',
      deliveryNote: '⭐ تقييم 4.9/5 من أكثر من 1200 زبون في الجزائر',
    },
  },
] as const

const PRESET_BADGES = [
  '🛡️ قطعة أصلية 100% — ضمان 24 شهراً',
  '🔥 الأكثر طلباً في الجزائر',
  '⚡ تخفيض خاص لفترة محدودة',
  '🚚 شحن فوري لـ 58 ولاية',
  '📦 الدفع عند الاستلام والمعاينة',
  '⏳ آخر 4 قطع في المخزن',
]

const ICON_CHOICES = [
  'ShieldCheck',
  'Truck',
  'Wrench',
  'Zap',
  'Star',
  'CheckCircle2',
  'Flame',
  'Sparkles',
  'Clock',
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

  // Builder Studio State
  const [builderModalOpen, setBuilderModalOpen] = useState(false)
  const [editOfferId, setEditOfferId] = useState<string | null>(null)
  const [editorSubTab, setEditorSubTab] = useState<'blueprint' | 'content' | 'pricing' | 'features' | 'tracking'>('blueprint')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
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

  // Builder Form State
  const [selectedTheme, setSelectedTheme] = useState<string>('oem-factory')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [form, setForm] = useState({
    productId: '',
    titleAr: '',
    subtitleAr: '',
    badgeText: 'قطعة أصلية 100% — ضمان صناعي 24 شهراً',
    urgencyText: 'الكمية محدودة — توصيل فوري لـ 58 ولاية',
    deliveryNote: 'دفع عند الاستلام والمعاينة — شحن لباب منزلك',
    customPrice: 14500,
    customOldPrice: 16800,
    slug: 'radiateur-valeo-clio4',
    heroImageUrl: '/img/parts/radiator.jpg',
    features: [
      { icon: 'ShieldCheck', text: 'قطعة أصلية 100% مطابقة لمعايير المصنع' },
      { icon: 'Truck', text: 'شحن سريع لـ 58 ولاية مع شركة ياليدين' },
      { icon: 'CheckCircle2', text: 'ضمان الاستبدال أو استرجاع المبلغ خلال 14 يوماً' },
      { icon: 'Wrench', text: 'تركيب مباشر ومطابقة تامة مع كتالوج الصانع' },
    ] as OfferFeatureItem[],
    fbPixelId: '',
    tiktokPixelId: '',
    googleTagId: '',
    snapPixelId: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [campRes, landRes, prodRes] = await Promise.all([
        fetchAdminCampaigns().catch(() => []),
        fetchAdminLandingPages().catch(() => []),
        fetchAdminProducts().catch(() => ({ products: [] })),
      ])
      setCampaigns(campRes || [])
      setLandingPages(landRes || [])
      setProducts(prodRes?.products || [])
    } catch (err) {
      console.error('Failed to load marketing data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter products for the picker
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return products.slice(0, 8)
    const q = productSearchTerm.toLowerCase()
    return products
      .filter((p) => {
        const nameAr = (p.name || p.nameAr || '').toLowerCase()
        const nameFr = (p.nameFr || '').toLowerCase()
        const pn = (p.partNumber || p.part_number || '').toLowerCase()
        const brand = (p.brand || '').toLowerCase()
        return nameAr.includes(q) || nameFr.includes(q) || pn.includes(q) || brand.includes(q)
      })
      .slice(0, 10)
  }, [products, productSearchTerm])

  // Select a product and auto-fill form
  const handleSelectProduct = (p: any) => {
    setSelectedProduct(p)
    const basePrice = p.price || 12000
    const oldPrice = p.oldPrice || p.old_price || Math.round(basePrice * 1.2)
    const rawName = p.name || p.nameAr || 'قطعة غيار أصلية'
    const brand = p.brand || 'VALEO'
    const rawSlugBase = (p.nameFr || p.slug || p.partNumber || 'auto-part')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `offer-${Math.floor(Math.random() * 1000)}`

    let slugBase = rawSlugBase
    let counter = 1
    while (landingPages.some((l) => l.slug === slugBase && l.id !== editOfferId)) {
      counter++
      slugBase = `${rawSlugBase}-${counter}`
    }

    setForm((prev) => ({
      ...prev,
      productId: p.id,
      titleAr: `${rawName} (${brand})`,
      subtitleAr: p.description || `قطعة أصلية مضمونة 100% من شركة ${brand} العالمية، مطابقة لمواصفات المصنع ومفحوصة لأداء يدوم طويلاً.`,
      customPrice: basePrice,
      customOldPrice: oldPrice,
      slug: slugBase,
      heroImageUrl: p.image || prev.heroImageUrl,
      features: [
        { icon: 'ShieldCheck', text: `قطعة أصلية معتمدة من مصانع ${brand}` },
        { icon: 'Truck', text: 'شحن فوري لباب المنزل لجميع ولايات الجزائر' },
        { icon: 'CheckCircle2', text: 'ضمان الاستبدال والفحص الدقيق قبل الدفع' },
        { icon: 'Wrench', text: 'سهولة التركيب المباشر (Plug & Play)' },
      ],
    }))
  }

  // Open Builder for Creating New Landing Page
  const openNewBuilder = () => {
    setEditOfferId(null)
    setSelectedProduct(null)
    setSelectedTheme('oem-factory')
    setEditorSubTab('blueprint')
    setBuilderError(null)
    setBuilderSuccess(null)
    setForm({
      productId: '',
      titleAr: '',
      subtitleAr: '',
      badgeText: '🛡️ قطعة أصلية 100% — ضمان صناعي 24 شهراً',
      urgencyText: '⚡ الكمية محدودة — توصيل فوري لـ 58 ولاية',
      deliveryNote: '🚚 دفع عند الاستلام والمعاينة — شحن لباب منزلك',
      customPrice: 14500,
      customOldPrice: 17500,
      slug: `promo-${Math.floor(Math.random() * 9000 + 1000)}`,
      heroImageUrl: '/img/parts/radiator.jpg',
      features: [
        { icon: 'ShieldCheck', text: 'قطعة أصلية 100% مطابقة لمعايير المصنع' },
        { icon: 'Truck', text: 'شحن سريع لـ 58 ولاية مع شركة ياليدين' },
        { icon: 'CheckCircle2', text: 'ضمان الاستبدال أو استرجاع المبلغ خلال 14 يوماً' },
        { icon: 'Wrench', text: 'تركيب مباشر ومطابقة تامة مع كتالوج الصانع' },
      ],
      fbPixelId: '',
      tiktokPixelId: '',
      googleTagId: '',
      snapPixelId: '',
    })
    setBuilderModalOpen(true)
  }

  // Open Builder for Editing Existing
  const openEditBuilder = async (id: string) => {
    setEditOfferId(id)
    setBuilderError(null)
    setBuilderSuccess(null)
    setEditorSubTab('content')
    try {
      const details = await fetchAdminLandingPageDetails(id)
      if (details) {
        setForm({
          productId: details.productId || '',
          titleAr: details.titleAr || details.productName || '',
          subtitleAr: details.subtitleAr || details.description || '',
          badgeText: details.badgeText || 'قطعة أصلية 100%',
          urgencyText: details.urgencyText || 'الكمية محدودة',
          deliveryNote: details.deliveryNote || 'دفع عند الاستلام والمعاينة',
          customPrice: details.customPrice || details.price || 0,
          customOldPrice: details.customOldPrice || details.oldPrice || 0,
          slug: details.slug || '',
          heroImageUrl: details.heroImageUrl || details.imageUrl || '/img/parts/radiator.jpg',
          features: Array.isArray(details.features) && details.features.length > 0
            ? details.features
            : [
                { icon: 'ShieldCheck', text: 'قطعة أصلية 100% مطابقة لمعايير المصنع' },
                { icon: 'Truck', text: 'شحن سريع لـ 58 ولاية مع شركة ياليدين' },
              ],
          fbPixelId: details.fbPixelId || '',
          tiktokPixelId: details.tiktokPixelId || '',
          googleTagId: details.googleTagId || '',
          snapPixelId: details.snapPixelId || '',
        })
        setSelectedTheme(details.themeId || details.theme || 'oem-factory')
        if (details.productId) {
          const match = products.find((p) => p.id === details.productId)
          if (match) setSelectedProduct(match)
        }
      }
      setBuilderModalOpen(true)
    } catch (err: any) {
      console.error(err)
      setBuilderError('فشل تحميل تفاصيل صفحة الهبوط')
      setBuilderModalOpen(true)
    }
  }

  // Save / Submit Builder
  const handleSaveBuilder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setBuilderError(null)
    setBuilderSuccess(null)

    try {
      if (!form.titleAr.trim()) throw new Error('يرجى كتابة عنوان العرض الترويجي')
      if (!form.slug.trim()) throw new Error('يرجى تحديد رابط فرعي Slug صالح')
      if (!form.customPrice || form.customPrice <= 0) throw new Error('يرجى تحديد سعر بيع صحيح')

      const payload = {
        ...form,
        themeId: selectedTheme,
        theme: selectedTheme,
      }

      if (editOfferId) {
        await updateAdminLandingPage(editOfferId, payload)
        setBuilderSuccess('تم تحديث وحفظ صفحة الهبوط بنجاح!')
      } else {
        await createAdminLandingPage(payload)
        setBuilderSuccess('تم إنشاء ونشر صفحة الهبوط الجديدة بنجاح!')
      }
      await loadData()
      setTimeout(() => {
        setBuilderModalOpen(false)
      }, 900)
    } catch (err: any) {
      setBuilderError(err.message || 'فشل حفظ صفحة الهبوط')
    } finally {
      setSaving(false)
    }
  }

  // Delete Offer
  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف صفحة الهبوط هذه نهائياً؟')) return
    try {
      await deleteAdminLandingPage(id)
      await loadData()
    } catch (err: any) {
      alert('فشل الحذف: ' + err.message)
    }
  }

  // Duplicate Offer
  const handleDuplicateOffer = async (id: string) => {
    try {
      await duplicateAdminLandingPage(id)
      await loadData()
    } catch (err: any) {
      alert('فشل التكرار: ' + err.message)
    }
  }

  // Toggle Active
  const handleToggleOffer = async (id: string) => {
    try {
      await toggleAdminLandingPage(id)
      await loadData()
    } catch (err: any) {
      alert('فشل التفعيل/التعطيل: ' + err.message)
    }
  }

  // Features list manager
  const handleAddFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, { icon: 'CheckCircle2', text: 'ميزة إضافية أو ضمان جديد' }],
    }))
  }

  const handleRemoveFeature = (index: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const handleFeatureChange = (index: number, field: 'icon' | 'text', val: string) => {
    setForm((prev) => {
      const next = [...prev.features]
      next[index] = { ...next[index], [field]: val }
      return { ...prev, features: next }
    })
  }

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(key)
    setTimeout(() => setCopiedLink(null), 2500)
  }

  const filteredLandingPages = useMemo(() => {
    if (!landingSearch.trim()) return landingPages
    const q = landingSearch.toLowerCase()
    return landingPages.filter(
      (l) =>
        (l.titleAr || l.productName || '').toLowerCase().includes(q) ||
        (l.slug || '').toLowerCase().includes(q) ||
        (l.brand || '').toLowerCase().includes(q)
    )
  }, [landingPages, landingSearch])

  return (
    <div className="space-y-6">
      {/* ─── HEADER & STUDIO SUMMARY ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-widest text-brand-400">
              KAS High-Conversion Ad Studio
            </span>
          </div>
          <h1 className="font-cairo text-2xl font-black tracking-tight text-white sm:text-3xl">
            إدارة صفحات الهبوط والحملات الإعلانية
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-bold max-w-xl">
            أنشئ صفحات هبوط إعلانية فائقة السرعة مخصصة لإعلانات TikTok, Meta, Google مع بكسل التتبع والدفع عند الاستلام.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewBuilder}
            className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-red-600 px-5 py-3 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>إنشاء صفحة هبوط جديدة 🚀</span>
          </button>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setTab('landing_pages')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-cairo text-xs font-black transition-all ${
            tab === 'landing_pages'
              ? 'bg-zinc-900 text-white shadow-md'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Layout className="h-4 w-4 text-brand-500" />
          <span>صفحات الهبوط الإعلانية ({landingPages.length})</span>
        </button>

        <button
          onClick={() => setTab('campaigns')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-cairo text-xs font-black transition-all ${
            tab === 'campaigns'
              ? 'bg-zinc-900 text-white shadow-md'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <span>تتبع حملات الإعلانات UTM ({campaigns.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: LANDING PAGES TABLE ─── */}
      {tab === 'landing_pages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                value={landingSearch}
                onChange={(e) => setLandingSearch(e.target.value)}
                placeholder="ابحث في صفحات الهبوط..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 pe-3 ps-9 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <span>إجمالي الصفحات: {filteredLandingPages.length}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-zinc-100 bg-zinc-50/70 font-cairo font-extrabold text-zinc-400">
                  <tr>
                    <th className="p-4">الصفحة والمنتج</th>
                    <th className="p-4">السعر والخصم</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">الزيارات</th>
                    <th className="p-4 text-center">الطلبات</th>
                    <th className="p-4 text-center">معدل التحويل</th>
                    <th className="p-4 text-center">روابط الإعلانات UTM</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                        <span>جارٍ تحميل صفحات الهبوط...</span>
                      </td>
                    </tr>
                  ) : filteredLandingPages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-zinc-400">
                        <Layout className="mx-auto h-10 w-10 text-zinc-300 mb-2" />
                        <p className="font-cairo text-sm font-black text-zinc-600">لا توجد صفحات هبوط منشأة بعد</p>
                        <button
                          onClick={openNewBuilder}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700"
                        >
                          <Plus className="h-4 w-4" /> إنشاء أول صفحة هبوط
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredLandingPages.map((l) => {
                      const domain = window.location.origin
                      const publicUrl = `${domain}/ads/${l.slug}`
                      const fbUtmUrl = `${publicUrl}?utm_source=facebook&utm_medium=cpc&utm_campaign=${l.slug}`
                      const tiktokUtmUrl = `${publicUrl}?utm_source=tiktok&utm_medium=cpc&utm_campaign=${l.slug}`

                      return (
                        <tr key={l.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1">
                                <img
                                  src={l.heroImageUrl || l.imageUrl || '/img/parts/radiator.jpg'}
                                  alt={l.titleAr}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div>
                                <h4 className="font-cairo text-sm font-black text-zinc-900 hover:text-brand-600">
                                  {l.titleAr || l.productName}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-bold text-zinc-400 font-mono" dir="ltr">
                                    /ads/{l.slug}
                                  </span>
                                  {l.badgeText && (
                                    <span className="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.2 text-[9px] font-black text-brand-700">
                                      {l.badgeText}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-cairo">
                            <div className="font-black text-zinc-900 text-sm">{formatPrice(l.customPrice || l.price || 0)}</div>
                            {l.customOldPrice > 0 && (
                              <div className="text-[11px] text-zinc-400 line-through">
                                {formatPrice(l.customOldPrice || l.oldPrice)}
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleOffer(l.id)}
                              className={`rounded-full px-3 py-1 text-[10px] font-black transition-all ${
                                l.isActive !== false && l.is_active !== 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200'
                              }`}
                            >
                              {l.isActive !== false && l.is_active !== 0 ? 'نشطة ✓' : 'معطلة'}
                            </button>
                          </td>

                          <td className="p-4 text-center font-cairo font-black text-zinc-700">
                            {l.viewsCount || l.views || 0}
                          </td>
                          <td className="p-4 text-center font-cairo font-black text-emerald-600">
                            {l.ordersCount || l.orders || 0}
                          </td>
                          <td className="p-4 text-center font-cairo font-black text-brand-600">
                            {l.conversionRate || 0}%
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => copyToClipboard(publicUrl, `pub-${l.id}`)}
                                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-black text-zinc-700 hover:bg-white transition-colors"
                                title="نسخ الرابط المباشر"
                              >
                                {copiedLink === `pub-${l.id}` ? 'تم ✓' : 'رابط مباشر'}
                              </button>
                              <button
                                onClick={() => copyToClipboard(fbUtmUrl, `fb-${l.id}`)}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700 hover:bg-blue-100 transition-colors"
                                title="نسخ رابط إعلان فيسبوك مع UTM"
                              >
                                {copiedLink === `fb-${l.id}` ? 'تم ✓' : 'Facebook'}
                              </button>
                              <button
                                onClick={() => copyToClipboard(tiktokUtmUrl, `tt-${l.id}`)}
                                className="rounded-lg border border-pink-200 bg-pink-50 px-2 py-1 text-[10px] font-black text-pink-700 hover:bg-pink-100 transition-colors"
                                title="نسخ رابط إعلان تيك توك مع UTM"
                              >
                                {copiedLink === `tt-${l.id}` ? 'تم ✓' : 'TikTok'}
                              </button>
                            </div>
                          </td>

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
                                title="تعديل وتخصيص"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateOffer(l.id)}
                                className="rounded-lg p-1.5 text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
                                title="تكرار"
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

          <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs">
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

      {/* ─── VISUAL MASTERCLASS NO-CODE LANDING STUDIO MODAL ─── */}
      {builderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-2 sm:p-4 backdrop-blur-md">
          <div className="fade-in absolute inset-0" onClick={() => setBuilderModalOpen(false)} />

          <div
            className="modal-in relative w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-zinc-700/60 bg-zinc-950 text-white shadow-2xl max-h-[96vh] flex flex-col"
            dir="rtl"
          >
            {/* Studio Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-red-700 text-white shadow-lg shadow-brand-600/30">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-cairo text-lg font-black text-white leading-none">
                    {editOfferId ? 'تعديل وتخصيص صفحة الهبوط' : 'استوديو إنشاء صفحات الهبوط الإعلانية (Ad Landing Studio)'}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold text-zinc-400">
                    تصميم عصري فائق السرعة مخصص لحملات TikTok, Facebook, Instagram & Google Ads
                  </p>
                </div>
              </div>

              {/* Device Toggle Simulator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-2xl border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-cairo text-xs font-black transition-all ${
                      previewDevice === 'mobile'
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>هاتف جوال (Mobile Ads)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-cairo text-xs font-black transition-all ${
                      previewDevice === 'desktop'
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>كمبيوتر (Desktop)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner Messages */}
            {builderError && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/60 p-3 text-xs font-bold text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{builderError}</span>
              </div>
            )}
            {builderSuccess && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs font-bold text-emerald-200">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{builderSuccess}</span>
              </div>
            )}

            {/* Modal Body - Split View (Editor Left & Simulator Right) */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* ─── LEFT: CONTROLS & FORM ─── */}
              <div className="flex-1 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-l border-zinc-800 bg-zinc-900/40">
                <form onSubmit={handleSaveBuilder} className="space-y-6">
                  
                  {/* Step Navigation Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800">
                    {[
                      { id: 'blueprint', label: '1. القالب والمنتج', icon: Layers },
                      { id: 'content', label: '2. نصوص العرض', icon: Edit },
                      { id: 'pricing', label: '3. الأسعار والخصم', icon: Zap },
                      { id: 'features', label: '4. المميزات والضمان', icon: ShieldCheck },
                      { id: 'tracking', label: '5. البكسل والتتبع', icon: BarChart3 },
                    ].map((st) => {
                      const Icon = st.icon
                      const active = editorSubTab === st.id
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setEditorSubTab(st.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                            active
                              ? 'bg-brand-600 text-white shadow-md'
                              : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{st.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* TAB 1: BLUEPRINT & PRODUCT */}
                  {editorSubTab === 'blueprint' && (
                    <div className="space-y-6">
                      {/* Themes Selection */}
                      <div className="space-y-3">
                        <h4 className="font-cairo text-xs font-black text-brand-400 uppercase tracking-wider">
                          اختر قالب وثيم التصميم (Ad Conversion Blueprint)
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {CONVERSION_THEMES.map((theme) => {
                            const Icon = theme.icon
                            const isSelected = selectedTheme === theme.id
                            return (
                              <div
                                key={theme.id}
                                onClick={() => {
                                  setSelectedTheme(theme.id)
                                  setForm((prev) => ({
                                    ...prev,
                                    badgeText: theme.presets.badgeText,
                                    urgencyText: theme.presets.urgencyText,
                                    deliveryNote: theme.presets.deliveryNote,
                                  }))
                                }}
                                className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-brand-500 bg-brand-950/40 ring-2 ring-brand-500/30 shadow-lg'
                                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-800 text-white">
                                      <Icon className="h-4 w-4 text-brand-400" />
                                    </div>
                                    <span className="font-cairo text-xs font-black text-white">
                                      {theme.name}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-brand-400" />}
                                </div>
                                <p className="text-[11px] font-bold text-zinc-400 leading-snug">
                                  {theme.tagline}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* 1-Click Product Picker */}
                      <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <h4 className="font-cairo text-xs font-black text-brand-400 uppercase tracking-wider">
                            اختر المنتج من الكتالوج (تعبئة تلقائية وفورية)
                          </h4>
                          {selectedProduct && (
                            <span className="text-[11px] font-black text-emerald-400">
                              ✓ تم ربط: {selectedProduct.name}
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <input
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            placeholder="ابحث بالاسم، الماركة، أو رقم القطعة لاختيارها فوراً..."
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/80 p-3 pe-4 ps-10 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                          {filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              className={`flex items-center gap-2.5 rounded-2xl border p-2.5 text-right text-xs transition-all ${
                                form.productId === p.id
                                  ? 'border-brand-500 bg-brand-950/60 text-white font-black ring-1 ring-brand-500'
                                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                              }`}
                            >
                              <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-800 p-1">
                                <img src={p.image || '/img/parts/radiator.jpg'} alt={p.name} className="h-full w-full object-contain" />
                              </div>
                              <div className="truncate">
                                <span className="truncate block font-cairo font-black">{p.name}</span>
                                <span className="text-[10px] text-zinc-400" dir="ltr">{p.brand} • {formatPrice(p.price || 0)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONTENT & COPY */}
                  {editorSubTab === 'content' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-black text-zinc-300 block mb-1">
                          عنوان العرض الرئيسي (Headline) *
                        </label>
                        <input
                          required
                          value={form.titleAr}
                          onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                          placeholder="مشعاع تبريد أصلي VALEO لسيارات بيجو 208 و301..."
                          className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-black text-zinc-300 block mb-1">
                            رابط الصفحة الفرعي (Slug URL) *
                          </label>
                          <input
                            required
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            placeholder="radiateur-peugeot-208"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-mono font-black text-brand-400 focus:border-brand-500 focus:outline-none"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-black text-zinc-300 block mb-1">
                            رابط صورة المنتج
                          </label>
                          <input
                            value={form.heroImageUrl}
                            onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                            placeholder="/img/parts/radiator.jpg"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-300 block mb-1">
                          عرض القيمة والشرح التسويقي (Value Proposition)
                        </label>
                        <textarea
                          value={form.subtitleAr}
                          onChange={(e) => setForm({ ...form, subtitleAr: e.target.value })}
                          rows={3}
                          placeholder="قطعة أصلية مضمونة 100% لتحمل أعلى درجات الحرارة والضغط مع تبريد مثالي..."
                          className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-bold text-white resize-none focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-black text-zinc-300 block mb-1">
                            شارة العرض (Badge Text)
                          </label>
                          <input
                            value={form.badgeText}
                            onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                          />
                          <div className="flex flex-wrap gap-1 mt-2">
                            {PRESET_BADGES.map((b, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setForm({ ...form, badgeText: b })}
                                className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-black text-zinc-300 block mb-1">
                            نص الاستعجال والشحن (Urgency Text)
                          </label>
                          <input
                            value={form.urgencyText}
                            onChange={(e) => setForm({ ...form, urgencyText: e.target.value })}
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PRICING */}
                  {editorSubTab === 'pricing' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-black text-zinc-300 block mb-1">
                            سعر العرض المخفض (دج) *
                          </label>
                          <input
                            type="number"
                            required
                            value={form.customPrice}
                            onChange={(e) => setForm({ ...form, customPrice: Number(e.target.value) })}
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-sm font-black text-emerald-400 font-cairo focus:border-brand-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-black text-zinc-300 block mb-1">
                            السعر الأصلي المشطوب (دج)
                          </label>
                          <input
                            type="number"
                            value={form.customOldPrice || ''}
                            onChange={(e) => setForm({ ...form, customOldPrice: Number(e.target.value) })}
                            placeholder="17500"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-sm font-bold text-zinc-400 font-cairo focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {form.customOldPrice > form.customPrice && (
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-300">
                          <span>نسبة الخصم المباشرة للزبون:</span>
                          <span className="font-cairo font-black text-sm text-emerald-400">
                            خصم -{Math.round(((form.customOldPrice - form.customPrice) / form.customOldPrice) * 100)}% (وفر {formatPrice(form.customOldPrice - form.customPrice)})
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-black text-zinc-300 block mb-1">
                          ملاحظة الشحن والدفع (Delivery Guarantee Note)
                        </label>
                        <input
                          value={form.deliveryNote}
                          onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
                          className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: FEATURES */}
                  {editorSubTab === 'features' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-cairo text-xs font-black text-brand-400 uppercase tracking-wider">
                          مميزات وضمانات القطعة (Trust & Selling Points)
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          className="inline-flex items-center gap-1 text-xs font-black text-brand-400 hover:underline"
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
                              className="rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-xs font-bold text-white"
                            >
                              {ICON_CHOICES.map((ic) => (
                                <option key={ic} value={ic}>{ic}</option>
                              ))}
                            </select>
                            <input
                              value={f.text}
                              onChange={(e) => handleFeatureChange(idx, 'text', e.target.value)}
                              placeholder="نص الضمان أو الميزة..."
                              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/90 p-2.5 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(idx)}
                              className="p-2 text-zinc-400 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TRACKING & PIXELS */}
                  {editorSubTab === 'tracking' && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-300 font-bold leading-relaxed">
                        🎯 أدخل معرفات البكسل لتتبع التحويلات (PageViews, InitiateCheckout, Purchases) في حملاتك الممولة تلقائياً:
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-black text-blue-400 block mb-1">
                            Meta / Facebook Pixel ID
                          </label>
                          <input
                            value={form.fbPixelId}
                            onChange={(e) => setForm({ ...form, fbPixelId: e.target.value })}
                            placeholder="مثال: 123456789012345"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-mono font-bold text-white focus:border-blue-500 focus:outline-none"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-black text-pink-400 block mb-1">
                            TikTok Pixel ID
                          </label>
                          <input
                            value={form.tiktokPixelId}
                            onChange={(e) => setForm({ ...form, tiktokPixelId: e.target.value })}
                            placeholder="مثال: C6ABCD123456789"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-mono font-bold text-white focus:border-pink-500 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-black text-amber-400 block mb-1">
                            Google Ads / Analytics Tag
                          </label>
                          <input
                            value={form.googleTagId}
                            onChange={(e) => setForm({ ...form, googleTagId: e.target.value })}
                            placeholder="مثال: G-XXXXXXX أو AW-XXXXXXX"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-black text-yellow-400 block mb-1">
                            Snapchat Pixel ID
                          </label>
                          <input
                            value={form.snapPixelId}
                            onChange={(e) => setForm({ ...form, snapPixelId: e.target.value })}
                            placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/90 p-3 text-xs font-mono font-bold text-white focus:border-yellow-500 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setBuilderModalOpen(false)}
                      className="rounded-2xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-red-600 px-8 py-3 font-cairo text-xs font-black text-white shadow-xl shadow-brand-600/30 hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                      <span>{editOfferId ? 'حفظ وتحديث صفحة الهبوط' : 'نشر وتفعيل صفحة الهبوط 🚀'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* ─── RIGHT: REAL-TIME IPHONE 15 MOBILE SIMULATOR ─── */}
              <div className="w-full lg:w-[460px] p-6 bg-zinc-950/80 flex flex-col items-center justify-center overflow-y-auto">
                <div className="flex items-center justify-between w-full mb-3 px-2">
                  <span className="font-cairo text-xs font-black text-zinc-400">
                    المعاينة الحية: <span className="text-brand-400">/ads/{form.slug}</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                    مباشر (Live)
                  </span>
                </div>

                {/* iPhone 15 Frame */}
                {(() => {
                  const activeTheme = CONVERSION_THEMES.find((t) => t.id === selectedTheme) || CONVERSION_THEMES[0]
                  const p = activeTheme.preview

                  return (
                    <div
                      className={`relative overflow-hidden transition-all duration-300 ${
                        previewDevice === 'mobile'
                          ? 'w-[320px] sm:w-[350px] rounded-[48px] border-[10px] border-zinc-800 bg-zinc-950 shadow-2xl ring-1 ring-white/10'
                          : 'w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-4'
                      }`}
                      style={{ background: p.bg }}
                    >
                      {/* iPhone Dynamic Island & Status Bar (Mobile Mode only) */}
                      {previewDevice === 'mobile' && (
                        <div className="relative pt-3 px-6 flex items-center justify-between text-[11px] font-black text-white select-none">
                          <span>9:41</span>
                          {/* Dynamic Island Pill */}
                          <div className="h-4 w-24 rounded-full bg-black mx-auto shadow-inner" />
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">5G • 100%</span>
                        </div>
                      )}

                      {/* Scrollable Mobile Page Canvas */}
                      <div className="max-h-[580px] overflow-y-auto p-4 space-y-4 text-right select-none" dir="rtl">
                        
                        {/* Top Announcement Bar */}
                        <div className="rounded-xl py-1 px-3 text-center text-[10px] font-black bg-red-600 text-white animate-pulse">
                          🔥 عرض ترويجي خاص لزوار الإعلان — الدفع عند الاستلام
                        </div>

                        {/* Badges */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[9px] font-black border"
                            style={{
                              background: p.accentBadgeBg,
                              borderColor: p.accentBadgeBorder,
                              color: p.accentBadgeText,
                            }}
                          >
                            {form.badgeText}
                          </span>
                          <span className="text-[9px] font-bold text-amber-400">
                            {form.urgencyText}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="font-cairo text-lg font-black text-white leading-snug">
                          {form.titleAr || 'عنوان العرض الترويجي'}
                        </h2>

                        {/* Hero Image */}
                        <div
                          className="aspect-video w-full rounded-2xl overflow-hidden flex items-center justify-center p-2 border"
                          style={{ background: p.cardBg, borderColor: p.border }}
                        >
                          <img
                            src={form.heroImageUrl}
                            alt="معاينة"
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* Price Card */}
                        <div
                          className="flex items-center justify-between p-3.5 rounded-2xl border"
                          style={{ background: p.cardBg, borderColor: p.border }}
                        >
                          <div>
                            <span className="font-cairo text-xl font-black" style={{ color: p.priceColor }}>
                              {formatPrice(form.customPrice)}
                            </span>
                            {form.customOldPrice > form.customPrice && (
                              <span className="text-[10px] text-zinc-500 line-through block" dir="ltr">
                                {formatPrice(form.customOldPrice)}
                              </span>
                            )}
                          </div>

                          <span
                            className="text-[9px] font-black px-2 py-1 rounded-lg border"
                            style={{
                              color: p.accentBadgeText,
                              background: p.accentBadgeBg,
                              borderColor: p.accentBadgeBorder,
                            }}
                          >
                            {form.deliveryNote}
                          </span>
                        </div>

                        {/* Selling Points */}
                        <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                          {form.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-zinc-200">
                              <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: p.featureCheck }} />
                              <span>{f.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Simulated 1-Step Fast Order Form */}
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <p className="font-cairo text-xs font-black text-white flex items-center gap-1">
                            <span>⚡ اطلب الآن (الدفع عند الاستلام)</span>
                          </p>
                          <input
                            disabled
                            placeholder="الاسم واللقب..."
                            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-2 text-[10px] text-zinc-400"
                          />
                          <input
                            disabled
                            placeholder="رقم الهاتف (05 / 06 / 07)..."
                            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-2 text-[10px] text-zinc-400"
                          />
                          <select
                            disabled
                            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-2 text-[10px] text-zinc-400"
                          >
                            <option>اختر ولايتك (58 ولاية)...</option>
                          </select>

                          <button
                            type="button"
                            className="w-full rounded-xl py-3 font-cairo text-xs font-black text-white transition-all shadow-lg"
                            style={{
                              background: p.ctaBg,
                              boxShadow: `0 8px 20px ${p.ctaShadow}`,
                            }}
                          >
                            تأكيد الطلب — {formatPrice(form.customPrice)}
                          </button>
                        </div>
                      </div>

                      {/* iPhone Home Indicator bar */}
                      {previewDevice === 'mobile' && (
                        <div className="pb-2 pt-1 flex justify-center">
                          <div className="h-1 w-32 rounded-full bg-zinc-600" />
                        </div>
                      )}
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
