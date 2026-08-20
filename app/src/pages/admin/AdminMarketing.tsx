import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ExternalLink,
  Megaphone,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react'

import {
  fetchAdminCampaigns,
  createAdminCampaign,
  fetchAdminLandingPages,
  createAdminLandingPage,
  toggleAdminLandingPage,
  fetchAdminProducts,
} from '@/lib/adminApi'
import { formatPrice } from '@/data/products'

export default function AdminMarketing() {
  const [tab, setTab] = useState<'campaigns' | 'landing_pages'>('campaigns')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [landingPages, setLandingPages] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [landingModalOpen, setLandingModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Campaign Form
  const [cForm, setCForm] = useState({
    name: '',
    platform: 'facebook',
    utmSource: 'facebook',
    utmMedium: 'cpc',
    utmCampaign: '',
    budget: 35000,
  })

  // Landing Page Form
  const [lForm, setLForm] = useState({
    slug: '',
    productId: '',
    titleAr: '',
    subtitleAr: '',
    titleFr: '',
    badgeText: 'عرض خاص لفترة محدودة',
    urgencyText: 'الكمية محدودة — اطلب الآن!',
    deliveryNote: 'توصيل سريع لـ 58 ولاية — دفع عند الاستلام',
    customPrice: 16500,
    customOldPrice: 19000,
    heroImageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetchAdminCampaigns(),
      fetchAdminLandingPages(),
      fetchAdminProducts({ limit: 100 }),
    ])
      .then(([campRes, landRes, prodRes]) => {
        setCampaigns(campRes || [])
        setLandingPages(landRes || [])
        setProducts(prodRes.products || [])
        if (prodRes.products && prodRes.products.length > 0) {
          setLForm((prev) => ({ ...prev, productId: prodRes.products[0].id }))
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveCampaign = async (e: React.FormEvent) => {
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
  }

  const handleSaveLanding = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createAdminLandingPage(lForm)
      setLandingModalOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء صفحة الهبوط')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleLanding = async (id: string) => {
    try {
      await toggleAdminLandingPage(id)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-brand-700">
            <Megaphone className="h-3.5 w-3.5" /> التسويق، الـ UTM وصفحات الهبوط
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إدارة الحملات والتسويق (Growth Hub)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            تتبع أداء الإعلانات على فيسبوك، تيك توك، إنستغرام ومعدلات التحويل لكل حملة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setTab('campaigns')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-cairo text-xs font-bold transition-all ${
                tab === 'campaigns' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" /> الحملات والـ UTM
            </button>
            <button
              onClick={() => setTab('landing_pages')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-cairo text-xs font-bold transition-all ${
                tab === 'landing_pages' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
              }`}
            >
              <Zap className="h-3.5 w-3.5" /> صفحات الهبوط ({landingPages.length})
            </button>
          </div>

          <button
            onClick={loadData}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {tab === 'campaigns' ? (
        /* ─── CAMPAIGNS TAB ─── */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-cairo text-base font-black text-zinc-900">
              الحملات النشطة وتتبع الـ UTM
            </h2>
            <button
              onClick={() => setCampaignModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة حملة إعلانية</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-white uppercase">
                    {c.platform}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                    معدل تحويل: {c.conversionRate}%
                  </span>
                </div>

                <div>
                  <h3 className="font-cairo text-sm font-black text-zinc-900 line-clamp-1">
                    {c.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1" dir="ltr">
                    utm_source={c.utmSource}&utm_campaign={c.utmCampaign}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">الزيارات:</span>
                    <span className="font-cairo font-black text-zinc-900">{c.visits}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">الطلبات:</span>
                    <span className="font-cairo font-black text-zinc-900">{c.orders} طلب</span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-bold">الإيراد المحقق:</span>
                  <span className="font-cairo font-black text-brand-600">{formatPrice(c.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─── LANDING PAGES TAB ─── */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-cairo text-base font-black text-zinc-900">
              صفحات الهبوط المخصصة للإعلانات (Landing Offers)
            </h2>
            <button
              onClick={() => setLandingModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
            >
              <Plus className="h-4 w-4" />
              <span>إنشاء صفحة هبوط</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landingPages.map((l) => (
              <div
                key={l.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 bg-zinc-900 p-4 flex items-center justify-center">
                    <img src={l.image} alt={l.title} className="h-32 object-contain" />
                    {l.badge && (
                      <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                        {l.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <p className="font-cairo text-base font-black text-zinc-900">{l.title}</p>
                    <p className="text-xs text-zinc-500 font-bold">{l.subtitle}</p>
                    <p className="text-xs text-brand-600 font-bold" dir="ltr">{l.nameFr}</p>
                    <p className="font-cairo text-lg font-black text-brand-600 pt-2">
                      {formatPrice(l.price)}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <Link
                    to={`/offer/${l.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-bold text-brand-600 hover:underline"
                  >
                    <span>معاينة حية</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    onClick={() => handleToggleLanding(l.id)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                      l.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}
                  >
                    {l.isActive ? 'نشطة' : 'معطلة'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CREATE CAMPAIGN MODAL ─── */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setCampaignModalOpen(false)} />
          <div className="modal-in relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <h3 className="font-cairo text-base font-black text-zinc-900 mb-4">إنشاء حملة تسويقية جديدة</h3>
            <form onSubmit={handleSaveCampaign} className="space-y-3">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">اسم الحملة *</label>
                <input
                  required
                  value={cForm.name}
                  onChange={(e) => setCForm({ ...cForm, name: e.target.value })}
                  placeholder="حملة المشعاعات فيسبوك..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">المنصة الإعلانية:</label>
                <select
                  value={cForm.platform}
                  onChange={(e) => setCForm({ ...cForm, platform: e.target.value, utmSource: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                >
                  <option value="facebook">Facebook Ads</option>
                  <option value="instagram">Instagram Ads / Reels</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="google">Google Search Ads</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCampaignModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700"
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

      {/* ─── CREATE LANDING PAGE MODAL ─── */}
      {landingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setLandingModalOpen(false)} />
          <div className="modal-in relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <h3 className="font-cairo text-base font-black text-zinc-900 mb-4">إنشاء صفحة هبوط إعلانية</h3>
            <form onSubmit={handleSaveLanding} className="space-y-3">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الرابط المخصص (Slug) *</label>
                <input
                  required
                  value={lForm.slug}
                  onChange={(e) => setLForm({ ...lForm, slug: e.target.value })}
                  placeholder="radiateur-clio4-promo"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">المنتج المرتبط *</label>
                <select
                  value={lForm.productId}
                  onChange={(e) => setLForm({ ...lForm, productId: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">العنوان العربي البارز *</label>
                <input
                  required
                  value={lForm.titleAr}
                  onChange={(e) => setLForm({ ...lForm, titleAr: e.target.value })}
                  placeholder="مشعاع تبريد أصلي مع ضمان 24 شهر..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setLandingModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700"
                >
                  نشر الصفحة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
