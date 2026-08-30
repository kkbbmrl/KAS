import { query, withTransaction } from '../db/db.js'
import { initDatabase } from '../db/init.js'
import {
  extractDataFromPdf,
  validatePdfMagicBytes,
  computeFileHash,
  parseLocalizedNumber,
  cleanSpacedText,
  checkFileDuplicate,
  checkInvoiceDuplicate,
} from '../lib/pdfExtractor.js'
import {
  loadCatalogSnapshot,
  matchItemAgainstCatalog,
  normalizePartNumber,
  calculateSimilarity,
} from '../lib/productMatcher.js'
import {
  executeBatchImport,
  rollbackBatchImport,
} from '../lib/importService.js'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

async function runLegacyImportTestSuite() {
  console.log('🧪 Starting Legacy Inventory & Purchase PDF Import Test Suite...')
  await initDatabase()

  let passed = 0
  let failed = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      failed++
    }
  }

  // -------------------------------------------------------------
  // TEST 1: PDF Magic Bytes & Security Validation
  // -------------------------------------------------------------
  console.log('\n--- Test 1: PDF Magic Bytes & Security Validation ---')
  const validPdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n')
  const invalidHeader = Buffer.from('GIF89a\x01\x00\x01\x00')
  assert(validatePdfMagicBytes(validPdfHeader) === true, 'Recognizes valid %PDF- header')
  assert(validatePdfMagicBytes(invalidHeader) === false, 'Rejects invalid magic bytes (e.g. GIF)')
  assert(validatePdfMagicBytes(Buffer.from('')) === false, 'Rejects empty buffer')

  // -------------------------------------------------------------
  // TEST 2: Number Parsing & Algerian/French Currencies
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Localized Numeric Formats ---')
  assert(parseLocalizedNumber('5 500,00') === 5500.0, 'Parses space-separated thousands with comma: "5 500,00" -> 5500')
  assert(parseLocalizedNumber('12 000,50 DZD') === 12000.5, 'Parses Algerian currency string with DZD: "12 000,50 DZD" -> 12000.5')
  assert(parseLocalizedNumber('1.250,50') === 1250.5, 'Parses dot thousand comma decimal: "1.250,50" -> 1250.5')
  assert(parseLocalizedNumber('1250.50') === 1250.5, 'Parses standard decimal: "1250.50" -> 1250.5')
  assert(parseLocalizedNumber('0,00') === 0, 'Parses zero: "0,00" -> 0')
  assert(parseLocalizedNumber(undefined) === 0, 'Safely handles undefined -> 0')
  assert(parseLocalizedNumber('abc') === 0, 'Safely handles NaN strings -> 0')

  // -------------------------------------------------------------
  // TEST 3: Text Cleaning & Spaced Letter Normalization
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Legacy Text Spacing Normalization ---')
  const spacedText = 'FAU SSE C ALEN D R E 208/2015'
  const cleaned = cleanSpacedText(spacedText)
  assert(cleaned.includes('FAUSSE') || cleaned.includes('CALENDRE'), `Cleaned spaced characters: "${cleaned}"`)

  // -------------------------------------------------------------
  // TEST 4: Part Number Normalization
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Part Number Normalization ---')
  assert(normalizePartNumber('P1-20815-W 1') === 'P120815W1', 'Normalizes "P1-20815-W 1" -> "P120815W1"')
  assert(normalizePartNumber('KR - 287') === 'KR287', 'Normalizes "KR - 287" -> "KR287"')
  assert(normalizePartNumber('SYPG 032G -001BL') === 'SYPG032G001BL', 'Normalizes "SYPG 032G -001BL" -> "SYPG032G001BL"')

  // -------------------------------------------------------------
  // TEST 5: Extraction on Real 88-Page Catalog PDF
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Real Multi-Page PDF Extraction (Etat_Article_tout (1).PDF) ---')
  const samplePath = path.resolve(process.cwd(), '..', 'Etat_Article_tout (1).PDF')
  const altPath = path.resolve(process.cwd(), 'Etat_Article_tout (1).PDF')
  const pdfPath = fs.existsSync(samplePath) ? samplePath : fs.existsSync(altPath) ? altPath : null

  if (pdfPath) {
    const pdfBuf = fs.readFileSync(pdfPath)
    const extraction = await extractDataFromPdf(pdfBuf, 'opening_stock')
    assert(extraction.pageCount === 88, `Extracted all 88 pages (got ${extraction.pageCount})`)
    assert(extraction.totalRows >= 2200, `Extracted over 2,200 rows (got ${extraction.totalRows})`)
    assert(extraction.fileHash.length === 64, `Generated valid SHA-256 hash: ${extraction.fileHash.slice(0, 16)}...`)
    assert(extraction.rows[0].reference.length > 0, `First row extracted reference: "${extraction.rows[0].reference}"`)
    assert(extraction.rows[0].unitCost > 0, `First row extracted purchase price: ${extraction.rows[0].unitCost} DZD`)
  } else {
    console.warn('⚠️ Sample PDF not found in standard paths. Skipping file read test.')
  }

  // -------------------------------------------------------------
  // TEST 6: Conservative Product Matching Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Conservative Product Matching ---')
  const catalog = await loadCatalogSnapshot()
  assert(catalog.length > 0, `Loaded ${catalog.length} catalog products`)

  if (catalog.length > 0) {
    const sampleProd = catalog[0]
    // 6a. Exact SKU Match
    const matchSku = matchItemAgainstCatalog(sampleProd.sku, '', '', catalog)
    assert(matchSku.matchStatus === 'MATCHED_EXACT', `Exact SKU match for ${sampleProd.sku}`)
    assert(matchSku.matchConfidence === 1.0, 'SKU match confidence is 1.0')

    // 6b. Exact Part Number Match
    const matchPn = matchItemAgainstCatalog(sampleProd.basePartNumber, '', '', catalog)
    assert(matchPn.matchStatus === 'MATCHED_EXACT', `Exact Part Number match for ${sampleProd.basePartNumber}`)

    // 6c. Normalized Part Number Match (with hyphens & spaces)
    const alteredPn = sampleProd.basePartNumber.split('').join(' ')
    const matchNorm = matchItemAgainstCatalog(alteredPn, '', '', catalog)
    assert(
      matchNorm.matchStatus === 'MATCHED_EXACT' || matchNorm.matchStatus === 'MATCHED_HIGH_CONFIDENCE',
      `Normalized Part Number match for "${alteredPn}"`
    )

    // 6d. Unmatched Row
    const matchUnmatched = matchItemAgainstCatalog('NONEXISTENT-XYZ-999999', 'Fake product name xyz', '', catalog)
    assert(matchUnmatched.matchStatus === 'UNMATCHED', 'Unmatched item correctly flagged as UNMATCHED (no silent guessing)')
    assert(matchUnmatched.matchConfidence === 0, 'Unmatched confidence is 0')
  }

  // -------------------------------------------------------------
  // TEST 7: Duplicate Document & Duplicate Invoice Protection
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Duplicate Protection ---')
  const testBatchId = randomUUID()
  const testHash = 'test_hash_' + Date.now()
  await query(
    `INSERT INTO import_batches (id, filename, file_hash, import_type, status, created_by)
     VALUES ($1, 'test.pdf', $2, 'opening_stock', 'COMPLETED', 'TEST')`,
    [testBatchId, testHash]
  )

  const dupFileCheck = await checkFileDuplicate(testHash)
  assert(dupFileCheck.isDuplicate === true, 'Detects identical SHA-256 duplicate file')
  assert(dupFileCheck.batchId === testBatchId, 'Returns previous batch ID on duplicate')

  // -------------------------------------------------------------
  // TEST 8: Atomic Transactional Import & Ledger Integrity
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Transactional Import & Double-Entry Ledger ---')
  // 8a. Find or create a test product
  let testVariantId = ''
  let testProductId = ''
  const testVarRes = await query(`SELECT id, product_id, stock_quantity FROM product_variants LIMIT 1`)
  if (testVarRes.rows.length > 0) {
    testVariantId = testVarRes.rows[0].id
    testProductId = testVarRes.rows[0].product_id
  }

  if (testVariantId) {
    const initialStock = Number(testVarRes.rows[0].stock_quantity || 0)
    const importBatchId = randomUUID()

    await query(
      `INSERT INTO import_batches (id, filename, file_hash, import_type, status, created_by)
       VALUES ($1, 'batch_test.pdf', $2, 'purchase_history', 'READY_TO_IMPORT', 'QA_TEST')`,
      [importBatchId, 'hash_' + Date.now()]
    )

    const rowId = randomUUID()
    const intakeQty = 15
    const purchaseUnitCost = 4500

    await query(
      `INSERT INTO import_batch_rows 
       (id, batch_id, row_index, page_number, source_raw_text, source_reference, source_product_name, source_supplier,
        source_invoice_number, source_invoice_date, source_quantity, source_unit_cost, source_total_cost,
        matched_product_id, matched_variant_id, match_status, import_status)
       VALUES ($1, $2, 1, 1, 'RAW LINE', 'REF-001', 'Test Brake Pad', 'Test Supplier SPA', 'INV-2026-99', '2026-08-20', $3, $4, $5, $6, $7, 'MATCHED_EXACT', 'PENDING')`,
      [rowId, importBatchId, intakeQty, purchaseUnitCost, intakeQty * purchaseUnitCost, testProductId, testVariantId]
    )

    // Execute import
    const importResult = await executeBatchImport(importBatchId, 'QA_ENGINEER')
    assert(importResult.success === true, 'Import execution succeeded')
    assert(importResult.batch.status === 'COMPLETED', 'Batch status updated to COMPLETED')

    // Verify stock increased correctly
    const updatedVarRes = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [testVariantId])
    const newStock = Number(updatedVarRes.rows[0].stock_quantity || 0)
    assert(newStock === initialStock + intakeQty, `Stock increased correctly from ${initialStock} to ${newStock} (+${intakeQty})`)

    // Verify double-entry ledger entry in inventory_transactions
    const txRes = await query(
      `SELECT * FROM inventory_transactions WHERE source_import_id = $1`,
      [importBatchId]
    )
    assert(txRes.rows.length === 1, 'Inventory transaction ledger entry created')
    assert(txRes.rows[0].delta_type === 'purchase_order_in', 'Ledger movement type is purchase_order_in')
    assert(Number(txRes.rows[0].quantity_delta) === intakeQty, `Quantity delta in ledger is +${intakeQty}`)
    assert(Number(txRes.rows[0].quantity_before) === initialStock, `Quantity before is ${initialStock}`)
    assert(Number(txRes.rows[0].quantity_after) === newStock, `Quantity after is ${newStock}`)

    // Verify purchase_history entry
    const purchaseRes = await query(`SELECT * FROM purchase_history WHERE source_import_id = $1`, [importBatchId])
    assert(purchaseRes.rows.length === 1, 'Purchase record created in purchase_history table')
    assert(purchaseRes.rows[0].invoice_number === 'INV-2026-99', 'Preserved invoice number INV-2026-99')
    assert(Number(purchaseRes.rows[0].unit_cost) === purchaseUnitCost, `Preserved purchase unit cost ${purchaseUnitCost} DZD`)

    // Verify reconciliation report
    assert(importResult.reconciliation.status === 'PERFECT_MATCH', 'Reconciliation report status is PERFECT_MATCH')
    assert(importResult.reconciliation.totalQuantityVariance === 0, 'Reconciliation variance is 0')

    // -------------------------------------------------------------
    // TEST 9: Reversible Rollback & Idempotency
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Safe Reversible Rollback ---')
    const rollbackResult = await rollbackBatchImport(importBatchId, 'QA_ENGINEER')
    assert(rollbackResult.success === true, 'Rollback executed successfully')
    assert(rollbackResult.restoredStockUnits === intakeQty, `Restored ${rollbackResult.restoredStockUnits} stock units`)

    // Verify stock is restored to pre-import state
    const revertedVarRes = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [testVariantId])
    const revertedStock = Number(revertedVarRes.rows[0].stock_quantity || 0)
    assert(revertedStock === initialStock, `Stock reverted exactly to pre-import value (${initialStock})`)

    // Verify batch status is ROLLED_BACK
    const finalBatchRes = await query(`SELECT status, rolled_back_by FROM import_batches WHERE id = $1`, [importBatchId])
    assert(finalBatchRes.rows[0].status === 'ROLLED_BACK', 'Batch status is ROLLED_BACK')
    assert(finalBatchRes.rows[0].rolled_back_by === 'QA_ENGINEER', 'Recorded rollback actor')

    // Verify repeated rollback is rejected
    let secondRollbackFailed = false
    try {
      await rollbackBatchImport(importBatchId, 'QA_ENGINEER')
    } catch (err: any) {
      secondRollbackFailed = true
    }
    assert(secondRollbackFailed === true, 'Repeated rollback attempt is safely rejected (Idempotency protected)')
  }

  // -------------------------------------------------------------
  // TEST RESULTS SUMMARY
  // -------------------------------------------------------------
  console.log('\n============================================================')
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runLegacyImportTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
