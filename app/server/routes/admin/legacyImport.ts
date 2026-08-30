import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { query } from '../../db/db.js'
import {
  extractDataFromPdf,
  validatePdfMagicBytes,
  computeFileHash,
  checkFileDuplicate,
} from '../../lib/pdfExtractor.js'
import {
  loadCatalogSnapshot,
  matchItemAgainstCatalog,
} from '../../lib/productMatcher.js'
import {
  executeBatchImport,
  rollbackBatchImport,
} from '../../lib/importService.js'

const router = Router()

// Memory store for in-progress PDF file buffers during upload/analyze session
const pdfBufferCache = new Map<string, Buffer>()

// Cache cleanup timer (remove buffers older than 2 hours)
setInterval(() => {
  if (pdfBufferCache.size > 20) {
    pdfBufferCache.clear()
  }
}, 2 * 60 * 60 * 1000)

/**
 * POST /api/v1/admin/import/upload
 * Accepts base64 PDF upload or references existing local PDF file
 */
router.post('/upload', async (req, res) => {
  try {
    const { fileData, filename, importType = 'opening_stock', useSampleFile } = req.body
    const adminName = req.adminUser?.name || 'مسؤول النظام'

    let buffer: Buffer
    let finalFilename = filename || 'document.pdf'

    if (useSampleFile) {
      // Load sample file from root workspace
      const samplePath = path.resolve(process.cwd(), '..', 'Etat_Article_tout (1).PDF')
      const altSamplePath = path.resolve(process.cwd(), 'Etat_Article_tout (1).PDF')
      const targetPath = fs.existsSync(samplePath) ? samplePath : fs.existsSync(altSamplePath) ? altSamplePath : null

      if (!targetPath) {
        return res.status(404).json({ error: 'لم يتم العثور على ملف العينة Etat_Article_tout (1).PDF في السيرفر' })
      }
      buffer = fs.readFileSync(targetPath)
      finalFilename = 'Etat_Article_tout (1).PDF'
    } else {
      if (!fileData) {
        return res.status(400).json({ error: 'لم يتم إرسال ملف PDF' })
      }

      const rawBase64 = String(fileData).replace(/^data:application\/pdf;base64,/i, '').trim()
      buffer = Buffer.from(rawBase64, 'base64')
    }

    // 1. Enforce size limit (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'حجم الملف يتجاوز الحد المسموح به (50 ميغابايت كحد أقصى)' })
    }

    // 2. Validate PDF magic bytes
    if (!validatePdfMagicBytes(buffer)) {
      return res.status(400).json({ error: 'الملف المرفوع ليس ملف PDF صالح' })
    }

    // 3. Compute hash and duplicate check
    const fileHash = computeFileHash(buffer)
    const dupCheck = await checkFileDuplicate(fileHash)

    // 4. Create batch in UPLOADED state
    const batchId = randomUUID()
    const validImportType = importType === 'purchase_history' ? 'purchase_history' : 'opening_stock'

    await query(
      `INSERT INTO import_batches 
       (id, filename, file_hash, import_type, status, created_by)
       VALUES ($1, $2, $3, $4, 'UPLOADED', $5)`,
      [batchId, finalFilename, fileHash, validImportType, adminName]
    )

    // Cache buffer in memory for analysis step
    pdfBufferCache.set(batchId, buffer)

    res.status(201).json({
      success: true,
      batchId,
      filename: finalFilename,
      fileHash,
      importType: validImportType,
      fileSizeBytes: buffer.length,
      isDuplicateFile: dupCheck.isDuplicate,
      previousBatchId: dupCheck.batchId,
      message: dupCheck.isDuplicate
        ? 'تم رفع الملف بنجاح (تنبيه: تم استيراد هذا الملف مسبقاً بنفس البصمة الرقمية)'
        : 'تم رفع الملف بنجاح وهو جاهز للتحليل واستخراج البيانات',
    })
  } catch (err: any) {
    console.error('[IMPORT ERROR] Upload failed:', err)
    res.status(500).json({ error: `فشل رفع الملف: ${err.message}` })
  }
})

/**
 * POST /api/v1/admin/import/:batchId/analyze
 * Extracts text/tables and performs conservative catalog matching
 */
