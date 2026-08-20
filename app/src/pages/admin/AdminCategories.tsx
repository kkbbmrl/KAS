
import { useEffect, useState } from 'react'
import {
  Edit,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'

import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/adminApi'

const CATEGORY_ICONS: Record<string, string> = {
  Snowflake: '❄️',
  Scan: '💡',
  Shield: '🛡️',
  Fan: '🌀',
  Lightbulb: '🚘',
  Wind: '🧼',
  Box: '📦',
  CircleDashed: '⚙️',
  Minus: '🧱',
  Frame: '🛠️',
  Lamp: '🔦',
  RectangleHorizontal: '🧰',
  DoorOpen: '🚪',
  PanelTop: '🪟',
  Grid3x3: '🔩',
  Droplet: '🫧',
  Disc3: '🛑',
  Layers: '🧲',
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nameAr: '',
    nameFr: '',
    iconName: 'Layers',
    isAvailable: true,
    displayOrder: 0,
  })

  const loadCategories = () => {
    setLoading(true)
    fetchAdminCategories()
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Error fetching categories:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openCreate = () => {
    setEditId(null)
    setForm({
      nameAr: '',
      nameFr: '',
      iconName: 'Layers',
      isAvailable: true,
      displayOrder: categories.length + 1,
    })
    setModalOpen(true)
  }

  const openEdit = (c: any) => {
    setEditId(c.id)
    setForm({
      nameAr: c.nameAr || c.name,
      nameFr: c.nameFr || c.fr,
      iconName: c.iconName || c.icon || 'Layers',
      isAvailable: c.isAvailable ?? c.available ?? true,
      displayOrder: c.displayOrder || 0,
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await updateAdminCategory(editId, form)
      } else {
        await createAdminCategory(form)
      }
      setModalOpen(false)
      loadCategories()
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الفئة')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الفئة؟')) return
    try {
      await deleteAdminCategory(id)
      loadCategories()
    } catch (err: any) {
      alert(err.message || 'فشل حذف الفئة')
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
            <Layers className="h-3.5 w-3.5" /> هيكل الأقسام وتصنيف القطع
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إدارة الأقسام والفئات (Categories)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            إجمالي {categories.length} قسم معتمد في المتجر وصفحة الأقسام
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة قسم جديد</span>
          </button>
          <button
            onClick={loadCategories}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── CATEGORY CARDS GRID ─── */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
          جاري تحميل الأقسام...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => {
            const emoji = CATEGORY_ICONS[c.iconName || c.icon] || '🛠️'
            const isAvail = c.isAvailable ?? c.available

            return (
              <div
                key={c.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl shadow-sm">
                      {emoji}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${isAvail ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}
                    >
                      {isAvail ? 'متاح للعرض' : 'معطل مؤقتاً'}
                    </span>
                  </div>

                  <h3 className="mt-4 font-cairo text-base font-black text-zinc-900">
                    {c.nameAr || c.name}
                  </h3>
                  <p className="text-xs font-bold text-zinc-400" dir="ltr">
                    {c.nameFr || c.fr}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                  <span className="font-bold text-zinc-500">
                    {c.productsCount || 0} منتجات مرتبطة
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setModalOpen(false)} />

          <div className="modal-in relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="font-cairo text-base font-black text-zinc-900">
                {editId ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالعربية *</label>
                <input
                  required
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder="المشعاع، الصدام، المروحة..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالفرنسية *</label>
                <input
                  required
                  value={form.nameFr}
                  onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                  placeholder="Radiateur, Pare-chocs..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="rounded border-zinc-300 text-brand-600"
                />
                <label htmlFor="availCheck" className="text-xs font-bold text-zinc-700 cursor-pointer">
                  متاح ومفعّل للعرض في واجهة المتجر
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
