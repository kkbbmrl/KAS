import { randomUUID } from 'node:crypto'
import { query, withTransaction } from '../db/db.js'

export interface ReconciliationReport {
  batchId: string
  importType: string
  filename: string
  totalSourceRows: number
  totalImportedRows: number
  totalSkippedRows: number
  totalSourceQuantity: number
  totalImportedQuantity: number
  totalQuantityVariance: number
  totalPurchaseValuation: number
  status: 'PERFECT_MATCH' | 'DISCREPANCY_DETECTED'
  items: Array<{
    rowIndex: number
    productName: string
    partNumber: string
    sourceQuantity: number
    importedQuantity: number
    stockBefore: number
    stockAfter: number
    unitCost: number
    totalCost: number
    variance: number
    status: 'MATCH' | 'DISCREPANCY' | 'SKIPPED'
  }>
}

/**
 * Executes atomic transactional import of a reviewed batch
 */
export async function executeBatchImport(
  batchId: string,
  performedBy: string = 'SYSTEM',
  ipAddress: string | null = null
): Promise<{ success: boolean; batch: any; reconciliation: ReconciliationReport }> {
  return await withTransaction(async () => {
    // 1. Fetch and lock batch
    const batchRes = await query(`SELECT * FROM import_batches WHERE id = $1`, [batchId])
    if (batchRes.rows.length === 0) {
      throw new Error('دفعة الاستيراد غير موجودة')
    }

    const batch = batchRes.rows[0]
    if (batch.status === 'COMPLETED') {
      throw new Error('تم تنفيذ هذا الاستيراد مسبقاً بنجاح')
    }
    if (batch.status === 'ROLLED_BACK') {
      throw new Error('تم التراجع عن هذه الدفعة سابقاً')
    }

    // Update status to IMPORTING
    await query(`UPDATE import_batches SET status = 'IMPORTING' WHERE id = $1`, [batchId])

    // 2. Fetch all resolved rows for this batch
    const rowsRes = await query(
      `SELECT * FROM import_batch_rows WHERE batch_id = $1 ORDER BY row_index ASC`,
      [batchId]
    )

    const rows = rowsRes.rows
    let importedCount = 0
    let skippedCount = 0
    let totalImportedQty = 0
    let totalSourceQty = 0
    let totalValuation = 0

    const reconciliationItems: ReconciliationReport['items'] = []

    for (const row of rows) {
      const sourceQty = Number(row.source_quantity || 1)
      totalSourceQty += sourceQty

      // If row was explicitly skipped or is unmatched
      if (row.match_status === 'SKIPPED' || row.import_status === 'SKIPPED') {
        skippedCount++
        reconciliationItems.push({
          rowIndex: row.row_index,
          productName: row.source_product_name || 'N/A',
          partNumber: row.source_reference || 'N/A',
          sourceQuantity: sourceQty,
          importedQuantity: 0,
          stockBefore: 0,
          stockAfter: 0,
          unitCost: Number(row.source_unit_cost || 0),
          totalCost: 0,
          variance: sourceQty,
          status: 'SKIPPED',
        })
        continue
      }

      if (!row.matched_variant_id || !row.matched_product_id) {
        skippedCount++
        await query(
          `UPDATE import_batch_rows SET import_status = 'SKIPPED', error_message = 'تم تخطي الصف لعدم مطابقته مع أي منتج في المتجر' WHERE id = $1`,
          [row.id]
        )
        reconciliationItems.push({
          rowIndex: row.row_index,
          productName: row.source_product_name || 'N/A',
          partNumber: row.source_reference || 'N/A',
          sourceQuantity: sourceQty,
          importedQuantity: 0,
          stockBefore: 0,
          stockAfter: 0,
          unitCost: Number(row.source_unit_cost || 0),
          totalCost: 0,
          variance: sourceQty,
          status: 'SKIPPED',
        })
        continue
      }

      // 3. Fetch variant current stock
      const varRes = await query(
        `SELECT id, product_id, stock_quantity, part_number, label_ar 
         FROM product_variants 
         WHERE id = $1`,
        [row.matched_variant_id]
      )

      if (varRes.rows.length === 0) {
        skippedCount++
        await query(
          `UPDATE import_batch_rows SET import_status = 'ERROR', error_message = 'متغير المنتج المرتبط لم يعد موجوداً' WHERE id = $1`,
          [row.id]
        )
        continue
      }

      const variant = varRes.rows[0]
      const curStock = Number(variant.stock_quantity || 0)
      const qtyDelta = sourceQty
      const newStock = Math.max(0, curStock + qtyDelta)
      const newStatus = newStock === 0 ? 'out_of_stock' : newStock <= 5 ? 'limited_stock' : 'in_stock'

      // 4. Update Product Variant Stock
      await query(
        `UPDATE product_variants 
         SET stock_quantity = $1, stock_status = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newStock, newStatus, variant.id]
      )

      // 5. Insert Inventory Transaction (Audit Ledger)
      const deltaType = batch.import_type === 'purchase_history' ? 'purchase_order_in' : 'initial_intake'
      const reason =
        batch.import_type === 'purchase_history'
          ? `استيراد فاتورة مشتريات (دفعة #${batchId.slice(0, 8)} - ${row.source_invoice_number || 'بدون رقم'})`
          : `ترحيل رصيد المخزون الافتتاحي (دفعة #${batchId.slice(0, 8)} - صف ${row.row_index})`

      const txId = randomUUID()
      await query(
        `INSERT INTO inventory_transactions 
         (id, variant_id, delta_type, quantity_delta, quantity_before, quantity_after, reason, source_import_id, source_row_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [txId, variant.id, deltaType, qtyDelta, curStock, newStock, reason, batchId, row.id, performedBy]
      )

      // 6. If Purchase History, insert into purchase_history table
      const unitCost = Number(row.source_unit_cost || 0)
      const totalCost = Number(row.source_total_cost || unitCost * qtyDelta)

      if (batch.import_type === 'purchase_history' || unitCost > 0) {
        await query(
          `INSERT INTO purchase_history 
           (id, invoice_number, invoice_date, supplier_name, product_id, variant_id, quantity, unit_cost, total_cost, currency, source_import_id, source_row_id, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DZD', $10, $11, $12)`,
          [
            randomUUID(),
            row.source_invoice_number || null,
            row.source_invoice_date || null,
            row.source_supplier || null,
            row.matched_product_id,
            variant.id,
            qtyDelta,
            unitCost,
            totalCost,
            batchId,
            row.id,
            performedBy,
          ]
        )
      }

      // 7. Update row status
      await query(`UPDATE import_batch_rows SET import_status = 'IMPORTED' WHERE id = $1`, [row.id])

      importedCount++
      totalImportedQty += qtyDelta
      totalValuation += totalCost

      reconciliationItems.push({
        rowIndex: row.row_index,
        productName: row.source_product_name || variant.label_ar,
        partNumber: row.source_reference || variant.part_number,
        sourceQuantity: sourceQty,
        importedQuantity: qtyDelta,
        stockBefore: curStock,
        stockAfter: newStock,
        unitCost,
        totalCost,
        variance: 0,
        status: 'MATCH',
      })
    }

    // 8. Generate Reconciliation Report
    const variance = totalSourceQty - totalImportedQty
    const reconciliation: ReconciliationReport = {
      batchId,
      importType: batch.import_type,
      filename: batch.filename,
      totalSourceRows: rows.length,
      totalImportedRows: importedCount,
      totalSkippedRows: skippedCount,
      totalSourceQuantity: totalSourceQty,
      totalImportedQuantity: totalImportedQty,
      totalQuantityVariance: variance,
      totalPurchaseValuation: Math.round(totalValuation * 100) / 100,
      status: variance === 0 ? 'PERFECT_MATCH' : 'DISCREPANCY_DETECTED',
      items: reconciliationItems,
    }

    // 9. Update Batch Status to COMPLETED
    await query(
      `UPDATE import_batches 
       SET status = 'COMPLETED',
           imported_rows = $1,
           skipped_rows = $2,
           total_quantity = $3,
           total_purchase_value = $4,
           reconciliation_json = $5,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        importedCount,
        skippedCount,
        totalImportedQty,
        Math.round(totalValuation * 100) / 100,
        JSON.stringify(reconciliation),
        batchId,
      ]
    )

    // 10. Record Audit Action
    try {
      const { logAuditAction } = await import('./audit.js')
      await logAuditAction({
        tableName: 'import_batches',
        recordId: batchId,
        actionType: 'IMPORT_EXECUTE',
        newData: {
          filename: batch.filename,
          importType: batch.import_type,
          importedRows: importedCount,
          skippedRows: skippedCount,
          totalQty: totalImportedQty,
          totalValue: Math.round(totalValuation * 100) / 100,
        },
        performedBy,
        ipAddress,
      })
    } catch {}

    const updatedBatchRes = await query(`SELECT * FROM import_batches WHERE id = $1`, [batchId])
    return {
      success: true,
      batch: updatedBatchRes.rows[0],
      reconciliation,
    }
  })
}

/**
 * Safe, Reversible Rollback of an Import Batch
 */
export async function rollbackBatchImport(
  batchId: string,
  performedBy: string = 'SYSTEM',
  ipAddress: string | null = null
): Promise<{ success: boolean; reversedMovements: number; restoredStockUnits: number }> {
  return await withTransaction(async () => {
    // 1. Fetch batch
    const batchRes = await query(`SELECT * FROM import_batches WHERE id = $1`, [batchId])
    if (batchRes.rows.length === 0) {
      throw new Error('دفعة الاستيراد غير موجودة')
    }

    const batch = batchRes.rows[0]
    if (batch.status === 'ROLLED_BACK') {
      throw new Error('تم التراجع عن هذه الدفعة مسبقاً. لا يمكن تكرار عملية التراجع.')
    }
    if (batch.status !== 'COMPLETED' && batch.status !== 'PARTIALLY_COMPLETED') {
      throw new Error(`لا يمكن التراجع عن دفعة في الحالة (${batch.status})`)
    }

    // 2. Fetch all inventory transactions created by this batch
    const txRes = await query(
      `SELECT id, variant_id, quantity_delta 
       FROM inventory_transactions 
       WHERE source_import_id = $1`,
      [batchId]
    )

    let reversedCount = 0
    let restoredStockUnits = 0

    for (const tx of txRes.rows) {
      const varRes = await query(
        `SELECT id, stock_quantity FROM product_variants WHERE id = $1`,
        [tx.variant_id]
      )

      if (varRes.rows.length > 0) {
        const curStock = Number(varRes.rows[0].stock_quantity || 0)
        const qtyToSubtract = Number(tx.quantity_delta || 0)
        const revertedStock = Math.max(0, curStock - qtyToSubtract)
        const newStatus = revertedStock === 0 ? 'out_of_stock' : revertedStock <= 5 ? 'limited_stock' : 'in_stock'

        // Revert stock
        await query(
          `UPDATE product_variants 
           SET stock_quantity = $1, stock_status = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [revertedStock, newStatus, tx.variant_id]
        )

        // Insert compensating rollback ledger entry
        await query(
          `INSERT INTO inventory_transactions 
           (id, variant_id, delta_type, quantity_delta, quantity_before, quantity_after, reason, source_import_id, created_by)
           VALUES ($1, $2, 'manual_correction_shrinkage', $3, $4, $5, $6, $7, $8)`,
          [
            randomUUID(),
            tx.variant_id,
            -qtyToSubtract,
            curStock,
            revertedStock,
            `تراجع تلقائي عن دفعة الاستيراد #${batchId.slice(0, 8)} (${batch.filename})`,
            batchId,
            performedBy,
          ]
        )

        reversedCount++
        restoredStockUnits += qtyToSubtract
      }
    }

    // 3. Mark rows as ROLLED_BACK
    await query(
      `UPDATE import_batch_rows SET import_status = 'ROLLED_BACK' WHERE batch_id = $1`,
      [batchId]
    )

    // 4. Update batch status to ROLLED_BACK
    await query(
      `UPDATE import_batches 
       SET status = 'ROLLED_BACK',
           rolled_back_at = CURRENT_TIMESTAMP,
           rolled_back_by = $1
       WHERE id = $2`,
      [performedBy, batchId]
    )

    // 5. Log audit action
    try {
      const { logAuditAction } = await import('./audit.js')
      await logAuditAction({
        tableName: 'import_batches',
        recordId: batchId,
        actionType: 'IMPORT_ROLLBACK',
        newData: {
          filename: batch.filename,
          reversedMovements: reversedCount,
          restoredStockUnits,
        },
        performedBy,
        ipAddress,
      })
    } catch {}

    return {
      success: true,
      reversedMovements: reversedCount,
      restoredStockUnits,
    }
  })
}
