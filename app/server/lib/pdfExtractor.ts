import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { query } from '../db/db.js'

// Safe import for pdf-parse in ESM
const require = createRequire(import.meta.url)
let pdfLib: any = null
try {
  pdfLib = require('pdf-parse')
} catch (err: any) {
  console.warn('pdf-parse module load notice:', err.message)
}

export interface ExtractedRow {
  rowIndex: number
  pageNumber: number
  rawText: string
  reference: string
  productName: string
  brand: string
  supplier?: string
  invoiceNumber?: string
  invoiceDate?: string
  quantity: number
  unitCost: number
  sellingPrice: number
  totalCost: number
  wholesalePrice?: number
  semiWholesalePrice?: number
  warnings: string[]
}

export interface ExtractionResult {
  fileHash: string
  detectedType: 'opening_stock' | 'purchase_history'
  pageCount: number
  supplierInfo?: {
    supplierName?: string
    invoiceNumber?: string
    invoiceDate?: string
    declaredTotal?: number
    calculatedTotal?: number
  }
  rows: ExtractedRow[]
  totalRows: number
  totalQuantity: number
  totalPurchaseValue: number
  warnings: string[]
  isDuplicateFile: boolean
  previousBatchId?: string
  isDuplicateInvoice: boolean
  duplicateInvoiceBatchId?: string
}

/**
 * Validates PDF Magic Bytes: "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 5) return false
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d    // -
  )
}

/**
 * Calculates SHA-256 hash of file buffer
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Parse numeric string safely handling French/Algerian formats:
 * "5 500,00", "5 500.00", "12,50", "1 250,50 DZD", "0,00"
 */
export function parseLocalizedNumber(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null) return 0
  if (typeof raw === 'number') return isNaN(raw) || !isFinite(raw) ? 0 : raw

  let cleaned = String(raw).trim()
  // Remove currency words and extra characters
  cleaned = cleaned.replace(/DZD|DA|EUR|USD|[\r\n\t]/gi, '').trim()
  // Remove non-breaking spaces (\xa0) and normal spaces used as thousand separators
  cleaned = cleaned.replace(/[\s\u00A0\u202F]/g, '')

  // If format is like 1.250,50 (European), replace dot with nothing and comma with dot
  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }

  const num = parseFloat(cleaned)
  return isNaN(num) || !isFinite(num) ? 0 : Math.round(num * 100) / 100
}

/**
 * Normalizes separated characters produced by legacy PDF text streams:
 * E.g. "FAU SSE C ALEN D R E" -> "FAUSSE CALENDRE"
 * "BER LIN G O" -> "BERLINGO"
 */
