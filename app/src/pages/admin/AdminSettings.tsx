import { useEffect, useState } from 'react'
import { CheckCircle2, Globe, Loader2, Save, Settings, ShieldCheck, Tag, Truck } from 'lucide-react'
import { fetchAdminSettings, updateAdminSettings } from '@/lib/adminApi'

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'general' | 'shipping' | 'tracking' | 'seo'>('general')


  useEffect(() => {
    fetchAdminSettings()
      .then((res) => setSettings(res || {}))
      .catch((err) => console.error(err))
  }, [])


  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAdminSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">
            <Settings className="h-3.5 w-3.5" /> إعدادات وتكوين النظام
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إعدادات المتجر العامة (Store Settings)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            تخصيص بيانات المحل، سياسات التوصيل، بيكسل التتبع وتهيئة محركات البحث
          </p>
        </div>

        {saved && (
          <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> تم حفظ الإعدادات بنجاح
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-zinc-100 pb-4 gap-2">
          {[
            { id: 'general', label: 'المعلومات العامة', icon: Globe },
            { id: 'shipping', label: 'الشحن والتوصيل', icon: Truck },
            { id: 'tracking', label: 'بيكسل التتبع والـ Ads', icon: Tag },
            { id: 'seo', label: 'تهيئة محركات البحث SEO', icon: ShieldCheck },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === t.id ? 'bg-zinc-900 text-white font-black' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="pt-6 space-y-4">
          {tab === 'general' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">اسم المتجر</label>
                <input
                  value={settings['store_name'] || 'Khaled Auto Spart'}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">رقم الهاتف الرسمي</label>
                <input
                  value={settings['store_phone'] || '0555 12 34 56'}
                  onChange={(e) => handleChange('store_phone', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">البريد الإلكتروني للاتصال</label>
                <input
                  value={settings['store_email'] || 'contact@khaledautospart.dz'}
                  onChange={(e) => handleChange('store_email', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">عنوان المحل الفعلي</label>
                <input
                  value={settings['store_address'] || 'الجزائر العاصمة، الجزائر'}
                  onChange={(e) => handleChange('store_address', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
            </div>
          )}

          {tab === 'shipping' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">شركة التوصيل الافتراضية</label>
                <input
                  value={settings['default_courier'] || 'Yalidine Fast Logistics'}
                  onChange={(e) => handleChange('default_courier', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الحد الأدنى للتوصيل المجاني (دج)</label>
                <input
                  value={settings['free_shipping_threshold'] || '15000'}
                  onChange={(e) => handleChange('free_shipping_threshold', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 font-cairo"
                />
              </div>
            </div>
          )}

          {tab === 'tracking' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">Facebook Pixel ID</label>
                <input
                  value={settings['facebook_pixel_id'] || ''}
                  onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
                  placeholder="FB-XXXXXXXX"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">TikTok Pixel ID</label>
                <input
                  value={settings['tiktok_pixel_id'] || ''}
                  onChange={(e) => handleChange('tiktok_pixel_id', e.target.value)}
                  placeholder="TT-XXXXXXXX"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">Google Analytics (GA4)</label>
                <input
                  value={settings['google_analytics_id'] || ''}
                  onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXX"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">عنوان الموقع الافتراضي (Meta Title)</label>
                <input
                  value={settings['seo_title'] || 'Khaled Auto Spares — قطع غيار السيارات الأصلية في الجزائر'}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الوصف العام (Meta Description)</label>
                <textarea
                  value={settings['seo_desc'] || 'متجر قطع غيار السيارات الأصلية مع التوصيل السريع لـ 58 ولاية والدفع عند الاستلام.'}
                  onChange={(e) => handleChange('seo_desc', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-zinc-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
