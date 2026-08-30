import { query } from '../db/db.js'

async function testGetRows() {
  const batchRes = await query(`SELECT id FROM import_batches WHERE status = 'REVIEW_REQUIRED' LIMIT 1`)
  if (batchRes.rows.length === 0) {
    console.log('No review required batches found')
    return
  }
  const batchId = batchRes.rows[0].id
  console.log('Testing batchId:', batchId)

  const pageLimit = 50
  const offset = 0

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

  const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
  const countRes = await query(countSql, params)
  console.log('Count res:', countRes.rows)

  sql += ` ORDER BY r.row_index ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(pageLimit, offset)

  const result = await query(sql, params)
  console.log('Result count:', result.rows.length, 'First item:', result.rows[0])

  const countsRes = await query(
    `SELECT match_status, COUNT(*) as count 
     FROM import_batch_rows 
     WHERE batch_id = $1 
     GROUP BY match_status`,
    [batchId]
  )
  console.log('Status counts in DB:', countsRes.rows)
}

testGetRows().catch(console.error)
