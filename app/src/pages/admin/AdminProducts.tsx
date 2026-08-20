import { useEffect, useState } from 'react'
import {
  Boxes,
  Copy,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import {
  fetchAdminProducts,
  fetchAdminProductDetails,
  createAdminProduct,
  updateAdminProduct,
  duplicateAdminProduct,
  deleteAdminProduct,
  toggleAdminProductActive,
  toggleAdminProductFeatured,
  fetchAdminCategories,
} from '@/lib/adminApi'
import { formatPrice } from '@/data/products'

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Modal (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [form, setForm] = useState({
    nameAr: '',
    nameFr: '',
    partNumber: '',
    categoryId: '',
    brandId: '',
    badge: '',
    descriptionAr: '',
    price: 0,
    oldPrice: 0,
    stockQuantity: 10,
    imageUrl: '',
    specs: [{ label: '', value: '' }],
    variants: [] as any[],
  })

  const loadProducts = () => {
    setLoading(true)
    fetchAdminProducts({ q: query, category: catFilter, status: statusFilter, page, limit: 25 })
      .then((res) => {
        setProducts(res.products || [])
        setPagination(res.pagination || { total: 0, page: 1, limit: 25, pages: 1 })
      })
      .catch((err) => console.error('Error loading products:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAdminCategories().then((res) => setCategories(res)).catch(() => {})
  }, [])

  useEffect(() => {
    loadProducts()
  }, [catFilter, statusFilter, page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  const openCreateModal = () => {
    setEditId(null)
    setForm({
      nameAr: '',
      nameFr: '',
      partNumber: '',
      categoryId: categories[0]?.id || '',
      brandId: 'brand-valeo',
      badge: '',
      descriptionAr: '',
      price: 15000,
      oldPrice: 18000,
      stockQuantity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
      specs: [
        { label: 'المادة', value: 'ألومنيوم معالج' },
        { label: 'الضمان', value: '24 شهرًا' },
      ],
      variants: [],
    })
    setModalOpen(true)
  }

  const openEditModal = async (id: string) => {
    setEditId(id)
    try {
      const p = await fetchAdminProductDetails(id)
      setForm({
        nameAr: p.nameAr || p.name_ar,
        nameFr: p.nameFr || p.name_fr,
        partNumber: p.partNumber || p.base_part_number,
        categoryId: p.categoryId || p.category_id,
        brandId: p.brandId || p.brand_id,
        badge: p.badge || '',
        descriptionAr: p.descriptionAr || p.description_ar,
        price: p.variants[0]?.price || 0,
        oldPrice: p.variants[0]?.oldPrice || 0,
        stockQuantity: p.variants[0]?.stockQuantity || 10,
        imageUrl: p.images[0]?.url || '',
        specs: p.specs || [],
        variants: p.variants || [],
      })
      setModalOpen(true)
    } catch (err) {
      console.error('Error fetching product for edit:', err)
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await updateAdminProduct(editId, form)
      } else {
        await createAdminProduct(form)
      }
      setModalOpen(false)
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'فشل حفظ المنتج')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('هل تريد تكرار هذا المنتج كنسخة جديدة؟')) return
    try {
      await duplicateAdminProduct(id)
      loadProducts()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟')) return
    try {
      await deleteAdminProduct(id)
      loadProducts()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      await toggleAdminProductActive(id)
      loadProducts()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleAdminProductFeatured(id)
      loadProducts()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
            <Boxes className="h-3.5 w-3.5" /> كتالوج قطع الغيار والمتغيرات
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إدارة المنتجات والمتغيرات
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            إجمالي {pagination.total} منتج مسجل مع التوافق ومصفوفات الموديلات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة قطعة جديدة</span>
          </button>
          <button
            onClick={loadProducts}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم القطعة (عربي/فرنسي)، رقم القطعة PN، أو SKU..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none focus:border-brand-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-black transition-colors"
          >
            بحث
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-zinc-500">الفئة:</label>
            <select
              value={catFilter}
              onChange={(e) => {
                setCatFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-zinc-800"
            >
              <option value="all">جميع الفئات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nameAr}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-zinc-500">الحالة والمخزون:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-zinc-800"
            >
              <option value="all">الكل</option>
              <option value="active">مفعل فقط</option>
              <option value="archived">مؤرشف</option>
              <option value="low_stock">مخزون منخفض (1-5)</option>
              <option value="out_of_stock">نفد المخزون (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── PRODUCTS TABLE ─── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
              <tr>
                <th className="p-4">المنتج والماركة</th>
                <th className="p-4">الفئة</th>
                <th className="p-4">رقم القطعة / SKU</th>
                <th className="p-4">السعر</th>
                <th className="p-4">المخزون الكلي</th>
                <th className="p-4">المتغيرات</th>
                <th className="p-4 text-center">الرئيسية</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    جاري تحميل المنتجات...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-400">
                    لا توجد منتجات مطابقة
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stockNum = Number(p.totalStock || 0)
                  const stockBadge =
                    stockNum === 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : stockNum <= 5
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-contain bg-zinc-50 p-1 border" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                              <Boxes className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-cairo font-black text-zinc-900 line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-zinc-400" dir="ltr">{p.nameFr} — <span className="font-black text-zinc-700">{p.brand}</span></p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-zinc-700 font-cairo">{p.category}</td>

                      <td className="p-4">
                        <span className="font-cairo font-black text-zinc-900 block" dir="ltr">{p.partNumber}</span>
                        <span className="text-[10px] text-zinc-400" dir="ltr">{p.sku}</span>
                      </td>

                      <td className="p-4 font-cairo font-black text-brand-600">
                        {formatPrice(p.price || 0)}
                      </td>

                      <td className="p-4">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-black ${stockBadge}`}>
                          {stockNum} قطعة
                        </span>
                      </td>

                      <td className="p-4 text-zinc-500 font-cairo">
                        {p.variantCount || 1} متغير
                      </td>

                      {/* Featured Home Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(p.id)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            p.featuredHome ? 'bg-amber-50 text-amber-600' : 'text-zinc-300 hover:text-zinc-500'
                          }`}
                          title="عرض في الرئيسية"
                        >
                          <Star className={`h-4 w-4 ${p.featuredHome ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border transition-colors ${
                            p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                          }`}
                        >
                          {p.isActive ? 'مفعل' : 'مؤرشف'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(p.id)}
                            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            className="rounded-lg p-1.5 text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
                            title="تكرار"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-4 text-xs font-bold text-zinc-500">
          <span>إجمالي {pagination.total} منتج</span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
            >
              السابق
            </button>
            <span className="px-2 font-cairo font-black text-zinc-900">
              صفحة {pagination.page} من {pagination.pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setModalOpen(false)} />

          <div className="modal-in relative w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl max-h-[90vh] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/70">
              <h3 className="font-cairo text-lg font-black text-zinc-900">
                {editId ? 'تعديل بيانات القطعة والمتغيرات' : 'إضافة قطعة غيار جديدة'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالعربية *</label>
                  <input
                    required
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    placeholder="مشعاع تبريد أصلي..."
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالفرنسية</label>
                  <input
                    value={form.nameFr}
                    onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                    placeholder="Radiateur moteur..."
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">رقم القطعة (PN) *</label>
                  <input
                    required
                    value={form.partNumber}
                    onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                    placeholder="RAD-8800"
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 font-cairo"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">الفئة / القسم *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">الماركة *</label>
                  <input
                    value={form.brandId}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    placeholder="VALEO, BOSCH, HELLA..."
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">السعر (دج) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-black text-brand-600 font-cairo"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    value={form.oldPrice}
                    onChange={(e) => setForm({ ...form, oldPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-400 font-cairo"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">الكمية في المخزون *</label>
                  <input
                    type="number"
                    required
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 font-cairo"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">رابط صورة المنتج (URL)</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الوصف التفصيلي</label>
                <textarea
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  حفظ ونشر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