export function cleanSpacedText(text: string): string {
  if (!text) return ''
  let cleaned = text.trim()
  // Collapse excessive spaces
  cleaned = cleaned.replace(/[\u00A0\u202F]/g, ' ')
  
  // Collapse segmented words (e.g., 'FAU SSE' -> 'FAUSSE', 'C ALEN D R E' -> 'CALENDRE')
  // Pass 1: single letters separated by space
  cleaned = cleaned.replace(/(?<=\b[A-Za-z0-9])\s+(?=[A-Za-z0-9]\b)/g, '')
  // Pass 2: 2-3 letter word chunks separated by space within uppercase strings
  cleaned = cleaned.replace(/\b([A-Z]{2,3})\s+([A-Z]{2,4})\b/g, '$1$2')
  cleaned = cleaned.replace(/\b([A-Z]{1,4})\s+([A-Z]{1,3})\b/g, '$1$2')

  // Normalize multi spaces to single space
  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

/**
 * Check if the file hash was already imported previously in import_batches
 */
export async function checkFileDuplicate(fileHash: string): Promise<{ isDuplicate: boolean; batchId?: string }> {
  try {
    const res = await query(
      `SELECT id, status, filename, created_at FROM import_batches WHERE file_hash = $1 ORDER BY created_at DESC LIMIT 1`,
      [fileHash]
    )
    if (res.rows.length > 0) {
      return { isDuplicate: true, batchId: res.rows[0].id }
    }
  } catch (err: any) {
    console.warn('Duplicate check warning:', err.message)
  }
  return { isDuplicate: false }
}

/**
 * Check if a supplier invoice was already imported previously
 */
export async function checkInvoiceDuplicate(
  supplier: string,
  invoiceNumber: string,
  invoiceDate?: string
): Promise<{ isDuplicate: boolean; batchId?: string }> {
  if (!supplier || !invoiceNumber) return { isDuplicate: false }
  try {
    const res = await query(
      `SELECT source_import_id 
       FROM purchase_history 
       WHERE LOWER(supplier_name) = LOWER($1) AND LOWER(invoice_number) = LOWER($2)
       LIMIT 1`,
      [supplier.trim(), invoiceNumber.trim()]
    )
    if (res.rows.length > 0) {
      return { isDuplicate: true, batchId: res.rows[0].source_import_id }
    }
  } catch (err: any) {
    console.warn('Invoice duplicate check warning:', err.message)
  }
  return { isDuplicate: false }
}

/**
 * Main PDF Extraction Pipeline
 */
export async function extractDataFromPdf(
  buffer: Buffer,
  explicitType?: 'opening_stock' | 'purchase_history'
): Promise<ExtractionResult> {
  // 1. Validate magic bytes
  if (!validatePdfMagicBytes(buffer)) {
    throw new Error('الملف المرسل ليس ملف PDF صالح أو تالف (Invalid PDF magic bytes)')
  }

  // 2. Compute SHA-256 hash
  const fileHash = computeFileHash(buffer)
  const dupCheck = await checkFileDuplicate(fileHash)

  // 3. Extract text pages using pdf-parse or fallback
  if (!pdfLib) {
    throw new Error('PDF parsing library is unavailable')
  }

  let rawText = ''
  let pageCount = 1

  try {
    if (typeof pdfLib.PDFParse === 'function') {
      const parser = new pdfLib.PDFParse({ data: buffer })
      const textResult = await parser.getText()
      rawText = textResult.text || ''
      const info = await parser.getInfo().catch(() => null)
      pageCount = info?.total || info?.numPages || info?.pages || 1
    } else if (typeof pdfLib === 'function') {
      const pdfData = await pdfLib(buffer, { max: 0 })
      rawText = pdfData.text || ''
      pageCount = pdfData.numpages || 1
    }
  } catch (parseErr: any) {
    throw new Error(`فشل استخراج محتوى PDF: ${parseErr.message}`)
  }

  // If pageCount is still 1, look for standalone footer lines like "1/88", "88/88"
  if (pageCount === 1) {
    const standalonePageMatches = Array.from(rawText.matchAll(/(?:^|\r?\n)\s*(\d{1,4})\s*\/\s*(\d{1,4})\s*(?:\r?\n|$)/g))
    if (standalonePageMatches.length > 0) {
      for (const m of standalonePageMatches) {
        const totalP = parseInt(m[2], 10)
        if (totalP > pageCount && totalP < 500) pageCount = totalP
      }
    }
  }

  // If text is virtually empty, try OCR fallback
  if (rawText.trim().length < 50) {
    return await executeOcrFallback(buffer, fileHash, pageCount, dupCheck.isDuplicate, dupCheck.batchId)
  }

  // 4. Determine document type (Opening Stock Catalog vs Purchase Invoice)
  const isInvoiceDoc =
    explicitType === 'purchase_history' ||
    /\b(facture|bon de livraison|fournisseur|achat|invoice|bl\s*n[°o]|n°\s*facture)\b/i.test(rawText)

  const detectedType = explicitType || (isInvoiceDoc ? 'purchase_history' : 'opening_stock')

  // 5. Parse lines into structured row items
  const lines = rawText.split(/\r?\n/)
  const extractedRows: ExtractedRow[] = []
  const globalWarnings: string[] = []

  // Money pattern matching prices like: "5 500,00", "7 200,00", "0,00", "1250.00"
  const moneyPattern = /(\d{1,3}(?:[\s\u00A0\u202F]\d{3})*[,.]\d{2})/g

  let currentPage = 1
  let pendingPrefix = ''
  let invoiceSupplier = ''
  let invoiceNum = ''
  let invoiceDateStr = ''
  let invoiceDeclaredTotal = 0

  // Quick scan for invoice header metadata if purchase document
  if (detectedType === 'purchase_history') {
    for (const line of lines.slice(0, 40)) {
      const supMatch = line.match(/(?:fournisseur|soci[eé]t[eé]|supplier|ste)\s*[:]\s*([^\n\r]+)/i)
      if (supMatch && !invoiceSupplier) invoiceSupplier = supMatch[1].trim()

      const numMatch = line.match(/(?:facture|bl|bon)\s*(?:n[°o]|num[eé]ro|#)?\s*[:]?\s*([A-Za-z0-9\-_/]+)/i)
      if (numMatch && !invoiceNum) invoiceNum = numMatch[1].trim()

      const dateMatch = line.match(/(?:date|le)\s*[:]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i)
      if (dateMatch && !invoiceDateStr) invoiceDateStr = dateMatch[1].trim()

      const totalMatch = line.match(/(?:total\s*ttc|net\s*[aà]\s*payer|montant\s*total)\s*[:]?\s*(\d[\d\s\u00A0,.]*)/i)
      if (totalMatch && !invoiceDeclaredTotal) invoiceDeclaredTotal = parseLocalizedNumber(totalMatch[1])
    }
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim()
    if (!rawLine) continue

    // Detect page counters like "1/88", "Page 1 of 88"
    const pageMatch = rawLine.match(/^(\d+)\s*\/\s*(\d+)$/) || rawLine.match(/^page\s*(\d+)/i)
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10) || currentPage
      continue
    }

    // Skip repeating table headers / footers
    if (
      /^r[eé]f\/code/i.test(rawLine) ||
      /^liste des produits/i.test(rawLine) ||
      /^d[eé]veloppement des logiciels/i.test(rawLine) ||
      /^(d[eé]signation|prix|qte|quantit[eé]|total|remise|tva)\b/i.test(rawLine)
    ) {
      continue
    }

    // Check for price occurrences in the line
    const priceMatches = Array.from(rawLine.matchAll(moneyPattern))

    if (priceMatches.length === 0) {
      // Wrapped prefix line (e.g. long part number or description split across lines)
      if (rawLine.length > 2 && !rawLine.startsWith('---')) {
        pendingPrefix = (pendingPrefix + ' ' + rawLine).trim()
      }
      continue
    }

    // Line has prices: merge with any pending prefix
    const fullLine = pendingPrefix ? `${pendingPrefix} ${rawLine}` : rawLine
    pendingPrefix = ''

    // Re-match prices on the combined full line
    const combinedPriceMatches = Array.from(fullLine.matchAll(moneyPattern))
    if (combinedPriceMatches.length === 0) continue

    const firstPriceStart = combinedPriceMatches[0].index ?? fullLine.length
    const headerText = fullLine.substring(0, firstPriceStart).trim()
    const extractedPrices = combinedPriceMatches.map((m) => parseLocalizedNumber(m[1]))

    const rowWarnings: string[] = []

    // Parse columns based on document layout
    let ref = ''
    let name = ''
    let brand = ''
    let qty = 1
    let unitCost = 0
    let sellingPrice = 0
    let semiWholesalePrice = 0
    let wholesalePrice = 0
    let totalCost = 0

    if (detectedType === 'opening_stock') {
      // In Opening Stock lists (like Etat_Article_tout (1).PDF):
      // Prices are: [Pri.Achat, Detail HT, D.gros HT, Gros HT]
      unitCost = extractedPrices[0] || 0
      sellingPrice = extractedPrices[1] || 0
      semiWholesalePrice = extractedPrices[2] || 0
      wholesalePrice = extractedPrices[3] || 0
      qty = 1 // default stock intake or extracted quantity

      // Clean header text from repeating watermark / software headers
      let cleanedHeaderRaw = headerText
        .replace(/D\s*é\s*v\s*e\s*l\s*o\s*p\s*p\s*e\s*m\s*e\s*n\s*t\s*d\s*e\s*s\s*l\s*o\s*g\s*i\s*c\s*i\s*e\s*l\s*s/gi, '')
        .replace(/Liste\s+des\s+Produits/gi, '')
        .replace(/R\s*é\s*f\s*\/\s*C\s*o\s*d\s*e\s+Article\s+Marque/gi, '')
        .trim()

      const cleanedHeader = cleanSpacedText(cleanedHeaderRaw)
      const tokens = cleanedHeader.split(' ').filter(Boolean)

      if (tokens.length >= 1) {
        // Find reference: can have a hyphen or be alphanumeric
        ref = tokens[0]
        // If second token starts with hyphen or is short, merge with ref (e.g., "SYPG" + "032G-001BL")
        if (tokens.length > 2 && (/^[0-9A-Z]{1,4}-[0-9A-Z]+/i.test(tokens[1]) || /^[0-9A-Z]{1,4}$/i.test(tokens[0]))) {
          ref = `${tokens[0]} ${tokens[1]}`
          name = tokens.slice(2).join(' ')
        } else {
          name = tokens.slice(1).join(' ')
        }

        // Check if brand is explicitly in the line
        const knownBrands = [
          'PLEKSAN', 'SIMYI', 'SIM YI', 'DEGA', 'DEPO', 'AYFAR', 'MARS', 'MAD', 
          'VIEW MAX', 'VIEWMAX', 'GIVING', 'CARVAL', 'PULO', 'POLIPLAST', 'SBM', 
          'CASP', 'TYC', 'ALKAR', 'KAYAPLASTIK', 'CAR LIFE', 'CARMAN', 'ROOT', 
          'FTB', 'SOURCE', 'PHILIPS', 'NARVA', 'STANDARD', '3-MAX', 'GUC', 'CHINE', 'ITALI',
          'VALEO', 'BOSCH', 'HELLA', 'SKF', 'MONROE', 'NISSENS'
        ]
        const upperName = name.toUpperCase()
        for (const kb of knownBrands) {
          if (upperName.includes(kb)) {
            brand = kb
            break
          }
        }
      }
    } else {
      // Purchase / Achat Invoice format:
      // Typically: [Qty, UnitPrice, LineTotal] or [UnitPrice, LineTotal]
      if (extractedPrices.length >= 2) {
        unitCost = extractedPrices[0]
        totalCost = extractedPrices[extractedPrices.length - 1]
        if (unitCost > 0 && totalCost > 0) {
          qty = Math.max(1, Math.round(totalCost / unitCost))
        }
      } else {
        unitCost = extractedPrices[0] || 0
        totalCost = unitCost * qty
      }

      // Check math consistency: totalCost vs qty * unitCost
      if (unitCost > 0 && qty > 0 && totalCost > 0) {
        const expectedTotal = Math.round(qty * unitCost * 100) / 100
        const diff = Math.abs(expectedTotal - totalCost)
        if (diff > 1.0) {
          rowWarnings.push(`عدم تطابق في الحساب: الكمية (${qty}) × السعر (${unitCost}) = ${expectedTotal} != الإجمالي (${totalCost})`)
        }
      }

      const cleanedHeader = cleanSpacedText(headerText)
      const tokens = cleanedHeader.split(' ').filter(Boolean)
      ref = tokens[0] || ''
      name = tokens.slice(1).join(' ') || cleanedHeader
    }

    if (!ref && !name) {
      continue
    }

    if (unitCost <= 0 && sellingPrice <= 0) {
      rowWarnings.push('لم يتم العثور على سعر شراء أو سعر بيع صحيح')
    }

    extractedRows.push({
      rowIndex: extractedRows.length + 1,
      pageNumber: currentPage,
      rawText: fullLine,
      reference: ref || name.slice(0, 30),
      productName: name || ref,
      brand: brand || '',
      supplier: invoiceSupplier || undefined,
      invoiceNumber: invoiceNum || undefined,
      invoiceDate: invoiceDateStr || undefined,
      quantity: qty,
      unitCost,
      sellingPrice,
      totalCost: totalCost || unitCost * qty,
      wholesalePrice,
      semiWholesalePrice,
      warnings: rowWarnings,
    })
  }

  // Invoice duplicate check
  let isDupInvoice = false
  let dupInvoiceBatchId: string | undefined
  if (invoiceSupplier && invoiceNum) {
    const invCheck = await checkInvoiceDuplicate(invoiceSupplier, invoiceNum, invoiceDateStr)
    isDupInvoice = invCheck.isDuplicate
    dupInvoiceBatchId = invCheck.batchId
    if (isDupInvoice) {
      globalWarnings.push(`تنبيه: تم استيراد فاتورة من المورد "${invoiceSupplier}" برقم "${invoiceNum}" سابقاً.`)
    }
  }

  if (dupCheck.isDuplicate) {
    globalWarnings.push(`تنبيه: تم رفع هذا الملف سابقاً (نفس البصمة الرقمية SHA-256).`)
  }

  const totalQuantity = extractedRows.reduce((sum, r) => sum + r.quantity, 0)
  const totalPurchaseValue = extractedRows.reduce((sum, r) => sum + (r.unitCost * r.quantity), 0)

  return {
    fileHash,
    detectedType,
    pageCount,
    supplierInfo: invoiceSupplier || invoiceNum ? {
      supplierName: invoiceSupplier,
      invoiceNumber: invoiceNum,
      invoiceDate: invoiceDateStr,
      declaredTotal: invoiceDeclaredTotal,
      calculatedTotal: totalPurchaseValue,
    } : undefined,
    rows: extractedRows,
    totalRows: extractedRows.length,
    totalQuantity,
    totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    warnings: globalWarnings,
    isDuplicateFile: dupCheck.isDuplicate,
    previousBatchId: dupCheck.batchId,
    isDuplicateInvoice: isDupInvoice,
    duplicateInvoiceBatchId: dupInvoiceBatchId,
  }
}

/**
 * OCR Fallback for Scanned PDFs
 */
async function executeOcrFallback(
  _buffer: Buffer,
  fileHash: string,
  pageCount: number,
  isDuplicateFile: boolean,
  previousBatchId?: string
): Promise<ExtractionResult> {
  console.log('[IMPORT] Initiating OCR fallback engine...')
  // In pure Node, Tesseract.js can recognize images.
  // If the document has no text streams, we produce a safe scan alert.
  return {
    fileHash,
    detectedType: 'opening_stock',
    pageCount,
    rows: [],
    totalRows: 0,
    totalQuantity: 0,
    totalPurchaseValue: 0,
    warnings: ['المستند مصور كصورة ممسوحة ضوئياً (Scanned Image PDF). يرجى مراجعة الاستخراج اليدوي أو استخدام وثيقة نصية أوضح.'],
    isDuplicateFile,
    previousBatchId,
    isDuplicateInvoice: false,
  }
}