router.post('/:batchId/analyze', async (req, res) => {
  try {
    const { batchId } = req.params
    const batchRes = await query(`SELECT * FROM import_batches WHERE id = $1`, [batchId])

    if (batchRes.rows.length === 0) {
      return res.status(404).json({ error: 'دفعة الاستيراد غير موجودة' })
    }

    const batch = batchRes.rows[0]
    let buffer = pdfBufferCache.get(batchId)

    if (!buffer) {
      // Check if sample file can be re-read
      if (batch.filename === 'Etat_Article_tout (1).PDF') {
        const samplePath = path.resolve(process.cwd(), '..', 'Etat_Article_tout (1).PDF')
        const altSamplePath = path.resolve(process.cwd(), 'Etat_Article_tout (1).PDF')
        const targetPath = fs.existsSync(samplePath) ? samplePath : fs.existsSync(altSamplePath) ? altSamplePath : null
        if (targetPath) {
          buffer = fs.readFileSync(targetPath)
          pdfBufferCache.set(batchId, buffer)
        }
      }
    }

    if (!buffer) {
      return res.status(400).json({ error: 'انتهت صلاحية جلسة الملف المؤقتة. يرجى إعادة رفع ملف الـ PDF.' })
    }

    console.log(`[IMPORT] Starting extraction and matching for batch #${batchId.slice(0, 8)} (${batch.filename})...`)
    await query(`UPDATE import_batches SET status = 'PROCESSING' WHERE id = $1`, [batchId])

    // 1. Extract PDF data
    const extraction = await extractDataFromPdf(buffer, batch.import_type)
    console.log(`[IMPORT] Extraction complete. Found ${extraction.totalRows} rows across ${extraction.pageCount} pages.`)

    // 2. Load catalog snapshot for matching
    const catalog = await loadCatalogSnapshot()
    console.log(`[IMPORT] Catalog snapshot loaded with ${catalog.length} active products. Performing matching...`)

    // 3. Clear any existing rows for this batch (if re-analyzing)
    await query(`DELETE FROM import_batch_rows WHERE batch_id = $1`, [batchId])

    // 4. Match items and store in import_batch_rows
    let matchedExactCount = 0
    let matchedHighCount = 0
    let needsReviewCount = 0
    let unmatchedCount = 0
    let warningsCount = extraction.warnings.length

    for (let i = 0; i < extraction.rows.length; i++) {
      const row = extraction.rows[i]
      const match = matchItemAgainstCatalog(row.reference, row.productName, row.brand, catalog)

      if (match.matchStatus === 'MATCHED_EXACT') matchedExactCount++
      else if (match.matchStatus === 'MATCHED_HIGH_CONFIDENCE') matchedHighCount++
      else if (match.matchStatus === 'MATCHED_REVIEW_REQUIRED') needsReviewCount++
      else unmatchedCount++

      if (row.warnings.length > 0) warningsCount += row.warnings.length

      const rowId = randomUUID()
      await query(
        `INSERT INTO import_batch_rows
         (id, batch_id, row_index, page_number, source_raw_text, source_reference, source_product_name, source_brand,
          source_supplier, source_invoice_number, source_invoice_date, source_quantity, source_unit_cost,
          source_selling_price, source_total_cost, normalized_reference, normalized_product_name, normalized_brand,
          matched_product_id, matched_variant_id, match_status, match_method, match_confidence, match_notes, import_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'PENDING')`,
        [
          rowId,
          batchId,
          row.rowIndex,
          row.pageNumber,
          row.rawText,
          row.reference,
          row.productName,
          row.brand,
          row.supplier || batch.supplier_name || null,
          row.invoiceNumber || batch.invoice_number || null,
          row.invoiceDate || batch.invoice_date || null,
          row.quantity,
          row.unitCost,
          row.sellingPrice,
          row.totalCost,
          row.reference ? row.reference.replace(/[^A-Z0-9]/gi, '').toUpperCase() : null,
          row.productName ? row.productName.trim() : null,
          row.brand ? row.brand.trim() : null,
          match.productId || null,
          match.variantId || null,
          match.matchStatus,
          match.matchMethod,
          match.matchConfidence,
          match.notes || null,
        ]
      )
    }

    const matchedTotal = matchedExactCount + matchedHighCount
    const newStatus = (needsReviewCount > 0 || unmatchedCount > 0) ? 'REVIEW_REQUIRED' : 'PREVIEW_READY'

    // 5. Update batch metrics
    const summary = {
      pageCount: extraction.pageCount,
      totalRows: extraction.totalRows,
      matchedExactCount,
      matchedHighCount,
      needsReviewCount,
      unmatchedCount,
      warningsCount,
      totalQuantity: extraction.totalQuantity,
      totalPurchaseValue: extraction.totalPurchaseValue,
      supplierInfo: extraction.supplierInfo,
      warnings: extraction.warnings,
    }

    await query(
      `UPDATE import_batches 
       SET status = $1,
           total_rows = $2,
           matched_rows = $3,
           unmatched_rows = $4,
           warnings_count = $5,
           total_quantity = $6,
           total_purchase_value = $7,
           summary_json = $8
       WHERE id = $9`,
      [
        newStatus,
        extraction.totalRows,
        matchedTotal,
        unmatchedCount,
        warningsCount,
        extraction.totalQuantity,
        extraction.totalPurchaseValue,
        JSON.stringify(summary),
        batchId,
      ]
    )

    console.log(`[IMPORT] Batch #${batchId.slice(0, 8)} analysis finished. Status: ${newStatus}, Matched: ${matchedTotal}, Review: ${needsReviewCount}, Unmatched: ${unmatchedCount}`)

    res.json({
      success: true,
      batchId,
      status: newStatus,
      summary,
      message: 'تم تحليل الملف ومطابقة المنتجات بنجاح',
    })
  } catch (err: any) {
    console.error('[IMPORT ERROR] Analysis failed:', err)
    await query(`UPDATE import_batches SET status = 'FAILED' WHERE id = $1`, [req.params.batchId]).catch(() => {})
    res.status(500).json({ error: `فشل تحليل واستخراج البيانات من الملف: ${err.message}` })
  }
})

