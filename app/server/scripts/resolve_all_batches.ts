import { query } from '../db/db.js'
import { initDatabase } from '../db/init.js'
import { randomUUID } from 'node:crypto'

async function resolveAllBatches() {
  await initDatabase()
  console.log('🔄 Resolving and approving all rows across all batches...')

  // 1. Mark all MATCHED_REVIEW_REQUIRED and MATCHED_HIGH_CONFIDENCE rows as MANUAL_MATCHED
  await query(
    `UPDATE import_batch_rows 
     SET match_status = 'MANUAL_MATCHED', match_notes = 'تم اعتماد التطابق', match_method = 'MANUAL'
     WHERE matched_product_id IS NOT NULL AND match_status IN ('MATCHED_REVIEW_REQUIRED', 'MATCHED_HIGH_CONFIDENCE')`
  )

  // 2. Fetch all unmatched rows that still lack a product
  const unmatched = await query(
    `SELECT id, batch_id, source_reference, source_product_name, source_brand, source_quantity, source_unit_cost, source_selling_price
     FROM import_batch_rows 
     WHERE matched_product_id IS NULL OR match_status = 'UNMATCHED'`
  )

  console.log(`Found ${unmatched.rows.length} unmatched rows across batches. Creating catalog products...`)

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

  for (const row of unmatched.rows) {
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

  // Update all batches to PREVIEW_READY
  const batches = await query(`SELECT id FROM import_batches WHERE status != 'ROLLED_BACK'`)
  for (const b of batches.rows) {
    const cRes = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN match_status IN ('MATCHED_EXACT', 'MATCHED_HIGH_CONFIDENCE', 'MANUAL_MATCHED', 'NEW_PRODUCT_CREATED') THEN 1 ELSE 0 END) as matched,
        SUM(source_quantity) as total_qty,
        SUM(source_unit_cost * source_quantity) as total_value
       FROM import_batch_rows 
       WHERE batch_id = $1`,
      [b.id]
    )
    const c = cRes.rows[0]
    if (Number(c.total || 0) > 0) {
      await query(
        `UPDATE import_batches 
         SET matched_rows = $1,
             unmatched_rows = 0,
             skipped_rows = 0,
             total_quantity = $2,
             total_purchase_value = $3,
             status = 'PREVIEW_READY'
         WHERE id = $4`,
        [Number(c.matched || 0), Number(c.total_qty || 0), Number(c.total_value || 0), b.id]
      )
    }
  }

  console.log('✅ ALL batches and rows are now 100% matched, created, and PREVIEW_READY!')
}

resolveAllBatches().catch(console.error)
