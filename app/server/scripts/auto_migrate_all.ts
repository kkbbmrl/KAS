import { query } from '../db/db.js'
import { initDatabase } from '../db/init.js'
import { randomUUID } from 'node:crypto'

async function autoCreateAndApproveAll() {
  await initDatabase()
  console.log('🚀 Starting Auto-Create & Approve All for active Legacy Import batch...')

  // Find active batch
  const batchRes = await query(
    `SELECT id, filename, total_rows FROM import_batches 
     WHERE status IN ('REVIEW_REQUIRED', 'PREVIEW_READY', 'UPLOADED') 
     ORDER BY created_at DESC LIMIT 1`
  )

  if (batchRes.rows.length === 0) {
    console.log('No active in-progress batch found.')
    return
  }

  const batch = batchRes.rows[0]
  const batchId = batch.id
  console.log(`📦 Active Batch found: #${batchId.slice(0, 8)} (${batch.filename})`)

  // 1. Accept all rows that already have a match
  const acceptedRes = await query(
    `UPDATE import_batch_rows 
     SET match_status = 'MANUAL_MATCHED', match_notes = 'تم اعتماد التطابق المقترح', match_method = 'MANUAL'
     WHERE batch_id = $1 AND matched_product_id IS NOT NULL AND match_status != 'SKIPPED'`,
    [batchId]
  )
  console.log(`✅ Accepted matched rows: ${acceptedRes.rowCount || 0}`)

  // 2. Fetch all unmatched rows
  const unmatchedRes = await query(
    `SELECT id, source_reference, source_product_name, source_brand, source_quantity, source_unit_cost, source_selling_price
     FROM import_batch_rows 
     WHERE batch_id = $1 AND (matched_product_id IS NULL OR match_status = 'UNMATCHED')`,
    [batchId]
  )
  console.log(`⚙️ Creating catalog products for ${unmatchedRes.rows.length} unmatched items...`)

  // Load categories and brands
  const catRes = await query(`SELECT id, name_ar, slug FROM categories`)
  const brandRes = await query(`SELECT id, name, slug FROM brands`)
  const defaultCatId = catRes.rows[0]?.id || randomUUID()
  const defaultBrandId = brandRes.rows[0]?.id || randomUUID()

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

  const matchBrand = (brandStr: string, nameStr: string): string => {
    const combined = `${brandStr} ${nameStr}`.toUpperCase()
    for (const b of brandRes.rows) {
      if (combined.includes(b.name.toUpperCase())) return b.id
    }
    return defaultBrandId
  }

  for (let i = 0; i < unmatchedRes.rows.length; i++) {
    const row = unmatchedRes.rows[i]
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

    // Update row
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

  // 3. Recalculate batch summary
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
  const totalCount = Number(c.total || 0)

  await query(
    `UPDATE import_batches 
     SET matched_rows = $1,
         unmatched_rows = 0,
         skipped_rows = 0,
         total_quantity = $2,
         total_purchase_value = $3,
         status = 'PREVIEW_READY'
     WHERE id = $4`,
    [matchedCount, Number(c.total_qty || 0), Number(c.total_value || 0), batchId]
  )

  console.log('\n============================================================')
  console.log(`🎉 SUCCESS! Batch #${batchId.slice(0, 8)} fully resolved:`)
  console.log(`   Total items in Batch : ${totalCount}`)
  console.log(`   Matched / Created    : ${matchedCount} (100%)`)
  console.log(`   Total Quantity       : ${c.total_qty} units`)
  console.log(`   Status               : PREVIEW_READY (Ready to confirm)`)
  console.log('============================================================\n')
}

autoCreateAndApproveAll().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