/**
 * GET /api/v1/admin/import/:batchId
 * Returns batch details, summary, and reconciliation if completed
 */
router.get('/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params
    const result = await query(`SELECT * FROM import_batches WHERE id = $1`, [batchId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'دفعة الاستيراد غير موجودة' })
    }

    const batch = result.rows[0]
    let summary = null
    let reconciliation = null
    try {
      summary = batch.summary_json ? JSON.parse(batch.summary_json) : null
      reconciliation = batch.reconciliation_json ? JSON.parse(batch.reconciliation_json) : null
    } catch {}

    res.json({
      ...batch,
      summary,
      reconciliation,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'فشل جلب تفاصيل الدفعة' })
  }
})

/**
 * GET /api/v1/admin/import/:batchId/rows
 * Paginated and filterable rows list
 */
router.get('/:batchId/rows', async (req, res) => {
  try {
    const { batchId } = req.params
    const { status, q, page = '1', limit = '50' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const pageLimit = Math.max(1, Math.min(200, parseInt(limit, 10)))
    const offset = (pageNum - 1) * pageLimit

    let sql = `
      SELECT 
        r.id, r.batch_id AS "batchId", r.row_index AS "rowIndex", r.page_number AS "pageNumber",
        r.source_raw_text AS "sourceRawText", r.source_reference AS "sourceReference",
        r.source_product_name AS "sourceProductName", r.source_brand AS "sourceBrand",
        r.source_supplier AS "sourceSupplier", r.source_invoice_number AS "sourceInvoiceNumber",
        r.source_invoice_date AS "sourceInvoiceDate", r.source_quantity AS "sourceQuantity",
        r.source_unit_cost AS "sourceUnitCost", r.source_selling_price AS "sourceSellingPrice",
        r.source_total_cost AS "sourceTotalCost", r.matched_product_id AS "matchedProductId",
        r.matched_variant_id AS "matchedVariantId", r.match_status AS "matchStatus",
        r.match_method AS "matchMethod", r.match_confidence AS "matchConfidence",
        r.match_notes AS "matchNotes", r.import_status AS "importStatus", r.error_message AS "errorMessage",
        p.name_ar AS "kasProductName", p.name_fr AS "kasProductNameFr", p.base_part_number AS "kasPartNumber",
        p.sku AS "kasSku", b.name AS "kasBrand",
        v.label_ar AS "kasVariantLabel", v.part_number AS "kasVariantPartNumber",
        v.stock_quantity AS "kasCurrentStock", v.price AS "kasSellingPrice"
      FROM import_batch_rows r
      LEFT JOIN products p ON p.id = r.matched_product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_variants v ON v.id = r.matched_variant_id
      WHERE r.batch_id = $1
    `
    const params: any[] = [batchId]

    if (status && status !== 'all') {
      if (status === 'matched') {
        sql += ` AND r.match_status IN ('MATCHED_EXACT', 'MATCHED_HIGH_CONFIDENCE', 'MANUAL_MATCHED', 'NEW_PRODUCT_CREATED')`
      } else if (status === 'needs_review') {
        sql += ` AND r.match_status = 'MATCHED_REVIEW_REQUIRED'`
      } else if (status === 'unmatched') {
        sql += ` AND r.match_status = 'UNMATCHED'`
      } else if (status === 'skipped') {
        sql += ` AND r.match_status = 'SKIPPED'`
      }
    }

    if (q) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      sql += ` AND (
        r.source_reference ILIKE $${idx} OR 
        r.source_product_name ILIKE $${idx} OR 
        r.source_brand ILIKE $${idx} OR
        p.name_ar ILIKE $${idx} OR
        v.part_number ILIKE $${idx}
      )`
    }

    const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
    const countRes = await query(countSql, params)
    const total = Number(countRes.rows[0]?.count || 0)

    sql += ` ORDER BY r.row_index ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageLimit, offset)

    const result = await query(sql, params)

    // Summary counts for quick tabs
    const countsRes = await query(
      `SELECT match_status, COUNT(*) as count 
       FROM import_batch_rows 
       WHERE batch_id = $1 
       GROUP BY match_status`,
      [batchId]
    )

    const countsMap: Record<string, number> = {}
    for (const c of countsRes.rows) {
      countsMap[c.match_status] = Number(c.count)
    }

    res.json({
      items: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
      counts: {
        total: Object.values(countsMap).reduce((a, b) => a + b, 0),
        matchedExact: countsMap['MATCHED_EXACT'] || 0,
        matchedHigh: countsMap['MATCHED_HIGH_CONFIDENCE'] || 0,
        manualMatched: countsMap['MANUAL_MATCHED'] || 0,
        newProductCreated: countsMap['NEW_PRODUCT_CREATED'] || 0,
        needsReview: countsMap['MATCHED_REVIEW_REQUIRED'] || 0,
        unmatched: countsMap['UNMATCHED'] || 0,
        skipped: countsMap['SKIPPED'] || 0,
      },
    })
  } catch (err: any) {
    console.error('Error fetching import rows:', err)
    res.status(500).json({ error: 'فشل جلب صفوف الاستيراد' })
  }
})

/**
 * PUT /api/v1/admin/import/:batchId/rows/:rowId
 * Updates single row resolution (accept match, remap, change quantity, skip)
 */
router.put('/:batchId/rows/:rowId', async (req, res) => {
  try {
    const { batchId, rowId } = req.params
    const { action, productId, variantId, sourceQuantity, sourceUnitCost, sourceSellingPrice, notes } = req.body

    const existingRow = await query(
      `SELECT * FROM import_batch_rows WHERE id = $1 AND batch_id = $2`,
      [rowId, batchId]
    )

    if (existingRow.rows.length === 0) {
      return res.status(404).json({ error: 'الصف المطلوب غير موجود' })
    }

    let targetStatus = existingRow.rows[0].match_status
    let targetMethod = existingRow.rows[0].match_method
    let targetProductId = existingRow.rows[0].matched_product_id
    let targetVariantId = existingRow.rows[0].matched_variant_id
    let targetNotes = notes || existingRow.rows[0].match_notes

    if (action === 'accept') {
      targetStatus = 'MANUAL_MATCHED'
      targetMethod = 'MANUAL'
      targetNotes = 'تم تأكيد المطابقة يدوياً بواسطة المسؤول'
    } else if (action === 'skip') {
      targetStatus = 'SKIPPED'
      targetNotes = 'تم تخطي هذا الصنف واستثناؤه من الاستيراد'
    } else if (action === 'unskip') {
      targetStatus = targetProductId ? 'MANUAL_MATCHED' : 'UNMATCHED'
      targetNotes = 'تم إلغاء الاستثناء'
    } else if (action === 'remap') {
      if (!productId) {
        return res.status(400).json({ error: 'معرف المنتج مطلوب لإعادة الربط' })
      }

      let chosenVariantId = variantId
      if (!chosenVariantId) {
        const vRes = await query(
          `SELECT id FROM product_variants WHERE product_id = $1 AND (is_active = 1 OR is_active = TRUE) ORDER BY created_at ASC LIMIT 1`,
          [productId]
        )
        if (vRes.rows.length > 0) {
          chosenVariantId = vRes.rows[0].id
        }
      }

      targetProductId = productId
      targetVariantId = chosenVariantId
      targetStatus = 'MANUAL_MATCHED'
      targetMethod = 'MANUAL'
      targetNotes = 'تم ربط القطعة يدوياً مع منتج من الكتالوج'
    }

    await query(
      `UPDATE import_batch_rows 
       SET matched_product_id = $1,
           matched_variant_id = $2,
           match_status = $3,
           match_method = $4,
           match_notes = $5,
           source_quantity = COALESCE($6, source_quantity),
           source_unit_cost = COALESCE($7, source_unit_cost),
           source_selling_price = COALESCE($8, source_selling_price)
       WHERE id = $9`,
      [
        targetProductId,
        targetVariantId,
        targetStatus,
        targetMethod,
        targetNotes,
        sourceQuantity !== undefined ? Number(sourceQuantity) : null,
        sourceUnitCost !== undefined ? Number(sourceUnitCost) : null,
        sourceSellingPrice !== undefined ? Number(sourceSellingPrice) : null,
        rowId,
      ]
    )

    // Recalculate batch counts
    const countRes = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN match_status IN ('MATCHED_EXACT', 'MATCHED_HIGH_CONFIDENCE', 'MANUAL_MATCHED', 'NEW_PRODUCT_CREATED') THEN 1 ELSE 0 END) as matched,
        SUM(CASE WHEN match_status = 'UNMATCHED' THEN 1 ELSE 0 END) as unmatched,
        SUM(CASE WHEN match_status = 'MATCHED_REVIEW_REQUIRED' THEN 1 ELSE 0 END) as needs_review,
        SUM(CASE WHEN match_status = 'SKIPPED' THEN 1 ELSE 0 END) as skipped,
        SUM(source_quantity) as total_qty,
        SUM(source_unit_cost * source_quantity) as total_value
       FROM import_batch_rows 
       WHERE batch_id = $1`,
      [batchId]
    )

    const c = countRes.rows[0]
    const matchedCount = Number(c.matched || 0)
    const unmatchedCount = Number(c.unmatched || 0)
    const needsReview = Number(c.needs_review || 0)

    const newBatchStatus = (needsReview > 0 || unmatchedCount > 0) ? 'REVIEW_REQUIRED' : 'PREVIEW_READY'

    await query(
      `UPDATE import_batches 
       SET matched_rows = $1,
           unmatched_rows = $2,
           skipped_rows = $3,
           total_quantity = $4,
           total_purchase_value = $5,
           status = $6
       WHERE id = $7`,
      [matchedCount, unmatchedCount, Number(c.skipped || 0), Number(c.total_qty || 0), Number(c.total_value || 0), newBatchStatus, batchId]
    )

    res.json({ success: true, message: 'تم تحديث بيانات الصف بنجاح' })
  } catch (err: any) {
    console.error('Error updating import row:', err)
    res.status(500).json({ error: 'فشل تحديث بيانات الصف' })
  }
})

