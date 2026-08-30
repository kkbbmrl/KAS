import { useEffect, useState, useRef } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Car,
  Check,
  Copy,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
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
  clearAllAdminFeatured,
  syncTop5AdminFeatured,
  fetchAdminCategories,
  fetchAdminBrands,
  uploadAdminImage,
} from '@/lib/adminApi'
import { formatPrice, CATEGORIES, CAR_BRANDS } from '@/data/products'
import { resolveImageUrl } from '@/lib/api'

interface SpecItem {
  label: string
  value: string
}

interface VariantItem {
  id?: string
  label?: string
  sku?: string
  partNumber?: string
  price: number
  oldPrice?: number | null
  stockQuantity: number
  extraSpecs?: any[]
}

interface ImageItem {
  url: string
  isPrimary: boolean
}

const DEFAULT_BRANDS = [
  'VALEO',
  'BOSCH',
  'HELLA',
  'DENSO',
  'NGK',
  'BREMBO',
  'NISSENS',
  'FEBI BILSTEIN',
  'DELPHI',
  'MAGNETI MARELLI',
  'MAHLE',
  'SACHS',
  'CONTINENTAL',
  'GENUINE / OEM',
]

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>(() =>
    CATEGORIES.map((c, i) => ({ id: c.id || `cat-${i}`, nameAr: c.name, nameFr: c.fr, name: c.name }))
  )
  const [brands, setBrands] = useState<any[]>(() =>
    DEFAULT_BRANDS.map((b, i) => ({ id: `brand-${i}`, name: b }))
  )
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [taxonomiesLoaded, setTaxonomiesLoaded] = useState(false)

  // Filters & Sorting
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'true' | 'false'>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Modal (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSuccess, setModalSuccess] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [customBrandActive, setCustomBrandActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Form State
  const [form, setForm] = useState({
    nameAr: '',
    nameFr: '',
    partNumber: '',
    categoryId: '',
    brandId: '',
    customBrand: '',
    badge: '',
    descriptionAr: '',
    descriptionFr: '',
    price: 15000,
    oldPrice: 0,
    stockQuantity: 10,
    imageUrl: '',
    images: [] as ImageItem[],
    specs: [{ label: '', value: '' }] as SpecItem[],
    variants: [] as VariantItem[],
    compat: [] as string[],
  })

  const loadProducts = () => {
    setLoading(true)
    fetchAdminProducts({
      q: query,
      category: catFilter,
      brand: brandFilter,
      status: statusFilter,
      featured: featuredFilter !== 'all' ? featuredFilter : undefined,
      sortBy,
      sortOrder,
      page,
      limit: 25,
    })
      .then((res) => {
        setProducts(res.products || [])
        setPagination(res.pagination || { total: 0, page: 1, limit: 25, pages: 1 })
      })
      .catch((err) => console.error('Error loading products:', err))
      .finally(() => setLoading(false))
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const loadTaxonomies = async () => {
    try {
      const [cats, brs] = await Promise.all([
        fetchAdminCategories().catch(() => []),
        fetchAdminBrands().catch(() => []),
      ])

      const loadedCats =
        Array.isArray(cats) && cats.length > 0
          ? cats
          : CATEGORIES.map((c, i) => ({ id: c.id || `cat-${i}`, nameAr: c.name, nameFr: c.fr, name: c.name }))

      const loadedBrands =
        Array.isArray(brs) && brs.length > 0
          ? brs
          : DEFAULT_BRANDS.map((b, i) => ({ id: `brand-${i}`, name: b }))

      setCategories(loadedCats)
      setBrands(loadedBrands)
      setTaxonomiesLoaded(true)
      return { categories: loadedCats, brands: loadedBrands }
    } catch {
      const fallbackCats = CATEGORIES.map((c, i) => ({ id: c.id || `cat-${i}`, nameAr: c.name, nameFr: c.fr, name: c.name }))
      const fallbackBrands = DEFAULT_BRANDS.map((b, i) => ({ id: `brand-${i}`, name: b }))
      setCategories(fallbackCats)
      setBrands(fallbackBrands)
      setTaxonomiesLoaded(true)
      return { categories: fallbackCats, brands: fallbackBrands }
    }
  }

  useEffect(() => {
    loadTaxonomies()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [catFilter, brandFilter, statusFilter, featuredFilter, sortBy, sortOrder, page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  const openCreateModal = async () => {
    setEditId(null)
    setModalError(null)
    setModalSuccess(null)
    setCustomBrandActive(false)

    let currentCats = categories
    let currentBrands = brands

    if (!taxonomiesLoaded || currentCats.length === 0 || currentBrands.length === 0) {
      const result = await loadTaxonomies()
      currentCats = result.categories
      currentBrands = result.brands
    }

    const defaultCat = currentCats[0]?.id || currentCats[0]?.nameAr || 'المشعاع'
    const defaultBrand = currentBrands[0]?.id || currentBrands[0]?.name || 'VALEO'

    setForm({
      nameAr: '',
      nameFr: '',
      partNumber: '',
      categoryId: defaultCat,
      brandId: defaultBrand,
      customBrand: '',
      badge: '',
      descriptionAr: '',
      descriptionFr: '',
      price: 15000,
      oldPrice: 18000,
      stockQuantity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
      images: [
        { url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80', isPrimary: true },
      ],
      specs: [
        { label: 'المادة', value: 'ألومنيوم معالج' },
        { label: 'الضمان', value: '24 شهرًا' },
      ],
      variants: [],
      compat: [],
    })
    setModalOpen(true)
  }

  const openEditModal = async (id: string) => {
    setEditId(id)
    setModalError(null)
    setModalSuccess(null)
    try {
      const p = await fetchAdminProductDetails(id)
      const primaryVar = p.variants?.[0]
      const extraVars = p.variants?.slice(1) || []
      const imageList: ImageItem[] = (p.images || []).map((img: any) => ({
        url: typeof img === 'string' ? img : img.url,
        isPrimary: Boolean(img.isPrimary),
      }))
      const primaryUrl = imageList.find((i) => i.isPrimary)?.url || imageList[0]?.url || p.image || ''

      const rawCompat = p.compat || []
      const compatList: string[] = rawCompat
        .map((c: any) => (typeof c === 'string' ? c : `${c.make || ''} ${c.model || ''}`.trim()))
        .filter(Boolean)

      const brandMatch = brands.find((b) => b.id === p.brandId || b.name?.toLowerCase() === p.brand?.toLowerCase())

      setCustomBrandActive(!brandMatch && Boolean(p.brand))
      setForm({
        nameAr: p.nameAr || p.name || '',
        nameFr: p.nameFr || '',
        partNumber: p.partNumber || p.base_part_number || '',
        categoryId: p.categoryId || categories[0]?.id || '',
        brandId: brandMatch ? brandMatch.id : p.brandId || brands[0]?.id || '',
        customBrand: brandMatch ? '' : p.brand || '',
        badge: p.badge || '',
        descriptionAr: p.descriptionAr || p.description || '',
        descriptionFr: p.descriptionFr || '',
        price: primaryVar?.price || 0,
        oldPrice: primaryVar?.oldPrice || 0,
        stockQuantity: primaryVar?.stockQuantity ?? 10,
        imageUrl: primaryUrl,
        images: imageList.length > 0 ? imageList : primaryUrl ? [{ url: primaryUrl, isPrimary: true }] : [],
        specs: (p.specs || []).map((s: any) => ({ label: s.label, value: s.value })),
        variants: extraVars,
        compat: compatList,
      })
      setModalOpen(true)
    } catch (err: any) {
      console.error('Error fetching product for edit:', err)
      alert('فشل جلب بيانات المنتج للتعديل')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setModalError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string
        if (!base64Data) return

        try {
          const res = await uploadAdminImage({ image: base64Data, filename: file.name })
          const uploadedUrl = res.url
          setForm((prev) => {
            const updatedImages = [{ url: uploadedUrl, isPrimary: true }, ...prev.images.map((img) => ({ ...img, isPrimary: false }))]
            return {
              ...prev,
              imageUrl: uploadedUrl,
              images: updatedImages,
            }
          })
        } catch {
          setForm((prev) => ({
            ...prev,
            imageUrl: base64Data,
            images: [{ url: base64Data, isPrimary: true }, ...prev.images.map((img) => ({ ...img, isPrimary: false }))],
          }))
        } finally {
          setUploadingImage(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setModalError('فشل قراءة ملف الصورة')
      setUploadingImage(false)
    }
  }

  const handleAddImageUrl = (url: string) => {
    if (!url.trim()) return
    setForm((prev) => {
      const isFirst = prev.images.length === 0
      return {
        ...prev,
        imageUrl: isFirst ? url.trim() : prev.imageUrl,
        images: [...prev.images, { url: url.trim(), isPrimary: isFirst }],
      }
    })
  }

  const handleSetPrimaryImage = (index: number) => {
    setForm((prev) => {
      const updated = prev.images.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
      const primaryUrl = updated[index]?.url || prev.imageUrl
      return {
        ...prev,
        imageUrl: primaryUrl,
        images: updated,
      }
    })
  }

  const handleRemoveImage = (index: number) => {
    setForm((prev) => {
      const updated = prev.images.filter((_, idx) => idx !== index)
      if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
        updated[0].isPrimary = true
      }
      const primaryUrl = updated.find((i) => i.isPrimary)?.url || updated[0]?.url || ''
      return {
        ...prev,
        imageUrl: primaryUrl,
        images: updated,
      }
    })
  }

  const handleAddSpec = () => {
    setForm((prev) => ({
      ...prev,
      specs: [...prev.specs, { label: '', value: '' }],
    }))
  }

  const handleRemoveSpec = (index: number) => {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, idx) => idx !== index),
    }))
  }

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    setForm((prev) => {
      const nextSpecs = [...prev.specs]
      nextSpecs[index] = { ...nextSpecs[index], [field]: val }
      return { ...prev, specs: nextSpecs }
    })
  }

  // Car Model Variants State (اختر نوع المنتج المناسب لسيارتك)
  const [selectedMakeForVariant, setSelectedMakeForVariant] = useState('رينو')
  const [selectedModelForVariant, setSelectedModelForVariant] = useState('كليو 4')
  const [customModelText, setCustomModelText] = useState('')
  const [variantPriceInput, setVariantPriceInput] = useState<number | ''>('')

  const POPULAR_CAR_PRESETS = [
    'رينو كليو 4',
    'رينو كليو 5',
    'رينو سيمبول',
    'بيجو 208',
    'بيجو 301',
    'فولكسفاغن غولف 7',
    'فولكسفاغن بولو',
    'داسيا ستيبواي',
    'داسيا سانديرو',
    'داسيا لوغان',
    'هيونداي أكسنت',
    'هيونداي i20',
    'تويوتا ياريس',
    'تويوتا كورولا',
    'كيا ريو',
    'كيا بيكانتو',
    'سيات إبيزا',
    'سيتروين C3',
  ]

  const handleAddCarVariant = (carName?: string) => {
    const nameToAdd = carName || (customModelText.trim() ? customModelText.trim() : `${selectedMakeForVariant} ${selectedModelForVariant}`)
    const priceToAdd = Number(variantPriceInput) > 0 ? Number(variantPriceInput) : form.price
    setForm((prev) => {
      if (prev.variants.some((v) => v.label?.trim().toLowerCase() === nameToAdd.trim().toLowerCase())) {
        return prev
      }
      return {
        ...prev,
        variants: [
          ...prev.variants,
          {
            label: nameToAdd,
            sku: `${form.partNumber || 'VAR'}-${prev.variants.length + 2}`,
            partNumber: `${form.partNumber || 'PART'}-${nameToAdd.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || (prev.variants.length + 2)}`,
            price: priceToAdd,
            oldPrice: form.oldPrice && form.oldPrice > priceToAdd ? form.oldPrice : null,
            stockQuantity: form.stockQuantity || 10,
          },
        ],
      }
    })
    setCustomModelText('')
    setVariantPriceInput('')
  }

  const handleRemoveVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }))
  }

  const handleVariantChange = (index: number, field: keyof VariantItem, val: any) => {
    setForm((prev) => {
      const nextVars = [...prev.variants]
      nextVars[index] = { ...nextVars[index], [field]: val }
      return { ...prev, variants: nextVars }
    })
  }

  // Compatibility Management State (السيارات المتوافقة)
  const [selectedMakeForCompat, setSelectedMakeForCompat] = useState('رينو')
  const [selectedModelForCompat, setSelectedModelForCompat] = useState('كليو 4')
  const [customCompatText, setCustomCompatText] = useState('')

  const handleAddCompat = (carName?: string) => {
    const nameToAdd = carName || (customCompatText.trim() ? customCompatText.trim() : `${selectedMakeForCompat} ${selectedModelForCompat}`)
    if (!nameToAdd.trim()) return
    setForm((prev) => {
      if (prev.compat.includes(nameToAdd.trim())) return prev
      return { ...prev, compat: [...prev.compat, nameToAdd.trim()] }
    })
    setCustomCompatText('')
  }

  const handleRemoveCompat = (index: number) => {
    setForm((prev) => ({
      ...prev,
      compat: prev.compat.filter((_, idx) => idx !== index),
    }))
  }

  const handleAddMakeAllModels = (makeName: string) => {
    const models = CAR_BRANDS[makeName] || []
    setForm((prev) => {
      const set = new Set(prev.compat)
      models.forEach((m) => set.add(`${makeName} ${m}`))
      return { ...prev, compat: Array.from(set) }
    })
  }

  const handleSelectAllCars = () => {
    setForm((prev) => {
      const set = new Set(prev.compat)
      Object.entries(CAR_BRANDS).forEach(([make, models]) => {
        models.forEach((m) => set.add(`${make} ${m}`))
      })
      return { ...prev, compat: Array.from(set) }
    })
  }

  const handleClearAllCompat = () => {
    setForm((prev) => ({ ...prev, compat: [] }))
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setModalError(null)
    setModalSuccess(null)

    // Validation
    if (!form.nameAr.trim()) {
      setModalError('يرجى إدخال اسم القطعة بالعربية')
      setSaving(false)
      return
    }
    if (!form.partNumber.trim()) {
      setModalError('يرجى إدخال رقم القطعة (Part Number)')
      setSaving(false)
      return
    }
    if (form.price < 0 || isNaN(form.price)) {
      setModalError('يرجى إدخال سعر صحيح')
      setSaving(false)
      return
    }

    const finalBrand = form.customBrand.trim()
      ? form.customBrand.trim()
      : form.brandId || brands[0]?.id || 'VALEO'

    const finalCategory = form.categoryId || categories[0]?.id || 'المشعاع'

    const payload = {
      nameAr: form.nameAr.trim(),
      nameFr: form.nameFr.trim() || form.nameAr.trim(),
      partNumber: form.partNumber.trim(),
      categoryId: finalCategory,
      brandId: finalBrand,
      badge: form.badge.trim() || null,
      descriptionAr: form.descriptionAr.trim(),
      descriptionFr: form.descriptionFr.trim(),
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) > 0 ? Number(form.oldPrice) : null,
      stockQuantity: Number(form.stockQuantity) || 0,
      imageUrl: form.imageUrl.trim() || (form.images[0]?.url ? form.images[0].url : ''),
      images: form.images.filter((img) => img.url && img.url.trim()),
      specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      variants: form.variants,
      compat: form.compat,
    }

    try {
      if (editId) {
        await updateAdminProduct(editId, payload)
      } else {
        await createAdminProduct(payload)
      }
      setModalSuccess(editId ? 'تم تحديث المنتج بنجاح' : 'تمت إضافة المنتج بنجاح')
      setTimeout(() => {
        setModalOpen(false)
        loadProducts()
        loadTaxonomies()
      }, 500)
    } catch (err: any) {
      setModalError(err.message || 'فشل حفظ المنتج في الخادم')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('هل تريد تكرار هذا المنتج كنسخة جديدة؟')) return
    try {
      await duplicateAdminProduct(id)
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'فشل تكرار المنتج')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟')) return
    try {
      await deleteAdminProduct(id)
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'فشل حذف المنتج')
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
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, featuredHome: !item.featuredHome } : item
      )
    )
    try {
      await toggleAdminProductFeatured(id)
      loadProducts()
    } catch (err: any) {
      console.error(err)
      loadProducts()
      alert(err.message || 'فشل تعديل حالة العرض في الرئيسية')
    }
  }

  const handleClearAllFeatured = async () => {
    if (!confirm('هل تريد إلغاء تحديد جميع النجوم وإزالة كل المنتجات من قسم المميزة بالرئيسية؟')) return
    try {
      await clearAllAdminFeatured()
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء التحديد')
    }
  }

  const handleSyncTop5Featured = async () => {
    if (!confirm('هل تريد توليد وضبط 5 منتجات مميزة متنوعة تلقائياً للصفحة الرئيسية؟')) return
    try {
      await syncTop5AdminFeatured()
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'فشل توليد المنتجات المميزة')
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
            إجمالي {pagination.total} منتج مسجل مع الماركات، المتغيرات والمواصفات
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
            onClick={() => {
              loadProducts()
              loadTaxonomies()
            }}
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
              placeholder="ابحث باسم القطعة (عربي/فرنسي)، رقم القطعة PN، الماركة أو SKU..."
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
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-zinc-800 outline-none focus:border-brand-500"
            >
              <option value="all">جميع الفئات ({categories.length})</option>
              {categories.map((c, idx) => (
                <option key={c.id || idx} value={c.nameAr || c.name}>
                  {c.nameAr || c.name} {c.nameFr || c.fr ? `(${c.nameFr || c.fr})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-zinc-500">الماركة:</label>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-zinc-800 outline-none focus:border-brand-500"
            >
              <option value="all">جميع الماركات ({brands.length})</option>
              {brands.map((b, idx) => (
                <option key={b.id || idx} value={b.name}>
                  {b.name}
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
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-zinc-800 outline-none focus:border-brand-500"
            >
              <option value="all">الكل</option>
              <option value="active">مفعل فقط</option>
              <option value="archived">مؤرشف</option>
              <option value="in_stock">متوفر (&gt;5)</option>
              <option value="low_stock">مخزون منخفض (1-5)</option>
              <option value="out_of_stock">نفد المخزون (0)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
          <span className="text-xs font-black text-zinc-400 ml-1">تصفية سريعة:</span>
          {[
            { id: 'all', label: 'جميع الأصناف' },
            { id: 'featured', label: 'المعروضة بالرئيسية ⭐' },
            { id: 'in_stock', label: 'متوفر (>5)' },
            { id: 'low_stock', label: 'مخزون منخفض (1-5)' },
            { id: 'out_of_stock', label: 'نفد المخزون (0)' },
            { id: 'archived', label: 'المؤرشفة' },
          ].map((pill) => {
            const isActive =
              pill.id === 'featured'
                ? featuredFilter === 'true'
                : pill.id === 'all'
                ? statusFilter === 'all' && featuredFilter === 'all'
                : statusFilter === pill.id

            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setPage(1)
                  if (pill.id === 'featured') {
                    setFeaturedFilter((prev) => (prev === 'true' ? 'all' : 'true'))
                  } else if (pill.id === 'all') {
                    setStatusFilter('all')
                    setFeaturedFilter('all')
                  } else {
                    setStatusFilter(pill.id)
                    setFeaturedFilter('all')
                  }
                }}
                className={`rounded-xl px-3 py-1.5 font-cairo text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white font-black shadow-sm'
                    : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {pill.label}
              </button>
            )
          })}
        </div>
      </div>

      {featuredFilter === 'true' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Star className="h-5 w-5 fill-white" />
            </div>
            <div>
              <p className="font-cairo font-black text-amber-950 text-sm">
                المنتجات المميزة بالصفحة الرئيسية ({pagination.total} منتج محدد)
              </p>
              <p className="text-xs text-amber-800 font-bold">
                تعرض الصفحة الرئيسية المنتجات المحددة بنجمة ⭐ فقط. يمكنك تحديد أو إلغاء أي منتج بالنقر المباشر على النجمة في الجدول.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncTop5Featured}
              className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-cairo text-xs font-black text-amber-900 shadow-sm hover:bg-amber-100 transition-colors"
            >
              ⚡ توليد 5 منتجات مميزة تلقائياً
            </button>
            <button
              onClick={handleClearAllFeatured}
              className="rounded-xl border border-red-200 bg-white px-3 py-1.5 font-cairo text-xs font-black text-red-700 shadow-sm hover:bg-red-50 transition-colors"
            >
              🗑️ إلغاء تحديد الكل (تصفير ⭐)
            </button>
          </div>
        </div>
      )}

      {/* ─── PRODUCTS TABLE ─── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 font-cairo font-extrabold text-zinc-600 select-none">
              <tr>
                <th className="p-4">
                  <button
                    onClick={() => handleSort('name')}
                    className="group flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب حسب اسم المنتج والماركة"
                  >
                    <span>المنتج والماركة</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort('category')}
                    className="group flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب أو تصفية حسب الفئة"
                  >
                    <span>الفئة</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'category' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort('partNumber')}
                    className="group flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب حسب رقم القطعة PN"
                  >
                    <span>رقم القطعة / SKU</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'partNumber' || sortBy === 'sku' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort('price')}
                    className="group flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب حسب السعر"
                  >
                    <span>السعر</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'price' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort('stock')}
                    className="group flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب حسب كمية المخزون"
                  >
                    <span>المخزون الكلي</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'stock' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort('variants')}
                    className="group flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب حسب عدد المتغيرات"
                  >
                    <span>المتغيرات</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'variants' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
                <th className="p-4 text-center">
                  <button
                    onClick={() => {
                      setFeaturedFilter((prev) => (prev === 'true' ? 'all' : 'true'))
                      setPage(1)
                    }}
                    className={`group mx-auto flex items-center justify-center gap-1 transition-colors font-extrabold cursor-pointer ${
                      featuredFilter === 'true' ? 'text-amber-600 font-black' : 'hover:text-zinc-950'
                    }`}
                    title="تصفية / ترتيب المنتجات المعروضة في الرئيسية"
                  >
                    <Star className={`h-3.5 w-3.5 ${featuredFilter === 'true' ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>الرئيسية</span>
                  </button>
                </th>
                <th className="p-4 text-center">
                  <button
                    onClick={() => handleSort('status')}
                    className="group mx-auto flex items-center justify-center gap-1 hover:text-zinc-950 transition-colors font-extrabold cursor-pointer"
                    title="ترتيب حسب حالة التفعيل"
                  >
                    <span>الحالة</span>
                    <span className="text-zinc-400 group-hover:text-zinc-700">
                      {sortBy === 'status' ? (sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-black" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-black" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </span>
                  </button>
                </th>
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
                  const stockNum = Number(p.totalStock ?? p.stockQuantity ?? 0)
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
                            <img
                              src={resolveImageUrl(p.image)}
                              alt={p.name}
                              className="h-12 w-12 rounded-xl object-contain bg-zinc-50 p-1 border"
                              onError={(e) => {
                                ;(e.currentTarget as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                              <Boxes className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-cairo font-black text-zinc-900 line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-zinc-400" dir="ltr">
                              {p.nameFr} — <span className="font-black text-zinc-700">{p.brand}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-zinc-700 font-cairo">{p.category}</td>

                      <td className="p-4">
                        <span className="font-cairo font-black text-zinc-900 block" dir="ltr">
                          {p.partNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400" dir="ltr">
                          {p.sku}
                        </span>
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
                          <Star className={`h-4 w-4 ${p.featuredHome ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border transition-colors ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                          }`}
                        >
                          {p.isActive ? 'مفعل' : 'مؤرشف'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 min-w-[140px]">
                          <button
                            onClick={() => openEditModal(p.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 font-cairo text-xs font-bold text-zinc-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 shadow-sm transition-all cursor-pointer"
                            title="تعديل المنتج والمتغيرات"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all cursor-pointer"
                            title="تكرار المنتج كنسخة جديدة"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

          <div
            className="modal-in relative w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl max-h-[92vh] flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-brand-600" />
                <h3 className="font-cairo text-lg font-black text-zinc-900">
                  {editId ? 'تعديل بيانات القطعة والمتغيرات والمواصفات' : 'إضافة قطعة غيار جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Error Banner */}
            {modalError && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Success Banner */}
            {modalSuccess && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                  1. المعلومات الأساسية والتعريف
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالعربية *</label>
                    <input
                      required
                      value={form.nameAr}
                      onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                      placeholder="مشعاع تبريد أصلي..."
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">الاسم بالفرنسية (اختياري)</label>
                    <input
                      value={form.nameFr}
                      onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                      placeholder="Radiateur de refroidissement moteur..."
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">رقم القطعة الأصلي (PN) *</label>
                    <input
                      required
                      value={form.partNumber}
                      onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                      placeholder="VAL-734320"
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 font-cairo focus:border-brand-600 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* CATEGORY DROPDOWN */}
                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">الفئة / القسم * ({categories.length} فئة)</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                    >
                      {categories.map((c, idx) => {
                        const val = c.id || c.nameAr || c.name || `cat-${idx}`
                        const label = c.nameAr || c.name || 'فئة'
                        const sub = c.nameFr || c.fr ? ` — ${c.nameFr || c.fr}` : ''
                        return (
                          <option key={c.id || idx} value={val}>
                            {label}{sub}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* BRAND SELECT & CUSTOM BRAND */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black text-zinc-700">الماركة / المصنّع * ({brands.length} ماركة)</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBrandActive(!customBrandActive)
                          if (!customBrandActive) {
                            setForm((prev) => ({ ...prev, customBrand: '' }))
                          }
                        }}
                        className="text-[10px] font-black text-brand-600 hover:underline"
                      >
                        {customBrandActive ? 'اختر من القائمة' : '+ كتابة ماركة مخصصة'}
                      </button>
                    </div>

                    {!customBrandActive ? (
                      <select
                        value={form.brandId}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setCustomBrandActive(true)
                          } else {
                            setForm({ ...form, brandId: e.target.value, customBrand: '' })
                          }
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      >
                        {brands.map((b, idx) => {
                          const val = b.id || b.name || `brand-${idx}`
                          return (
                            <option key={b.id || idx} value={val}>
                              {b.name} {b.originCountry ? `(${b.originCountry})` : ''}
                            </option>
                          )
                        })}
                        <option value="__custom__">+ ماركة أخرى (كتابة يدوية)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        autoFocus
                        required={customBrandActive}
                        value={form.customBrand}
                        onChange={(e) => setForm({ ...form, customBrand: e.target.value })}
                        placeholder="اكتب اسم الماركة (مثلاً: AISIN, BILSTEIN)..."
                        className="w-full rounded-xl border border-brand-500 bg-brand-50/30 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                  2. التسعير والمخزون
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">السعر الحالي (دج) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-black text-brand-600 font-cairo focus:border-brand-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">السعر السابق (شطب)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.oldPrice || ''}
                      onChange={(e) => setForm({ ...form, oldPrice: Number(e.target.value) })}
                      placeholder="اختياري"
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-400 font-cairo focus:border-brand-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">الكمية في المخزون *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.stockQuantity}
                      onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 font-cairo focus:border-brand-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-zinc-700 block mb-1">شارة ترويجية (Badge)</label>
                    <input
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="أصلي 100%، الأكثر طلباً..."
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Images Manager */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                    3. صور المنتج ومعرض الصور
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      <span>رفع صورة من الجهاز</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="أدخل رابط صورة (URL)..."
                    className="flex-1 rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (form.imageUrl) handleAddImageUrl(form.imageUrl)
                    }}
                    className="rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-900 transition-colors"
                  >
                    إضافة للصورة للمعرض
                  </button>
                </div>

                {/* Gallery Previews */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {form.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-xl border p-2 bg-zinc-50 flex flex-col items-center gap-2 group ${
                          img.isPrimary ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-zinc-200'
                        }`}
                      >
                        <img
                          src={resolveImageUrl(img.url)}
                          alt="معاينة"
                          className="h-20 w-full rounded-lg object-contain bg-white"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLElement).style.display = 'none'
                          }}
                        />
                        <div className="flex items-center justify-between w-full text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className={`rounded px-1.5 py-0.5 font-bold transition-colors ${
                              img.isPrimary ? 'bg-brand-600 text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                            }`}
                          >
                            {img.isPrimary ? 'الرئيسية ✓' : 'تعيين كرئيسية'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="حذف الصورة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Specifications */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                    4. المواصفات الفنية (Specifications)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> إضافة خاصية
                  </button>
                </div>

                <div className="space-y-2">
                  {form.specs.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={s.label}
                        onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                        placeholder="الخاصية (مثل: نوع المادة، الضمان، القطر)"
                        className="w-1/2 rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      />
                      <input
                        value={s.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        placeholder="القيمة (مثل: ألومنيوم مقوى، 24 شهر)"
                        className="w-1/2 rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Car Model Variants (اختر نوع المنتج المناسب لسيارتك) */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-brand-600" />
                      <h4 className="font-cairo text-sm font-black text-zinc-900">
                        5. نوع المنتج حسب السيارة (اختر نوع المنتج المناسب لسيارتك)
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      أضف خيارات السيارات والموديلات المتوافقة مع هذا المنتج، وحدد السعر الخاص بكل موديل ليتمكن الزبون من اختيار سيارته في المتجر.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-[11px] font-black text-brand-700">
                    {form.variants.length} سيارات محددة
                  </span>
                </div>

                {/* Quick Popular Car Preset Chips */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-zinc-700">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>إضافة سريعة لموديلات السيارات الأكثر طلباً في الجزائر:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CAR_PRESETS.map((carPreset) => {
                      const isAlreadyAdded = form.variants.some(
                        (v) => v.label?.trim().toLowerCase() === carPreset.trim().toLowerCase()
                      )
                      return (
                        <button
                          key={carPreset}
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => handleAddCarVariant(carPreset)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                            isAlreadyAdded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60 cursor-default'
                              : 'bg-white text-zinc-700 border border-zinc-200 shadow-sm hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40'
                          }`}
                        >
                          {isAlreadyAdded ? `✓ ${carPreset}` : `+ ${carPreset}`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Interactive Car Make/Model Custom Selector */}
                <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 space-y-3">
                  <span className="text-xs font-black text-zinc-800 block">
                    + أو اختر ماركة وموديل سيارة من القائمة لتحديد سعر خاص بها:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {/* Make Select */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">ماركة السيارة</label>
                      <select
                        value={selectedMakeForVariant}
                        onChange={(e) => {
                          const newMake = e.target.value
                          setSelectedMakeForVariant(newMake)
                          const models = CAR_BRANDS[newMake] || []
                          if (models.length > 0) setSelectedModelForVariant(models[0])
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      >
                        {Object.keys(CAR_BRANDS).map((make) => (
                          <option key={make} value={make}>
                            {make}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model Select */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">موديل السيارة</label>
                      <select
                        value={selectedModelForVariant}
                        onChange={(e) => setSelectedModelForVariant(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      >
                        {(CAR_BRANDS[selectedMakeForVariant] || []).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price for this model */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">السعر المخصص (دج)</label>
                      <input
                        type="number"
                        value={variantPriceInput}
                        onChange={(e) => setVariantPriceInput(e.target.value ? Number(e.target.value) : '')}
                        placeholder={`افتراضي: ${form.price} دج`}
                        className="w-full rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    {/* Add Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleAddCarVariant()}
                        className="w-full rounded-xl bg-zinc-900 p-2 text-xs font-black text-white hover:bg-brand-600 transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Plus className="h-4 w-4" /> إضافة هذا الموديل
                      </button>
                    </div>
                  </div>

                  {/* Free text custom vehicle input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                    <input
                      type="text"
                      value={customModelText}
                      onChange={(e) => setCustomModelText(e.target.value)}
                      placeholder="أو اكتب سيارة مخصصة يدوياً (مثلاً: رينو ماستر 3 أو شاحنة هيونداي HD)..."
                      className="flex-1 rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!customModelText.trim()}
                      onClick={() => handleAddCarVariant(customModelText.trim())}
                      className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-2 text-xs font-black text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors shrink-0"
                    >
                      + إضافة الموديل المخصص
                    </button>
                  </div>
                </div>

                {/* List of Added Car Variants */}
                {form.variants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center bg-zinc-50/50">
                    <Car className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500 font-bold">
                      لم تتم إضافة موديلات سيارات مخصصة بعد — سيظهر هذا المنتج كقطعة قياسية بسعر {formatPrice(form.price)}.
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium mt-1">
                      اضغط على أحد أزرار السيارات بالأعلى لإضافة أسعار مخصصة لكل سيارة!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-zinc-700 px-1">
                      <span>السيارات المحددة وأسعارها في المتجر:</span>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, variants: [] }))}
                        className="text-[11px] text-red-500 hover:underline font-bold"
                      >
                        مسح جميع السيارات
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {form.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-black text-brand-700">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <input
                                value={v.label || ''}
                                onChange={(e) => handleVariantChange(idx, 'label', e.target.value)}
                                placeholder="اسم موديل السيارة..."
                                className="w-full rounded-lg border border-zinc-200 p-1.5 font-cairo text-xs font-black text-zinc-900 focus:border-brand-600 focus:outline-none"
                              />
                              <input
                                value={v.partNumber || ''}
                                onChange={(e) => handleVariantChange(idx, 'partNumber', e.target.value)}
                                placeholder="رقم القطعة الخاص بها (اختياري)"
                                className="w-full rounded-lg border border-transparent p-1 text-[10px] font-bold text-zinc-500 focus:border-zinc-300 focus:outline-none mt-0.5"
                                dir="ltr"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Price */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-zinc-500">السعر:</span>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                                className="w-24 rounded-lg border border-zinc-300 p-1.5 text-xs font-black text-brand-600 focus:border-brand-600 focus:outline-none"
                              />
                              <span className="text-[10px] font-bold text-zinc-400">دج</span>
                            </div>

                            {/* Old Price */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-zinc-400">سابقاً:</span>
                              <input
                                type="number"
                                value={v.oldPrice || ''}
                                onChange={(e) =>
                                  handleVariantChange(idx, 'oldPrice', e.target.value ? Number(e.target.value) : null)
                                }
                                placeholder="اختياري"
                                className="w-20 rounded-lg border border-zinc-200 p-1.5 text-xs font-bold text-zinc-400 focus:border-brand-600 focus:outline-none"
                              />
                            </div>

                            {/* Stock */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-zinc-500">الكمية:</span>
                              <input
                                type="number"
                                value={v.stockQuantity}
                                onChange={(e) =>
                                  handleVariantChange(idx, 'stockQuantity', Number(e.target.value))
                                }
                                className="w-16 rounded-lg border border-zinc-300 p-1.5 text-xs font-bold text-zinc-800 focus:border-brand-600 focus:outline-none"
                              />
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="حذف هذا الموديل"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Compatible Vehicles (السيارات المتوافقة) */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-cairo text-sm font-black text-zinc-900">
                        6. السيارات المتوافقة (توافق الموديلات والماركات)
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      حدد جميع السيارات والموديلات التي تتوافق معها هذه القطعة لتظهر للزبائن عند البحث واختيار السيارة في المتجر.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-black text-emerald-700">
                    {form.compat.length} سيارة متوافقة
                  </span>
                </div>

                {/* Bulk Actions & Presets */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-zinc-700">إضافة سريعة حسب الماركة:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllCars}
                        className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-black text-white hover:bg-brand-600 transition-colors shadow-sm"
                      >
                        🌟 تحديد جميع السيارات (متوافقة عامة)
                      </button>
                      {form.compat.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllCompat}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          مسح الكل
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Make Batch Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(CAR_BRANDS).map((make) => (
                      <button
                        key={make}
                        type="button"
                        onClick={() => handleAddMakeAllModels(make)}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/40 transition-all shadow-xs"
                      >
                        + كل سيارات {make}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Make & Model Selector */}
                <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 space-y-3">
                  <span className="text-xs font-black text-zinc-800 block">
                    + أو أضف سيارة محددة بالماركة والموديل:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">ماركة السيارة</label>
                      <select
                        value={selectedMakeForCompat}
                        onChange={(e) => {
                          const newMake = e.target.value
                          setSelectedMakeForCompat(newMake)
                          const models = CAR_BRANDS[newMake] || []
                          if (models.length > 0) setSelectedModelForCompat(models[0])
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs font-bold text-zinc-900 focus:border-emerald-600 focus:outline-none"
                      >
                        {Object.keys(CAR_BRANDS).map((make) => (
                          <option key={make} value={make}>
                            {make}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">موديل السيارة</label>
                      <select
                        value={selectedModelForCompat}
                        onChange={(e) => setSelectedModelForCompat(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs font-bold text-zinc-900 focus:border-emerald-600 focus:outline-none"
                      >
                        {(CAR_BRANDS[selectedMakeForCompat] || []).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleAddCompat()}
                        className="w-full rounded-xl bg-emerald-600 p-2 text-xs font-black text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Plus className="h-4 w-4" /> + إضافة للسيارات المتوافقة
                      </button>
                    </div>
                  </div>

                  {/* Free text custom vehicle input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                    <input
                      type="text"
                      value={customCompatText}
                      onChange={(e) => setCustomCompatText(e.target.value)}
                      placeholder="أو اكتب سيارة مخصصة يدوياً (مثلاً: رينو ماستر 2022، بيجو 407)..."
                      className="flex-1 rounded-xl border border-zinc-300 p-2 text-xs font-bold text-zinc-900 focus:border-emerald-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!customCompatText.trim()}
                      onClick={() => handleAddCompat(customCompatText.trim())}
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors shrink-0"
                    >
                      + إضافة الموديل
                    </button>
                  </div>
                </div>

                {/* Badges List of Currently Compatible Cars */}
                {form.compat.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-5 text-center bg-zinc-50/40">
                    <p className="text-xs text-zinc-400 font-bold">
                      لم يتم تحديد سيارات متوافقة بعد — انقر على أحد الأزرار بالأعلى أو حدد جميع السيارات!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-black text-zinc-700">قائمة السيارات المتوافقة الحالية ({form.compat.length} سيارة):</span>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl border border-zinc-200 bg-white">
                      {form.compat.map((car, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 px-3 py-1.5 text-xs font-extrabold text-zinc-800 transition-colors"
                        >
                          <Car className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          <span>{car}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompat(idx)}
                            className="mr-1 rounded-full p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="إزالة هذه السيارة"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <h4 className="font-cairo text-xs font-black text-zinc-400 uppercase tracking-wider">
                  7. الوصف والشرح التفصيلي
                </h4>

                <div>
                  <label className="text-xs font-black text-zinc-700 block mb-1">الوصف بالعربية</label>
                  <textarea
                    value={form.descriptionAr}
                    onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                    rows={3}
                    placeholder="شرح تفصيلي حول القطعة ومميزاتها والتوافق..."
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 resize-none focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30 disabled:opacity-50 transition-all"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editId ? 'حفظ التعديلات' : 'حفظ ونشر القطعة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
