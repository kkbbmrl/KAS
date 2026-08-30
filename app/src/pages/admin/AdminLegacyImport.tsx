import { useEffect, useState, useRef } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Database,
  Eye,
  FileCheck,
  FileText,
  History,
  Link as LinkIcon,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UploadCloud,
  Warehouse,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  uploadAdminLegacyPdf,
  analyzeAdminLegacyBatch,
  fetchAdminLegacyBatch,
  fetchAdminLegacyRows,
  updateAdminLegacyRow,
  bulkActionAdminLegacyRows,
  createAdminProductFromLegacyRow,
  confirmAdminLegacyImport,
  fetchAdminLegacyReconciliation,
  rollbackAdminLegacyImport,
  fetchAdminLegacyHistory,
  fetchAdminCategories,
  fetchAdminBrands,
  adminGlobalSearch,
} from '@/lib/adminApi'
import { formatPrice } from '@/data/products'

export default function AdminLegacyImport() {
  // Navigation tabs within Import system
  const [activeTab, setActiveTab] = useState<'wizard' | 'reconciliation' | 'history'>('wizard')

  // Step 1: Import Type Selection
  const [importType, setImportType] = useState<'opening_stock' | 'purchase_history'>('opening_stock')

  // Step 2 & 3: File Upload & Analysis State
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [currentBatch, setCurrentBatch] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 4 & 5: Review & Rows State
  const [rows, setRows] = useState<any[]>([])
  const [rowsSummary, setRowsSummary] = useState<any>({ total: 0, matchedExact: 0, matchedHigh: 0, needsReview: 0, unmatched: 0, skipped: 0 })
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 })
  const [rowStatusFilter, setRowStatusFilter] = useState<'all' | 'matched' | 'needs_review' | 'unmatched' | 'skipped'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingRows, setLoadingRows] = useState(false)

  // Modals & Drawers
  const [remapModalOpen, setRemapModalOpen] = useState(false)
  const [activeRowForRemap, setActiveRowForRemap] = useState<any | null>(null)
  const [remapSearchQuery, setRemapSearchQuery] = useState('')
  const [remapSearchResults, setRemapSearchResults] = useState<any[]>([])
  const [searchingCatalog, setSearchingCatalog] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [activeRowForCreate, setActiveRowForCreate] = useState<any | null>(null)
  const [createFormData, setCreateFormData] = useState({
    nameAr: '',
    nameFr: '',
    basePartNumber: '',
    sku: '',
    categoryId: '',
    brandId: '',
    price: 0,
    stockQuantity: 1,
  })
  const [creatingProduct, setCreatingProduct] = useState(false)

  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)

  // Step 9: Reconciliation Report
  const [reconciliationReport, setReconciliationReport] = useState<any | null>(null)
  const [loadingReconciliation, setLoadingReconciliation] = useState(false)

  // Step 10: Import History
  const [historyList, setHistoryList] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false)
  const [batchToRollback, setBatchToRollback] = useState<any | null>(null)
  const [rollingBack, setRollingBack] = useState(false)

  // Reference data for category/brand selects
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  // Load initial reference data, history, and auto-resume active batch
  useEffect(() => {
    Promise.all([fetchAdminCategories(), fetchAdminBrands(), fetchAdminLegacyHistory()])
      .then(([cats, brs, hist]) => {
        setCategories(cats || [])
        setBrands(brs || [])
        if (hist && hist.length > 0) {
          setHistoryList(hist)
          // If there's an active in-progress batch, automatically load it
          const active = hist.find((h: any) => h.status === 'REVIEW_REQUIRED' || h.status === 'PREVIEW_READY' || h.status === 'PROCESSING' || h.status === 'UPLOADED')
          if (active) {
            setBatchId(active.id)
            fetchAdminLegacyBatch(active.id).then(setCurrentBatch).catch(() => {})
            loadRows(active.id)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Load history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const data = await fetchAdminLegacyHistory()
      setHistoryList(data || [])
    } catch (err) {
      console.error('Error loading import history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load rows when batchId, filter or page changes
  useEffect(() => {
    if (batchId) {
      loadRows(batchId)
    }
  }, [batchId, rowStatusFilter, pagination.page])

  const loadRows = async (targetBatchId?: string) => {
    const activeId = targetBatchId || batchId
    if (!activeId) return
    setLoadingRows(true)
    try {
      const res = await fetchAdminLegacyRows(activeId, {
        status: rowStatusFilter,
        q: searchQuery,
        page: pagination.page,
        limit: 50,
      })
      setRows(res.items || [])
      setPagination(res.pagination || { total: 0, page: 1, limit: 50, pages: 1 })
      if (res.counts) setRowsSummary(res.counts)
    } catch (err) {
      console.error('Error loading rows:', err)
    } finally {
      setLoadingRows(false)
    }
  }

  // Handle File Upload (Manual file or Sample file)
  const handleFileUpload = async (e?: React.ChangeEvent<HTMLInputElement>, useSample = false) => {
    let fileToUpload: File | null = null
    if (!useSample && e?.target.files && e.target.files[0]) {
      fileToUpload = e.target.files[0]
    }

    setUploading(true)
    try {
      let uploadPayload: any = { importType }
      if (useSample) {
        uploadPayload.useSampleFile = true
        uploadPayload.filename = 'Etat_Article_tout (1).PDF'
      } else if (fileToUpload) {
        const base64 = await toBase64(fileToUpload)
        uploadPayload.fileData = base64
        uploadPayload.filename = fileToUpload.name
      } else {
        return
      }

      const res = await uploadAdminLegacyPdf(uploadPayload)
      setBatchId(res.batchId)

      // Fetch batch metadata
      const batchData = await fetchAdminLegacyBatch(res.batchId)
      setCurrentBatch(batchData)

      // Automatically trigger analysis
      await triggerAnalysis(res.batchId)
    } catch (err: any) {
      alert(`خطأ في رفع الملف: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const toBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(f)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  // Trigger PDF analysis & catalog matching
  const triggerAnalysis = async (targetBatchId: string) => {
    setAnalyzing(true)
    try {
      await analyzeAdminLegacyBatch(targetBatchId)
      const batchData = await fetchAdminLegacyBatch(targetBatchId)
      setCurrentBatch(batchData)
      setBatchId(targetBatchId)
      setPagination((prev) => ({ ...prev, page: 1 }))
      await loadRows(targetBatchId)
    } catch (err: any) {
      alert(`خطأ في تحليل واستخراج البيانات: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  // Accept single match
  const handleAcceptMatch = async (rowId: string) => {
    if (!batchId) return
    try {
      await updateAdminLegacyRow(batchId, rowId, { action: 'accept' })
      loadRows()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Skip single row
  const handleToggleSkip = async (row: any) => {
    if (!batchId) return
    try {
      const nextAction = row.matchStatus === 'SKIPPED' ? 'unskip' : 'skip'
      await updateAdminLegacyRow(batchId, row.id, { action: nextAction })
      loadRows()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Open Remap Modal
  const openRemapModal = (row: any) => {
    setActiveRowForRemap(row)
    setRemapSearchQuery(row.sourceReference || row.sourceProductName || '')
    setRemapSearchResults([])
    setRemapModalOpen(true)
  }

  // Live search catalog for remapping
  useEffect(() => {
    if (remapModalOpen && remapSearchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setSearchingCatalog(true)
        try {
          const res = await adminGlobalSearch(remapSearchQuery)
          setRemapSearchResults(res.products || [])
        } catch {}
        setSearchingCatalog(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [remapSearchQuery, remapModalOpen])

  // Confirm Remap to chosen product
  const handleConfirmRemap = async (productId: string) => {
    if (!batchId || !activeRowForRemap) return
    try {
      await updateAdminLegacyRow(batchId, activeRowForRemap.id, {
        action: 'remap',
        productId,
      })
      setRemapModalOpen(false)
      setActiveRowForRemap(null)
      loadRows()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Open Create Product Drawer
  const openCreateModal = (row: any) => {
    setActiveRowForCreate(row)
    const defaultCat = categories[0]?.id || ''
    const defaultBrand = brands.find((b) => b.name.toLowerCase() === (row.sourceBrand || '').toLowerCase())?.id || brands[0]?.id || ''

    setCreateFormData({
      nameAr: row.sourceProductName || '',
      nameFr: row.sourceProductName || '',
      basePartNumber: row.sourceReference || '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      categoryId: defaultCat,
      brandId: defaultBrand,
      price: row.sourceSellingPrice || (row.sourceUnitCost ? Math.round(row.sourceUnitCost * 1.3) : 0),
      stockQuantity: row.sourceQuantity || 1,
    })
    setCreateModalOpen(true)
  }

  // Submit Create Product
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId || !activeRowForCreate) return
    setCreatingProduct(true)
    try {
      await createAdminProductFromLegacyRow(batchId, {
        rowId: activeRowForCreate.id,
        ...createFormData,
      })
      setCreateModalOpen(false)
      setActiveRowForCreate(null)
      loadRows()
    } catch (err: any) {
      alert(`فشل إنشاء المنتج: ${err.message}`)
    } finally {
      setCreatingProduct(false)
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (!batchId) return
    try {
      await bulkActionAdminLegacyRows(batchId, action)
      loadRows()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Confirm Import Execution
  const handleExecuteImport = async () => {
    if (!batchId) return
    setConfirmingImport(true)
    try {
      const res = await confirmAdminLegacyImport(batchId)
      setConfirmModalOpen(false)
      setCurrentBatch(res.batch)
      setReconciliationReport(res.reconciliation)
      setActiveTab('reconciliation')
    } catch (err: any) {
      alert(`خطأ أثناء تنفيذ الاستيراد: ${err.message}`)
    } finally {
      setConfirmingImport(false)
    }
  }

  // View Reconciliation for historical batch
  const handleViewReconciliation = async (targetBatchId: string) => {
    setLoadingReconciliation(true)
    setActiveTab('reconciliation')
    try {
      const report = await fetchAdminLegacyReconciliation(targetBatchId)
      setReconciliationReport(report)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingReconciliation(false)
    }
  }

  // Rollback Execution
  const handleExecuteRollback = async () => {
    if (!batchToRollback) return
    setRollingBack(true)
    try {
      const res = await rollbackAdminLegacyImport(batchToRollback.id)
      alert(res.message)
      setRollbackModalOpen(false)
      setBatchToRollback(null)
      loadHistory()
    } catch (err: any) {
      alert(`فشل التراجع: ${err.message}`)
    } finally {
      setRollingBack(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 border border-blue-200/60">
            <Database className="h-3.5 w-3.5" /> نظام الترحيل والاستيراد الآمن (Legacy PDF Importer)
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            استيراد وترحيل المخزون والفواتير
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            ترحيل آمن لملفات الجرد وفواتير الشراء السابقة، مطابقة القطع بدقة متناهية وسجل محاسبي كامل
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-cairo text-xs font-bold transition-all ${
                activeTab === 'wizard' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5" /> معالج الاستيراد
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-cairo text-xs font-bold transition-all ${
                activeTab === 'reconciliation' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" /> تقرير المطابقة
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-cairo text-xs font-bold transition-all ${
                activeTab === 'history' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <History className="h-3.5 w-3.5" /> سجل العمليات والتراجع
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: WIZARD & ACTIVE IMPORT WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'wizard' && (
        <div className="space-y-6">
          {/* ─── STEP 1: IMPORT TYPE SELECTION ─── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              disabled={Boolean(batchId && currentBatch?.status !== 'UPLOADED')}
              onClick={() => setImportType('opening_stock')}
              className={`text-right rounded-3xl border p-5 transition-all cursor-pointer ${
                importType === 'opening_stock'
                  ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-600/30'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                    <Warehouse className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-cairo text-sm font-black text-zinc-900">أ. جرد المخزون الأولي (Opening Stock)</p>
                    <p className="text-[11px] text-zinc-500 font-bold">ملفات الجرد الدوري وكميات المستودع الحقيقية</p>
                  </div>
                </div>
                {importType === 'opening_stock' && <CheckCircle2 className="h-5 w-5 text-brand-600" />}
              </div>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed font-normal">
                يُنشئ رصيداً افتتاحياً دقيقاً في المستودع بدون تكرار الشراء أو استبدال أسعار البيع بتكلفة الشراء.
              </p>
            </button>

            <button
              type="button"
              disabled={Boolean(batchId && currentBatch?.status !== 'UPLOADED')}
              onClick={() => setImportType('purchase_history')}
              className={`text-right rounded-3xl border p-5 transition-all cursor-pointer ${
                importType === 'purchase_history'
                  ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/30'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                    <Database className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-cairo text-sm font-black text-zinc-900">ب. سجل فواتير المشتريات (Achat History)</p>
                    <p className="text-[11px] text-zinc-500 font-bold">فواتير وسندات استلام الموردين والأسعار</p>
                  </div>
                </div>
                {importType === 'purchase_history' && <CheckCircle2 className="h-5 w-5 text-purple-600" />}
              </div>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed font-normal">
                يحفظ بيانات المورد، رقم الفاتورة، تاريخ الاستلام، وتكلفة الشراء التاريخية مع إضافة كميات الحركات.
              </p>
            </button>
          </div>

          {/* ─── STEP 2: UPLOAD & PDF SELECTION ─── */}
          {!batchId ? (
            <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-8 text-center shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, false)}
              />

              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-zinc-50 text-zinc-400 border">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-brand-600" /> : <UploadCloud className="h-8 w-8" />}
              </div>

              <h3 className="mt-4 font-cairo text-base font-black text-zinc-900">
                اسحب وأفلت ملف الـ PDF هنا أو اضغط للاختيار
              </h3>
              <p className="mt-1 text-xs text-zinc-400 font-bold">
                ندعم ملفات الجرد والفواتير متعددة الصفحات (حتى 50 ميغابايت) مع الحماية ضد التكرار وفحص البصمة الرقمية
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 font-cairo text-xs font-black text-white hover:bg-black transition-all shadow-md"
                >
                  <FileText className="h-4 w-4" /> اختيار ملف من الجهاز
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleFileUpload(undefined, true)}
                  className="flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50/80 px-6 py-3 font-cairo text-xs font-black text-brand-700 hover:bg-brand-100 transition-all"
                >
                  <Zap className="h-4 w-4 text-brand-600" /> تجربة ملف الجرد الفعلي (Etat_Article_tout.PDF - 88 صفحة)
                </button>
              </div>
            </div>
          ) : (
            /* ─── ACTIVE BATCH BAR & SUMMARY METRICS ─── */
            <div className="space-y-4">
              {/* Top Batch Status Bar */}
              <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-cairo text-sm font-black text-zinc-900">{currentBatch?.filename}</p>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-black text-zinc-700">
                        {currentBatch?.import_type === 'purchase_history' ? 'فاتورة مشتريات' : 'جرد مخزون'}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                        currentBatch?.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : currentBatch?.status === 'REVIEW_REQUIRED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {currentBatch?.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                      SHA-256: {currentBatch?.file_hash?.slice(0, 16)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBatchId(null)
                      setCurrentBatch(null)
                      setRows([])
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 font-cairo text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    رفع ملف آخر
                  </button>

                  <button
                    onClick={() => batchId && triggerAnalysis(batchId)}
                    disabled={analyzing || !batchId}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 font-cairo text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                    <span>إعادة التحليل</span>
                  </button>

                  <button
                    disabled={analyzing || (rowsSummary.total === 0 && !currentBatch?.total_rows)}
                    onClick={() => setConfirmModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>تأكيد وتنفيذ الترحيل</span>
                  </button>
                </div>
              </div>

              {/* KPI Preview Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-extrabold text-zinc-500 font-cairo">إجمالي الأصناف</p>
                  <p className="mt-2 font-cairo text-2xl font-black text-zinc-900">
                    {(rowsSummary.total || currentBatch?.total_rows || 0).toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1">مستخرجة من الـ PDF</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold text-emerald-800 font-cairo">تطابق تام ومؤكد</p>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 font-cairo text-2xl font-black text-emerald-950">
                    {((rowsSummary.matchedExact + rowsSummary.matchedHigh + (rowsSummary.manualMatched || 0)) || currentBatch?.matched_rows || 0).toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">مطابقة لقطع الكتالوج الحالية</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold text-amber-800 font-cairo">تحتاج مراجعة</p>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 font-cairo text-2xl font-black text-amber-950">
                    {(rowsSummary.needsReview || currentBatch?.summary?.needsReviewCount || 0).toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] text-amber-700 font-bold mt-1">تطابق تقريبي يتطلب التأكيد</p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold text-red-800 font-cairo">غير مطابقة في الكتالوج</p>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="mt-2 font-cairo text-2xl font-black text-red-950">
                    {(rowsSummary.unmatched || currentBatch?.unmatched_rows || 0).toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] text-red-700 font-bold mt-1">يمكن إنشاؤها بضغطة زر</p>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 shadow-sm">
                  <p className="text-[11px] font-extrabold text-purple-800 font-cairo">الكمية وقيمة الشراء</p>
                  <p className="mt-2 font-cairo text-lg font-black text-purple-950">
                    {Number(currentBatch?.total_quantity || 0).toLocaleString('en-US')} <span className="text-xs">قطعة</span>
                  </p>
                  <p className="text-[10px] text-purple-700 font-bold mt-1">
                    {formatPrice(currentBatch?.total_purchase_value || 0)}
                  </p>
                </div>
              </div>

              {/* ─── REVIEW WORKSPACE (STEP 5 & 6) ─── */}
              <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden space-y-3 p-4">
                {/* Search & Action Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadRows()}
                        placeholder="ابحث بالمرجع المستخرج، اسم القطعة، أو الماركة..."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-2 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none focus:border-brand-600 focus:bg-white"
                      />
                    </div>
                    <button
                      onClick={() => loadRows()}
                      className="rounded-xl bg-zinc-900 px-4 py-2 font-cairo text-xs font-bold text-white hover:bg-black transition-colors cursor-pointer"
                    >
                      بحث
                    </button>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleBulkAction('auto_create_unmatched_and_accept_all')}
                      className="rounded-xl bg-purple-600 px-3.5 py-1.5 font-cairo text-xs font-black text-white hover:bg-purple-700 shadow-sm transition-colors cursor-pointer"
                      title="إنشاء قطع جديدة لكافة الأصناف غير المطابقة واعتماد الجميع"
                    >
                      ✨ إنشاء كافة الأصناف غير المطابقة واعتماد الجميع
                    </button>
                    <button
                      onClick={() => handleBulkAction('accept_all_high_confidence')}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-cairo text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      قبول المطابقات المقترحة
                    </button>
                    <button
                      onClick={() => handleBulkAction('skip_all_unmatched')}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-cairo text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      تخطي غير المطابق
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 overflow-x-auto">
                  <span className="text-xs font-black text-zinc-400 ml-1">تصفية العرض:</span>
                  {[
                    { id: 'all', label: `الكل (${rowsSummary.total || currentBatch?.total_rows || 0})` },
                    { id: 'matched', label: `المطابقة المؤكدة (${(rowsSummary.matchedExact + rowsSummary.matchedHigh + (rowsSummary.manualMatched || 0)) || currentBatch?.matched_rows || 0})` },
                    { id: 'needs_review', label: `تحتاج مراجعة (${rowsSummary.needsReview || currentBatch?.summary?.needsReviewCount || 0})` },
                    { id: 'unmatched', label: `غير مطابقة (${rowsSummary.unmatched || currentBatch?.unmatched_rows || 0})` },
                    { id: 'skipped', label: `المستثناة (${rowsSummary.skipped || currentBatch?.skipped_rows || 0})` },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      onClick={() => {
                        setRowStatusFilter(flt.id as any)
                        setPagination((p) => ({ ...p, page: 1 }))
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                        rowStatusFilter === flt.id
                          ? 'bg-zinc-900 text-white font-black shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                {/* Rows Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">البيانات المستخرجة من الـ PDF</th>
                        <th className="p-3">الكمية والأسعار</th>
                        <th className="p-3">المنتج المقترح في KAS</th>
                        <th className="p-3">حالة التطابق</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-bold">
                      {loadingRows || analyzing ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-zinc-400">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                            جاري استخراج ومطابقة البيانات...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-zinc-400">
                            لا توجد صفوف مطابقة للفلتر المحدد
                          </td>
                        </tr>
                      ) : (
                        rows.map((r) => {
                          const isReview = r.matchStatus === 'MATCHED_REVIEW_REQUIRED'
                          const isSkipped = r.matchStatus === 'SKIPPED'

                          const matchBadgeColor =
                            r.matchStatus === 'MATCHED_EXACT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.matchStatus === 'MATCHED_HIGH_CONFIDENCE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : r.matchStatus === 'MANUAL_MATCHED' || r.matchStatus === 'NEW_PRODUCT_CREATED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : r.matchStatus === 'MATCHED_REVIEW_REQUIRED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isSkipped
                              ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                              : 'bg-red-50 text-red-700 border-red-200'

                          return (
                            <tr key={r.id} className={`hover:bg-zinc-50/80 transition-colors ${isSkipped ? 'opacity-50' : ''}`}>
                              <td className="p-3 text-[11px] text-zinc-400 font-mono">
                                ص {r.pageNumber} / {r.rowIndex}
                              </td>

                              <td className="p-3 max-w-xs">
                                <p className="font-cairo font-black text-zinc-900 truncate" title={r.sourceProductName}>
                                  {r.sourceProductName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-[11px] text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded" dir="ltr">
                                    {r.sourceReference}
                                  </span>
                                  {r.sourceBrand && (
                                    <span className="text-[10px] text-zinc-400 font-bold">{r.sourceBrand}</span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <span className="font-cairo text-zinc-900 font-black">
                                    {r.sourceQuantity} قطعة
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                    <span>شراء: {formatPrice(r.sourceUnitCost || 0)}</span>
                                    {r.sourceSellingPrice > 0 && (
                                      <span>| بيع: {formatPrice(r.sourceSellingPrice)}</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 max-w-xs">
                                {r.kasProductName ? (
                                  <div>
                                    <p className="font-cairo font-black text-zinc-900 truncate">
                                      {r.kasProductName}
                                    </p>
                                    <p className="text-[10px] text-zinc-400" dir="ltr">
                                      PN: {r.kasPartNumber} | المخزون الحالي: {r.kasCurrentStock ?? 0}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">غير مرتبط بمنتج</span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-black ${matchBadgeColor}`}>
                                  {r.matchStatus === 'MATCHED_EXACT'
                                    ? 'تطابق تام'
                                    : r.matchStatus === 'MATCHED_HIGH_CONFIDENCE'
                                    ? `مطابق مؤكد (${Math.round((r.matchConfidence || 0.9) * 100)}%)`
                                    : r.matchStatus === 'MANUAL_MATCHED'
                                    ? 'مطابقة يدوية'
                                    : r.matchStatus === 'NEW_PRODUCT_CREATED'
                                    ? 'منتج جديد'
                                    : r.matchStatus === 'MATCHED_REVIEW_REQUIRED'
                                    ? `مراجعة (${Math.round((r.matchConfidence || 0.6) * 100)}%)`
                                    : isSkipped
                                    ? 'مستثنى'
                                    : 'غير مطابق'}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap min-w-[130px]">
                                  {isReview && r.matchedProductId && (
                                    <button
                                      onClick={() => handleAcceptMatch(r.id)}
                                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 font-cairo text-xs font-black text-white hover:bg-emerald-700 shadow-sm hover:shadow transition-all cursor-pointer"
                                      title="قبول وتأكيد التطابق"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>قبول</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => openRemapModal(r)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 font-cairo text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white shadow-sm transition-all cursor-pointer"
                                    title="ربط مع قطعة أخرى من الكتالوج"
                                  >
                                    <LinkIcon className="h-3.5 w-3.5" />
                                    <span>ربط</span>
                                  </button>

                                  <button
                                    onClick={() => openCreateModal(r)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50/80 px-2.5 py-1.5 font-cairo text-xs font-bold text-purple-700 hover:bg-purple-600 hover:text-white shadow-sm transition-all cursor-pointer"
                                    title="إنشاء كقطعة جديدة في الكتالوج"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>إنشاء</span>
                                  </button>

                                  <button
                                    onClick={() => handleToggleSkip(r)}
                                    className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-cairo text-xs font-bold transition-all cursor-pointer ${
                                      isSkipped
                                        ? 'bg-zinc-800 text-white border-zinc-900 shadow-sm'
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm'
                                    }`}
                                    title={isSkipped ? 'إلغاء الاستثناء' : 'استثناء من الاستيراد'}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    <span>{isSkipped ? 'ملغى' : 'تخطي'}</span>
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
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs font-bold text-zinc-500">
                  <span>إجمالي {pagination.total} صنف</span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                      className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
                    >
                      السابق
                    </button>
                    <span className="px-2 font-cairo font-black text-zinc-900">
                      صفحة {pagination.page} من {pagination.pages || 1}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RECONCILIATION REPORT VIEW
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          {loadingReconciliation ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center text-zinc-400">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600 mb-2" />
              <p className="font-cairo text-sm font-black text-zinc-700">جاري تحميل تقرير المطابقة...</p>
            </div>
          ) : !reconciliationReport ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center text-zinc-400">
              <FileCheck className="mx-auto h-10 w-10 text-zinc-300 mb-2" />
              <p className="font-cairo text-sm font-black text-zinc-700">لا يوجد تقرير مطابقة معروض حالياً</p>
              <p className="text-xs text-zinc-400 mt-1">قم بتنفيذ استيراد جديد أو اختر دفعة من سجل العمليات لعرض تقرير مطابقتها</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Report Header Card */}
              <div className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> تقرير المطابقة المحاسبية (Reconciliation Report)
                  </span>
                  <h2 className="mt-2 font-cairo text-xl font-black text-zinc-900">
                    دفعة: {reconciliationReport.filename}
                  </h2>
                  <p className="text-xs text-zinc-500 font-bold mt-1">
                    نوع العملية: {reconciliationReport.importType === 'purchase_history' ? 'فاتورة مشتريات' : 'جرد مخزون'} | كود الدفعة: #{reconciliationReport.batchId?.slice(0, 8)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white p-3 border border-emerald-200">
                    <p className="text-[10px] text-zinc-400 font-bold">الكمية المصدر</p>
                    <p className="font-cairo text-lg font-black text-zinc-900">{reconciliationReport.totalSourceQuantity}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 border border-emerald-200">
                    <p className="text-[10px] text-zinc-400 font-bold">الكمية المرحلة</p>
                    <p className="font-cairo text-lg font-black text-emerald-600">{reconciliationReport.totalImportedQuantity}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 border border-emerald-200">
                    <p className="text-[10px] text-zinc-400 font-bold">الفارق المحاسبي</p>
                    <p className={`font-cairo text-lg font-black ${reconciliationReport.totalQuantityVariance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {reconciliationReport.totalQuantityVariance}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Detail Table */}
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
                      <tr>
                        <th className="p-4">#</th>
                        <th className="p-4">المنتج / رقم القطعة</th>
                        <th className="p-4">الكمية المصدر</th>
                        <th className="p-4">الكمية المرحلة</th>
                        <th className="p-4">المخزون قبل / بعد</th>
                        <th className="p-4">التكلفة الإجمالية</th>
                        <th className="p-4 text-center">حالة المطابقة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-bold">
                      {reconciliationReport.items?.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-zinc-50/80">
                          <td className="p-4 text-zinc-400 font-mono">{item.rowIndex}</td>
                          <td className="p-4">
                            <p className="font-cairo font-black text-zinc-900">{item.productName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono" dir="ltr">{item.partNumber}</p>
                          </td>
                          <td className="p-4 font-cairo text-zinc-900">{item.sourceQuantity} قطعة</td>
                          <td className="p-4 font-cairo text-emerald-600">+{item.importedQuantity} قطعة</td>
                          <td className="p-4 text-zinc-500 text-[11px]">
                            {item.stockBefore} ← <span className="text-zinc-900 font-black">{item.stockAfter} قطعة</span>
                          </td>
                          <td className="p-4 font-cairo font-black text-zinc-900">
                            {formatPrice(item.totalCost || 0)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black ${
                              item.status === 'MATCH'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'SKIPPED'
                                ? 'bg-zinc-100 text-zinc-500'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {item.status === 'MATCH' ? '✓ تطابق تام (0 فارق)' : item.status === 'SKIPPED' ? 'مستثنى' : '⚠ عدم تطابق'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: IMPORT HISTORY & SAFE ROLLBACK
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 p-4">
              <div>
                <h3 className="font-cairo text-sm font-black text-zinc-900">سجل عمليات الترحيل السابقة</h3>
                <p className="text-xs text-zinc-500">متابعة كافة الدفعات المرحلة مع إمكانية التراجع الآمن عن أي دفعة</p>
              </div>
              <button
                onClick={loadHistory}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> تحديث
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 font-cairo font-extrabold text-zinc-500">
                  <tr>
                    <th className="p-4">كود الدفعة</th>
                    <th className="p-4">الملف / النوع</th>
                    <th className="p-4">الأصناف والكمية</th>
                    <th className="p-4">قيمة الشراء</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">بواسطة / التاريخ</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-zinc-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                        جاري تحميل سجل الاستيراد...
                      </td>
                    </tr>
                  ) : historyList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-zinc-400">
                        لم يتم تنفيذ أي عمليات استيراد بعد
                      </td>
                    </tr>
                  ) : (
                    historyList.map((h) => {
                      const isCompleted = h.status === 'COMPLETED'
                      const isRolledBack = h.status === 'ROLLED_BACK'

                      return (
                        <tr key={h.id} className="hover:bg-zinc-50">
                          <td className="p-4 font-mono text-[11px] text-zinc-500" dir="ltr">
                            #{h.id.slice(0, 8)}
                          </td>

                          <td className="p-4">
                            <p className="font-cairo font-black text-zinc-900">{h.filename}</p>
                            <span className="text-[10px] text-zinc-400">
                              {h.importType === 'purchase_history' ? 'فاتورة مشتريات' : 'جرد مخزون'}
                            </span>
                          </td>

                          <td className="p-4">
                            <p className="font-cairo font-black text-zinc-900">
                              {h.importedRows || h.totalRows} صنف ({h.totalQuantity} قطعة)
                            </p>
                            {h.skippedRows > 0 && (
                              <p className="text-[10px] text-zinc-400">تخطي {h.skippedRows} صنف</p>
                            )}
                          </td>

                          <td className="p-4 font-cairo font-black text-zinc-900">
                            {formatPrice(h.totalPurchaseValue || 0)}
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-black ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isRolledBack
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isCompleted ? '✓ مكتمل' : isRolledBack ? '↩ تم التراجع' : h.status}
                            </span>
                          </td>

                          <td className="p-4">
                            <p className="font-cairo text-zinc-700">{h.createdBy}</p>
                            <p className="text-[10px] text-zinc-400" dir="ltr">
                              {new Date(h.createdAt).toLocaleString('fr-FR')}
                            </p>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewReconciliation(h.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95 cursor-pointer"
                              >
                                <Eye className="h-4 w-4 text-zinc-500" />
                                <span>تقرير المطابقة</span>
                              </button>

                              {isCompleted && (
                                <button
                                  onClick={() => {
                                    setBatchToRollback(h)
                                    setRollbackModalOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 shadow-2xs hover:bg-red-100 hover:border-red-300 transition-all active:scale-95 cursor-pointer"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  <span>تراجع</span>
                                </button>
                              )}
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

      {/* ─── MODAL 1: REMAP PRODUCT SEARCH ─── */}
      {remapModalOpen && activeRowForRemap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="modal-in relative w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-cairo text-base font-black text-zinc-900">ربط القطعة مع منتج من الكتالوج</h3>
                <p className="text-xs text-zinc-500 font-mono" dir="ltr">
                  {activeRowForRemap.sourceReference} - {activeRowForRemap.sourceProductName}
                </p>
              </div>
              <button onClick={() => setRemapModalOpen(false)} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  value={remapSearchQuery}
                  onChange={(e) => setRemapSearchQuery(e.target.value)}
                  placeholder="ابحث باسم القطعة، رقم PN، أو كود SKU..."
                  className="w-full rounded-xl border border-zinc-300 p-3 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none focus:border-brand-600"
                  autoFocus
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-zinc-100">
                {searchingCatalog ? (
                  <div className="p-8 text-center text-zinc-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-600 mb-1" />
                    جاري البحث في الكتالوج...
                  </div>
                ) : remapSearchResults.length === 0 ? (
                  <p className="p-8 text-center text-xs text-zinc-400 font-bold">
                    لم يتم العثور على قطع مطابقة للبحث
                  </p>
                ) : (
                  remapSearchResults.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 pt-4 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 font-cairo font-black text-xs text-zinc-700">
                          {prod.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-cairo text-xs font-black text-zinc-900">{prod.name}</p>
                          <p className="text-[10px] text-zinc-400" dir="ltr">PN: {prod.partNumber} | {prod.sku}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfirmRemap(prod.id)}
                        className="rounded-xl bg-zinc-900 px-4 py-2 font-cairo text-xs font-bold text-white hover:bg-brand-600 transition-colors"
                      >
                        ربط الصنف
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CREATE PRODUCT DRAWER ─── */}
      {createModalOpen && activeRowForCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="modal-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-cairo text-base font-black text-zinc-900">إنشاء قطعة جديدة وإضافتها للكتالوج</h3>
                <p className="text-xs text-zinc-500">سيتم تسجيل القطعة وربطها فوراً مع الصف المستورد</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3 pt-4 text-xs font-bold">
              <div>
                <label className="text-zinc-700 block mb-1">اسم القطعة بالعربية *</label>
                <input
                  required
                  value={createFormData.nameAr}
                  onChange={(e) => setCreateFormData({ ...createFormData, nameAr: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 block mb-1">رقم القطعة الأساسي (Part Number) *</label>
                  <input
                    required
                    value={createFormData.basePartNumber}
                    onChange={(e) => setCreateFormData({ ...createFormData, basePartNumber: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-zinc-700 block mb-1">كود SKU *</label>
                  <input
                    required
                    value={createFormData.sku}
                    onChange={(e) => setCreateFormData({ ...createFormData, sku: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 block mb-1">القسم / الفئة *</label>
                  <select
                    required
                    value={createFormData.categoryId}
                    onChange={(e) => setCreateFormData({ ...createFormData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_ar || c.nameAr || c.slug}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-700 block mb-1">العلامة التجارية *</label>
                  <select
                    required
                    value={createFormData.brandId}
                    onChange={(e) => setCreateFormData({ ...createFormData, brandId: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 block mb-1">سعر البيع المقترح (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={createFormData.price}
                    onChange={(e) => setCreateFormData({ ...createFormData, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-zinc-700 block mb-1">كمية الاستيراد *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createFormData.stockQuantity}
                    onChange={(e) => setCreateFormData({ ...createFormData, stockQuantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/30"
                >
                  {creatingProduct && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  حفظ وإدراج في الكتالوج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: CONFIRM IMPORT EXECUTION ─── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="modal-in relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl text-right" dir="rtl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-brand-50 text-brand-600 border border-brand-100 mb-4">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h3 className="font-cairo text-lg font-black text-zinc-900 text-center">
              تأكيد ترحيل حركة المخزون نهائياً
            </h3>
            <p className="text-xs text-zinc-600 text-center mt-1 leading-relaxed font-normal">
              سيقوم النظام بإنشاء حركات جرد متسلسلة في <span className="font-bold text-zinc-900">سجل المخزون المحاسبي (Audit Ledger)</span> وتحديث كميات القطع الجاهزة للطلب على المتجر.
            </p>

            <div className="my-4 rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80 space-y-2 text-xs font-bold text-zinc-700">
              <div className="flex justify-between">
                <span>عدد الأصناف المرحلة:</span>
                <span className="font-black text-zinc-900 font-mono">
                  {(rowsSummary.matchedExact + rowsSummary.matchedHigh + (rowsSummary.manualMatched || 0) + (rowsSummary.newProductCreated || 0))} صنف
                </span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي قطع المخزون المضافة:</span>
                <span className="font-black text-emerald-600 font-mono">+{currentBatch?.total_quantity} قطعة</span>
              </div>
              <div className="flex justify-between">
                <span>القيمة الإجمالية المقدرة:</span>
                <span className="font-black text-zinc-900 font-mono">{formatPrice(currentBatch?.total_purchase_value || 0)}</span>
              </div>
            </div>

            {rowsSummary.unmatched > 0 && (
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs font-bold text-amber-800 flex items-start gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>تنبيه: يوجد {rowsSummary.unmatched} صنف غير مطابق سيتم تخطيه واستثناؤه تلقائياً.</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-300 py-3 font-cairo text-xs font-bold text-zinc-700"
              >
                إلغاء ومراجعة
              </button>
              <button
                type="button"
                disabled={confirmingImport}
                onClick={handleExecuteImport}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
              >
                {confirmingImport && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                تأكيد الترحيل الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: ROLLBACK CONFIRMATION ─── */}
      {rollbackModalOpen && batchToRollback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="modal-in relative w-full max-w-md overflow-hidden rounded-3xl border border-red-200 bg-white p-6 shadow-2xl text-right" dir="rtl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-red-50 text-red-600 border border-red-100 mb-4">
              <RotateCcw className="h-7 w-7" />
            </div>

            <h3 className="font-cairo text-lg font-black text-zinc-900 text-center">
              تأكيد التراجع عن دفعة الاستيراد
            </h3>
            <p className="text-xs text-zinc-600 text-center mt-1 leading-relaxed font-normal">
              هل أنت متأكد من التراجع عن الدفعة <span className="font-bold text-zinc-900">#{batchToRollback.id.slice(0, 8)} ({batchToRollback.filename})</span>؟ سيتم خصم الكميات التي تمت إضافتها وإعادة رصيد المستودع تماماً لما كان عليه قبل الترحيل.
            </p>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setRollbackModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-300 py-3 font-cairo text-xs font-bold text-zinc-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={rollingBack}
                onClick={handleExecuteRollback}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 font-cairo text-xs font-black text-white hover:bg-red-700 shadow-md shadow-red-600/30"
              >
                {rollingBack && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                تأكيد التراجع الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
