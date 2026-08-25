import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  Edit,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  toggleAdminCategoryAvailable,
  syncAdminDefaultCategories,
} from '@/lib/adminApi'

const CATEGORY_PRESET_ICONS = [
  { icon: 'Snowflake', emoji: '❄️', label: 'تبريد / مشعاع' },
  { icon: 'Lightbulb', emoji: '💡', label: 'إنارة / أضواء' },
  { icon: 'Shield', emoji: '🛡️', label: 'حماية / غطاء' },
  { icon: 'Fan', emoji: '🌀', label: 'مروحة تبريد' },
  { icon: 'Scan', emoji: '🚘', label: 'مصابيح أمامية' },
  { icon: 'Lamp', emoji: '🔦', label: 'أضواء خلفية' },
  { icon: 'Wind', emoji: '🧼', label: 'ماسحات زجاج' },
  { icon: 'Box', emoji: '📦', label: 'بيرسو / شاسيه' },
  { icon: 'CircleDashed', emoji: '⚙️', label: 'سيرسو / أجزاء' },
  { icon: 'Minus', emoji: '🧱', label: 'ترافرس / دعامات' },
  { icon: 'Frame', emoji: '🛠️', label: 'حوامل صدام' },
  { icon: 'RectangleHorizontal', emoji: '🧰', label: 'صدامات' },
  { icon: 'DoorOpen', emoji: '🚪', label: 'أبواب ومقابض' },
  { icon: 'PanelTop', emoji: '🪟', label: 'كبوت / غطاء' },
  { icon: 'Grid3x3', emoji: '🔩', label: 'آرماتور / هياكل' },
  { icon: 'Droplet', emoji: '🫧', label: 'فلاتر زيت' },
  { icon: 'Wind', emoji: '🌬️', label: 'فلاتر هواء' },
  { icon: 'Disc3', emoji: '🛑', label: 'أقراص فرامل' },
  { icon: 'Layers', emoji: '🧲', label: 'بطانات فرامل' },
  { icon: 'Car', emoji: '🚗', label: 'قطع عامة' },
  { icon: 'Zap', emoji: '⚡', label: 'شمعات وكهرباء' },
  { icon: 'BatteryCharging', emoji: '🔋', label: 'بطاريات' },
]