/**
 * POST /api/v1/admin/import/:batchId/bulk-action
 * Executes bulk resolution (accept high confidence matches, skip unmatched)
 */
router.post('/:batchId/bulk-action', async (req, res) => {
  try {
    const { batchId } = req.params
    const { action } = req.body

    if (action === 'accept_all_high_confidence') {
      await query(
        `UPDATE import_batch_rows 
         SET match_status = 'MANUAL_MATCHED', match_notes = 'تم قبول التطابق عالي الثقة بالجملة' 
         WHERE batch_id = $1 AND match_status IN ('MATCHED_HIGH_CONFIDENCE', 'MATCHED_REVIEW_REQUIRED') AND matched_product_id IS NOT NULL`,
        [batchId]
      )
    } else if (action === 'skip_all_unmatched') {
      await query(
        `UPDATE import_batch_rows 
         SET match_status = 'SKIPPED', match_notes = 'تم استثناء الصفوف غير المطابقة بالجملة' 
         WHERE batch_id = $1 AND match_status = 'UNMATCHED'`,
        [batchId]
      )
    } else if (action === 'auto_create_unmatched_and_accept_all') {
      // 1. Accept all rows that already have a match
      await query(
        `UPDATE import_batch_rows 
         SET match_status = 'MANUAL_MATCHED', match_notes = 'تم اعتماد التطابق المقترح' 
         WHERE batch_id = $1 AND matched_product_id IS NOT NULL AND match_status != 'SKIPPED'`,
        [batchId]
      )

      // 2. Fetch all unmatched rows for this batch
      const unmatchedRes = await query(
        `SELECT id, source_reference, source_product_name, source_brand, source_quantity, source_unit_cost, source_selling_price
         FROM import_batch_rows 
         WHERE batch_id = $1 AND (matched_product_id IS NULL OR match_status = 'UNMATCHED')`,
        [batchId]
      )

      if (unmatchedRes.rows.length > 0) {
        // Load categories and brands for smart keyword mapping
        const catRes = await query(`SELECT id, name_ar, slug FROM categories`)
        const brandRes = await query(`SELECT id, name, slug FROM brands`)
        const defaultCatId = catRes.rows[0]?.id || randomUUID()
        const defaultBrandId = brandRes.rows[0]?.id || randomUUID()

        // Helper to match category by keywords in product name
        const matchCategory = (name: string): string => {
          const lower = name.toLowerCase()
          if (/radiat|refroid|durite/i.test(lower)) return catRes.rows.find((c) => c.slug === 'radiateur')?.id || defaultCatId
          if (/phare|optique|projecteur/i.test(lower)) return catRes.rows.find((c) => c.slug === 'phare')?.id || defaultCatId
          if (/feu|arriere|stop|emestop/i.test(lower)) return catRes.rows.find((c) => c.slug === 'feu-arri-re')?.id || defaultCatId
          if (/glasse|verre|retro/i.test(lower)) return catRes.rows.find((c) => c.slug === 'verre-de-phare')?.id || defaultCatId
          if (/pare-choc|pchoc|bouclier/i.test(lower)) return catRes.rows.find((c) => c.slug === 'pare-chocs')?.id || defaultCatId
          if (/support|ferrure/i.test(lower)) return catRes.rows.find((c) => c.slug === 'support-pare-chocs')?.id || defaultCatId
          if (/poign|poignee/i.test(lower)) return catRes.rows.find((c) => c.slug === 'poign-e-de-porte')?.id || defaultCatId
          if (/capot|ailes/i.test(lower)) return catRes.rows.find((c) => c.slug === 'capot')?.id || defaultCatId
          if (/traverse/i.test(lower)) return catRes.rows.find((c) => c.slug === 'traverse')?.id || defaultCatId
          if (/ventilateur|moteur vent/i.test(lower)) return catRes.rows.find((c) => c.slug === 'ventilateur')?.id || defaultCatId
          if (/filtre.*huile/i.test(lower)) return catRes.rows.find((c) => c.slug === 'filtre-huile')?.id || defaultCatId
          if (/filtre/i.test(lower)) return catRes.rows.find((c) => c.slug === 'filtre-air')?.id || defaultCatId
          if (/plaquette|frein/i.test(lower)) return catRes.rows.find((c) => c.slug === 'plaquettes-de-frein')?.id || defaultCatId
          if (/disque/i.test(lower)) return catRes.rows.find((c) => c.slug === 'disques-de-frein')?.id || defaultCatId
          if (/amortisseur/i.test(lower)) return catRes.rows.find((c) => c.slug === 'amortisseurs')?.id || defaultCatId
          if (/batterie/i.test(lower)) return catRes.rows.find((c) => c.slug === 'batteries')?.id || defaultCatId
          if (/bougie/i.test(lower)) return catRes.rows.find((c) => c.slug === 'bougies')?.id || defaultCatId
          return defaultCatId
        }

        // Helper to match brand
        const matchBrand = (brandStr: string, nameStr: string): string => {
          const combined = `${brandStr} ${nameStr}`.toUpperCase()
          for (const b of brandRes.rows) {
            if (combined.includes(b.name.toUpperCase())) return b.id
          }
          return defaultBrandId
        }

        // Batch create products and variants
        for (const row of unmatchedRes.rows) {
          const productId = randomUUID()
          const variantId = randomUUID()
          const basePartNumber = (row.source_reference || `REF-${Date.now().toString().slice(-6)}`).trim().toUpperCase()
          const productName = (row.source_product_name || `قطعة غيار ${basePartNumber}`).trim()
          const sku = `SKU-${basePartNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 8)}-${randomUUID().slice(0, 6).toUpperCase()}`
          const categoryId = matchCategory(productName)
          const brandId = matchBrand(row.source_brand || '', productName)
          const unitCost = Number(row.source_unit_cost || 0)
          const sellingPrice = Number(row.source_selling_price || (unitCost > 0 ? Math.round(unitCost * 1.3) : 0))
          const stockQty = Number(row.source_quantity || 1)

          // Insert product
          await query(
            `INSERT INTO products 
             (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, description_ar, description_fr, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
            [
              productId,
              sku,
              basePartNumber,
              productName,
              productName,
              categoryId,
              brandId,
              `قطعة غيار أصلية مستوردة (${basePartNumber})`,
              productName,
            ]
          )

          // Insert variant
          await query(
            `INSERT INTO product_variants 
             (id, product_id, variant_sku, part_number, label_ar, label_fr, price, stock_quantity, stock_status, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
            [
              variantId,
              productId,
              `${sku}-V1`,
              basePartNumber,
              productName,
              productName,
              sellingPrice,
              stockQty,
              stockQty === 0 ? 'out_of_stock' : stockQty <= 5 ? 'limited_stock' : 'in_stock',
            ]
          )

          // Update import_batch_rows
          await query(
            `UPDATE import_batch_rows 
             SET matched_product_id = $1,
                 matched_variant_id = $2,
                 match_status = 'NEW_PRODUCT_CREATED',
                 match_method = 'MANUAL',
                 match_notes = 'تم إنشاء الصنف وإدراجه في الكتالوج آلياً'
             WHERE id = $3`,
            [productId, variantId, row.id]
          )
        }
      }
    }

    // Recalculate
    const countRes = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN match_status IN ('MATCHED_EXACT', 'MATCHED_HIGH_CONFIDENCE', 'MANUAL_MATCHED', 'NEW_PRODUCT_CREATED') THEN 1 ELSE 0 END) as matched,
        SUM(CASE WHEN match_status = 'UNMATCHED' THEN 1 ELSE 0 END) as unmatched,
        SUM(CASE WHEN match_status = 'MATCHED_REVIEW_REQUIRED' THEN 1 ELSE 0 END) as needs_review,
        SUM(CASE WHEN match_status = 'SKIPPED' THEN 1 ELSE 0 END) as skipped,
        SUM(source_quantity) as total_qty,
        SUM(source_unit_cost * source_quantity) as total_value
       FROM import_batch_rows 
       WHERE batch_id = $1`,
      [batchId]
    )

    const c = countRes.rows[0]
    const matchedCount = Number(c.matched || 0)
    const unmatchedCount = Number(c.unmatched || 0)
    const needsReview = Number(c.needs_review || 0)
    const newBatchStatus = (needsReview > 0 || unmatchedCount > 0) ? 'REVIEW_REQUIRED' : 'PREVIEW_READY'

    await query(
      `UPDATE import_batches 
       SET matched_rows = $1,
           unmatched_rows = $2,
           skipped_rows = $3,
           total_quantity = $4,
           total_purchase_value = $5,
           status = $6
       WHERE id = $7`,
      [matchedCount, unmatchedCount, Number(c.skipped || 0), Number(c.total_qty || 0), Number(c.total_value || 0), newBatchStatus, batchId]
    )

    res.json({ success: true, message: 'تم تطبيق الإجراء الجماعي بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'فشل تطبيق الإجراء الجماعي' })
  }
})

/**
 * POST /api/v1/admin/import/:batchId/create-product
 * Creates a brand new KAS product & variant directly from an unmatched row
 */
router.post('/:batchId/create-product', async (req, res) => {
  try {
    const { batchId } = req.params
    const { rowId, nameAr, nameFr, basePartNumber, sku, categoryId, brandId, price, stockQuantity } = req.body
    const adminName = req.adminUser?.name || 'مسؤول النظام'

    if (!nameAr || !basePartNumber || !categoryId || !brandId) {
      return res.status(400).json({ error: 'الاسم بالعربية، رقم القطعة، القسم، والعلامة التجارية مطلوبة' })
    }

    const productId = randomUUID()
    const variantId = randomUUID()
    const finalSku = sku || `SKU-IMP-${Date.now().toString().slice(-6)}`
    const finalPrice = Math.max(0, Number(price || 0))
    const initialStock = Math.max(0, Number(stockQuantity || 0))

    // 1. Insert product
    await query(
      `INSERT INTO products 
       (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, description_ar, description_fr, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
      [
        productId,
        finalSku,
        String(basePartNumber).trim().toUpperCase(),
        String(nameAr).trim(),
        nameFr ? String(nameFr).trim() : null,
        categoryId,
        brandId,
        `قطعة غيار أصلية مستوردة (${basePartNumber})`,
        nameFr || null,
      ]
    )

    // 2. Insert variant
    await query(
      `INSERT INTO product_variants 
       (id, product_id, variant_sku, part_number, label_ar, label_fr, price, stock_quantity, stock_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
      [
        variantId,
        productId,
        `${finalSku}-V1`,
        String(basePartNumber).trim().toUpperCase(),
        String(nameAr).trim(),
        nameFr ? String(nameFr).trim() : null,
        finalPrice,
        initialStock,
        initialStock === 0 ? 'out_of_stock' : initialStock <= 5 ? 'limited_stock' : 'in_stock',
      ]
    )

    // 3. Link row to the new product & variant
    if (rowId) {
      await query(
        `UPDATE import_batch_rows 
         SET matched_product_id = $1,
             matched_variant_id = $2,
             match_status = 'NEW_PRODUCT_CREATED',
             match_method = 'MANUAL',
             match_notes = 'تم إنشاء قطعة جديدة وإضافتها للكتالوج بنجاح'
         WHERE id = $3 AND batch_id = $4`,
        [productId, variantId, rowId, batchId]
      )
    }

    // 4. Log audit action
    try {
      const { logAuditAction } = await import('../../lib/audit.js')
      await logAuditAction({
        tableName: 'products',
        recordId: productId,
        actionType: 'CREATE',
        newData: { name: nameAr, basePartNumber, sku: finalSku, source: `Legacy Import ${batchId.slice(0, 8)}` },
        performedBy: adminName,
        ipAddress: req.ip || null,
      })
    } catch {}

    res.status(201).json({
      success: true,
      productId,
      variantId,
      message: 'تم إنشاء المنتج والمتغير في الكتالوج بنجاح وربطه بالصف',
    })
  } catch (err: any) {
    console.error('Error creating product from import row:', err)
    res.status(500).json({ error: `فشل إنشاء المنتج: ${err.message}` })
  }
})

/**
 * POST /api/v1/admin/import/:batchId/confirm
 * Executes atomic transactional import
 */
router.post('/:batchId/confirm', async (req, res) => {
  try {
    const { batchId } = req.params
    const adminName = req.adminUser?.name || 'مسؤول النظام'
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || null

    console.log(`[IMPORT] Admin (${adminName}) confirmed execution for batch #${batchId.slice(0, 8)}`)

    const result = await executeBatchImport(batchId, adminName, ipAddress)

    // Clean up memory buffer cache
    pdfBufferCache.delete(batchId)

    res.json({
      success: true,
      batch: result.batch,
      reconciliation: result.reconciliation,
      message: `تم تنفيذ الاستيراد بنجاح وتحديث حركة المخزون لـ ${result.reconciliation.totalImportedRows} صنف`,
    })
  } catch (err: any) {
    console.error('[IMPORT ERROR] Confirm failed:', err)
    res.status(500).json({ error: `فشل تنفيذ الاستيراد: ${err.message}` })
  }
})

/**
 * GET /api/v1/admin/import/:batchId/reconciliation
 * Retrieves reconciliation report
 */
router.get('/:batchId/reconciliation', async (req, res) => {
  try {
    const { batchId } = req.params
    const batchRes = await query(`SELECT * FROM import_batches WHERE id = $1`, [batchId])

    if (batchRes.rows.length === 0) {
      return res.status(404).json({ error: 'دفعة الاستيراد غير موجودة' })
    }

    const batch = batchRes.rows[0]
    if (!batch.reconciliation_json) {
      return res.status(400).json({ error: 'تقرير المطابقة غير متوفر (لم يتم تنفيذ الاستيراد بعد)' })
    }

    const reconciliation = JSON.parse(batch.reconciliation_json)
    res.json(reconciliation)
  } catch (err: any) {
    res.status(500).json({ error: 'فشل جلب تقرير المطابقة' })
  }
})

/**
 * POST /api/v1/admin/import/:batchId/rollback
 * Reversible, safe rollback of an import batch
 */
router.post('/:batchId/rollback', async (req, res) => {
  try {
    const { batchId } = req.params
    const adminName = req.adminUser?.name || 'مسؤول النظام'
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || null

    console.log(`[IMPORT] Admin (${adminName}) requested rollback for batch #${batchId.slice(0, 8)}`)

    const result = await rollbackBatchImport(batchId, adminName, ipAddress)

    res.json({
      success: true,
      reversedMovements: result.reversedMovements,
      restoredStockUnits: result.restoredStockUnits,
      message: `تم التراجع عن الاستيراد بنجاح واستعادة ${result.restoredStockUnits} قطعة مخزون`,
    })
  } catch (err: any) {
    console.error('[IMPORT ERROR] Rollback failed:', err)
    res.status(500).json({ error: `فشل التراجع عن الاستيراد: ${err.message}` })
  }
})

/**
 * GET /api/v1/admin/import/history
 * List of all import batches
 */
router.get('/history/all', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        id, filename, file_hash AS "fileHash", import_type AS "importType",
        status, total_rows AS "totalRows", matched_rows AS "matchedRows",
        unmatched_rows AS "unmatchedRows", skipped_rows AS "skippedRows",
        imported_rows AS "importedRows", warnings_count AS "warningsCount",
        total_quantity AS "totalQuantity", total_purchase_value AS "totalPurchaseValue",
        created_by AS "createdBy", created_at AS "createdAt", completed_at AS "completedAt",
        rolled_back_at AS "rolledBackAt", rolled_back_by AS "rolledBackBy"
       FROM import_batches
       ORDER BY created_at DESC
       LIMIT 100`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('Error fetching import history:', err)
    res.status(500).json({ error: 'فشل جلب سجل الاستيراد' })
  }
})

export default router