const CATEGORY_ICON_MAP: Record<string, string> = {
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
  Car: '🚗',
  Zap: '⚡',
  BatteryCharging: '🔋',
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')

  // Create / Edit Modal
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

  // Delete / Reassign Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null)
  const [reassignTargetId, setReassignTargetId] = useState<string>('')
  const [deleteActionType, setDeleteActionType] = useState<'reassign' | 'force'>('reassign')
  const [deleting, setDeleting] = useState(false)

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

  const handleSyncDefaults = async () => {
    if (!confirm('هل تريد مزامنة واستعادة جميع الأقسام القياسية الـ 22 المعتمدة في المتجر؟')) return
    setSyncing(true)
    try {
      const res = await syncAdminDefaultCategories()
      alert(res.message || 'تمت مزامنة الأقسام بنجاح')
      loadCategories()
    } catch (err: any) {
      alert(err.message || 'فشل مزامنة الأقسام')
    } finally {
      setSyncing(false)
    }
  }

  const handleToggleAvailable = async (cat: any) => {
    try {
      const res = await toggleAdminCategoryAvailable(cat.id)
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isAvailable: res.isAvailable } : c))
      )
    } catch (err: any) {
      alert(err.message || 'فشل تغيير حالة القسم')
    }
  }

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
      nameAr: c.nameAr || c.name || '',
      nameFr: c.nameFr || c.fr || '',
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
      alert(err.message || 'فشل حفظ القسم')
    } finally {
      setSaving(false)
    }
  }

  const promptDelete = (c: any) => {
    setCategoryToDelete(c)
    // Find first other category to default reassign
    const otherCats = categories.filter((item) => item.id !== c.id)
    setReassignTargetId(otherCats[0]?.id || '')
    setDeleteActionType('reassign')
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return
    setDeleting(true)
    try {
      if (Number(categoryToDelete.productsCount || 0) > 0) {
        if (deleteActionType === 'reassign' && reassignTargetId) {
          await deleteAdminCategory(categoryToDelete.id, { reassignTo: reassignTargetId })
        } else {
          await deleteAdminCategory(categoryToDelete.id, { force: true })
        }
      } else {
        await deleteAdminCategory(categoryToDelete.id)
      }
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
      loadCategories()
    } catch (err: any) {
      alert(err.message || 'فشل حذف القسم')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const nameMatch =
        (c.nameAr || c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nameFr || c.fr || '').toLowerCase().includes(searchQuery.toLowerCase())

      if (!nameMatch) return false

      const isAvail = c.isAvailable ?? c.available
      if (statusFilter === 'active' && !isAvail) return false
      if (statusFilter === 'disabled' && isAvail) return false

      return true
    })
  }, [categories, searchQuery, statusFilter])

  const totalProducts = categories.reduce((sum, c) => sum + (Number(c.productsCount) || 0), 0)

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200/80 px-3 py-1 text-xs font-black text-brand-700">
            <Layers className="h-3.5 w-3.5" /> هيكل الأقسام وتصنيف القطع
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إدارة الأقسام والفئات (Categories)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            إجمالي {categories.length} قسم معتمد في المتجر — {totalProducts} منتج مرتبط
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={handleSyncDefaults}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-cairo text-xs font-black text-zinc-700 hover:bg-zinc-50 shadow-sm transition-colors"
            title="مزامنة واستعادة الأقسام القياسية"
          >
            <Sparkles className={`h-4 w-4 text-amber-500 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'جاري المزامنة...' : 'استعادة الأقسام القياسية (22)'}</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة قسم جديد</span>
          </button>

          <button
            type="button"
            onClick={loadCategories}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم بالعربية أو الفرنسية..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pr-9 pl-3 py-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-zinc-500 shrink-0">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-bold text-zinc-800 focus:border-brand-600 focus:outline-none"
          >
            <option value="all">جميع الأقسام ({categories.length})</option>
            <option value="active">متاح في المتجر</option>
            <option value="disabled">معطل مؤقتاً</option>
          </select>
        </div>
      </div>

      {/* ─── CATEGORY CARDS GRID ─── */}
      {loading ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center text-zinc-400 shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-600 mb-2" />
          <p className="font-bold text-xs">جاري تحميل وتحديث الأقسام...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <Layers className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
          <h3 className="font-cairo text-sm font-black text-zinc-800">لا توجد أقسام تطابق بحثك</h3>
          <p className="mt-1 text-xs text-zinc-400 font-medium">جرب تغيير كلمات البحث أو اضغط على استعادة الأقسام القياسية</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((c) => {
            const emoji = CATEGORY_ICON_MAP[c.iconName || c.icon] || '🛠️'
            const isAvail = c.isAvailable ?? c.available
            const pCount = Number(c.productsCount) || 0

            return (
              <div
                key={c.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:border-brand-400 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 border border-brand-100 text-2xl shadow-xs">
                      {emoji}
                    </span>

                    {/* Direct Live Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAvailable(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black border transition-all ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                      }`}
                      title={isAvail ? 'انقر لتعطيل القسم في المتجر' : 'انقر لتفعيل القسم في المتجر'}
                    >
                      {isAvail ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{isAvail ? 'متاح' : 'معطل'}</span>
                    </button>
                  </div>

                  <h3 className="mt-4 font-cairo text-base font-black text-zinc-900">
                    {c.nameAr || c.name}
                  </h3>
                  <p className="text-xs font-bold text-zinc-400" dir="ltr">
                    {c.nameFr || c.fr}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                  <Link
                    to={`/admin/products?category=${encodeURIComponent(c.nameAr || c.name)}`}
                    className="inline-flex items-center gap-1 font-bold text-zinc-600 hover:text-brand-600 transition-colors"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-700">
                      {pCount}
                    </span>
                    <span>منتجات مرتبطة</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                      title="تعديل بيانات القسم"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => promptDelete(c)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="حذف هذا القسم"
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

      {/* ─── CREATE / EDIT MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setModalOpen(false)} />

          <div
            className="modal-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-600" />
                <h3 className="font-cairo text-base font-black text-zinc-900">
                  {editId ? 'تعديل بيانات القسم' : 'إضافة قسم وتصنيف جديد'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100">
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
                  placeholder="المشعاع، الصدام، المروحة، فلاتر الزيت..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالفرنسية *</label>
                <input
                  required
                  value={form.nameFr}
                  onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                  placeholder="Radiateur, Pare-chocs, Ventilateur..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1.5">
                  أيقونة القسم (اختر الأيقونة المناسبة لقطع هذا القسم):
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 rounded-2xl border border-zinc-200 bg-zinc-50/60">
                  {CATEGORY_PRESET_ICONS.map((item) => {
                    const isSelected = form.iconName === item.icon
                    return (
                      <button
                        key={item.icon}
                        type="button"
                        onClick={() => setForm({ ...form, iconName: item.icon })}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-brand-50 border-brand-500 shadow-sm scale-105'
                            : 'bg-white border-zinc-200 hover:border-brand-300 hover:bg-zinc-50'
                        }`}
                        title={item.label}
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <span className="mt-1 text-[9px] font-bold text-zinc-600 truncate max-w-full">
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">ترتيب العرض</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="availCheck"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="availCheck" className="text-xs font-bold text-zinc-800 cursor-pointer">
                    متاح ومفعّل في المتجر
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30 disabled:opacity-50 transition-all"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editId ? 'حفظ التعديلات' : 'إنشاء القسم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SMART DELETE / REASSIGN MODAL ─── */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setDeleteModalOpen(false)} />

          <div
            className="modal-in relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 text-red-600 border-b border-zinc-100 pb-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-cairo text-base font-black">
                حذف قسم «{categoryToDelete.nameAr || categoryToDelete.name}»
              </h3>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              {Number(categoryToDelete.productsCount || 0) > 0 ? (
                <>
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-amber-800 font-bold leading-relaxed">
                    ⚠️ هذا القسم يحتوي حالياً على <strong>{categoryToDelete.productsCount} منتج مرتبط</strong>. يرجى تحديد كيفية التعامل مع المنتجات قبل الحذف:
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors">
                      <input
                        type="radio"
                        name="delAction"
                        checked={deleteActionType === 'reassign'}
                        onChange={() => setDeleteActionType('reassign')}
                        className="mt-0.5 text-brand-600"
                      />
                      <div className="flex-1">
                        <span className="font-black text-zinc-900 block">نقل المنتجات إلى قسم آخر ثم الحذف (موصى به)</span>
                        {deleteActionType === 'reassign' && (
                          <div className="mt-2">
                            <label className="text-[11px] font-bold text-zinc-500 block mb-1">اختر القسم البديل:</label>
                            <select
                              value={reassignTargetId}
                              onChange={(e) => setReassignTargetId(e.target.value)}
                              className="w-full rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none bg-white"
                            >
                              {categories
                                .filter((c) => c.id !== categoryToDelete.id)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nameAr || c.name} ({c.nameFr || c.fr})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors">
                      <input
                        type="radio"
                        name="delAction"
                        checked={deleteActionType === 'force'}
                        onChange={() => setDeleteActionType('force')}
                        className="mt-0.5 text-red-600"
                      />
                      <div>
                        <span className="font-black text-red-700 block">حذف القسم مع إلغاء تصنيف المنتجات (Force Delete)</span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          ستبقى المنتجات موجودة في المتجر ولكن بدون قسم محدد.
                        </span>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-zinc-600 font-bold leading-relaxed">
                  هل أنت متأكد من حذف هذا القسم؟ هذا القسم لا يحتوي على أي منتجات مرتبطة وسيتم حذفه مباشرة.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleting || (deleteActionType === 'reassign' && Number(categoryToDelete.productsCount || 0) > 0 && !reassignTargetId)}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-red-700 shadow-md shadow-red-600/30 disabled:opacity-50 transition-all"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>تأكيد الحذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

