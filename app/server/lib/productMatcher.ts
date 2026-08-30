import { query } from '../db/db.js'

export type MatchStatus =
  | 'MATCHED_EXACT'
  | 'MATCHED_HIGH_CONFIDENCE'
  | 'MATCHED_REVIEW_REQUIRED'
  | 'UNMATCHED'
  | 'MANUAL_MATCHED'
  | 'NEW_PRODUCT_CREATED'
  | 'SKIPPED'

export type MatchMethod =
  | 'EXACT_SKU'
  | 'EXACT_PART_NUMBER'
  | 'NORMALIZED_PART_NUMBER'
  | 'BRAND_PART_NUMBER'
  | 'ALIAS'
  | 'NAME_BRAND_FUZZY'
  | 'MANUAL'
  | 'NONE'

export interface MatchResult {
  productId?: string
  variantId?: string
  productName?: string
  variantLabel?: string
  partNumber?: string
  sku?: string
  brandName?: string
  currentStock?: number
  matchStatus: MatchStatus
  matchMethod: MatchMethod
  matchConfidence: number
  notes?: string
}

export interface CatalogVariant {
  id: string
  productId: string
  variantSku: string
  partNumber: string
  labelAr: string
  labelFr: string | null
  price: number
  stockQuantity: number
  stockStatus: string
  isActive: boolean
}

export interface CatalogProduct {
  id: string
  sku: string
  basePartNumber: string
  nameAr: string
  nameFr: string | null
  categoryId: string
  categoryName: string
  brandId: string
  brandName: string
  variants: CatalogVariant[]
  aliases: string[]
}

/**
 * Normalizes alphanumeric part numbers: removes hyphens, spaces, slashes, dots, underscores
 * e.g., "P1-20815-W 1" -> "P120815W1", "KR - 287" -> "KR287", "SYPG 032G -001BL" -> "SYPG032G001BL"
 */
export function normalizePartNumber(pn: string | undefined | null): string {
  if (!pn) return ''
  return String(pn)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * Normalizes text for comparison (accents, lowercase, multi-spaces)
 */
export function normalizeText(text: string | undefined | null): string {
  if (!text) return ''
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculates string similarity using Levenshtein distance (0.0 to 1.0)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const a = normalizeText(s1)
  const b = normalizeText(s2)
  if (a === b) return 1.0
  if (!a || !b) return 0.0

  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  const distance = matrix[b.length][a.length]
  const maxLength = Math.max(a.length, b.length)
  return Math.max(0, Math.min(1, 1 - distance / maxLength))
}

/**
 * Loads entire KAS product catalog with variants, brands, and aliases in memory
 * Optimized for O(1) matching of large PDF batches (2,000+ rows)
 */
export async function loadCatalogSnapshot(): Promise<CatalogProduct[]> {
  const productsRes = await query(`
    SELECT 
      p.id, p.sku, p.base_part_number AS "basePartNumber",
      p.name_ar AS "nameAr", p.name_fr AS "nameFr",
      p.category_id AS "categoryId", c.name_ar AS "categoryName",
      p.brand_id AS "brandId", b.name AS "brandName"
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN brands b ON b.id = p.brand_id
    WHERE (p.is_active = 1 OR p.is_active = TRUE)
  `)

  const variantsRes = await query(`
    SELECT 
      v.id, v.product_id AS "productId", v.variant_sku AS "variantSku",
      v.part_number AS "partNumber", v.label_ar AS "labelAr", v.label_fr AS "labelFr",
      v.price, v.stock_quantity AS "stockQuantity", v.stock_status AS "stockStatus",
      (v.is_active = 1 OR v.is_active = TRUE) AS "isActive"
    FROM product_variants v
    WHERE (v.is_active = 1 OR v.is_active = TRUE)
  `)

  const aliasesRes = await query(`
    SELECT product_id AS "productId", alias_term AS "aliasTerm"
    FROM product_aliases
  `)

  const variantsByProd = new Map<string, CatalogVariant[]>()
  for (const v of variantsRes.rows) {
    const list = variantsByProd.get(v.productId) || []
    list.push(v)
    variantsByProd.set(v.productId, list)
  }

  const aliasesByProd = new Map<string, string[]>()
  for (const a of aliasesRes.rows) {
    const list = aliasesByProd.get(a.productId) || []
    list.push(a.aliasTerm)
    aliasesByProd.set(a.productId, list)
  }

  return productsRes.rows.map((p: any) => ({
    id: p.id,
    sku: p.sku,
    basePartNumber: p.basePartNumber,
    nameAr: p.nameAr,
    nameFr: p.nameFr,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    brandId: p.brandId,
    brandName: p.brandName,
    variants: variantsByProd.get(p.id) || [],
    aliases: aliasesByProd.get(p.id) || [],
  }))
}

/**
 * Match an extracted item against the KAS catalog using conservative hierarchical priority:
 * 1. Exact SKU
 * 2. Exact Part Number
 * 3. Normalized Part Number
 * 4. Brand + Normalized Part Number
 * 5. Product Alias
 * 6. Normalized Name + Brand
 * 7. Fuzzy matching as last resort for admin review
 */
export function matchItemAgainstCatalog(
  reference: string,
  productName: string,
  brand: string,
  catalog: CatalogProduct[]
): MatchResult {
  const cleanRef = reference ? reference.trim() : ''
  const normRef = normalizePartNumber(cleanRef)
  const normBrand = normalizeText(brand)
  const normName = normalizeText(productName)

  // 1. Exact SKU Match
  if (cleanRef) {
    for (const p of catalog) {
      if (p.sku.toLowerCase() === cleanRef.toLowerCase()) {
        const variant = p.variants[0]
        return {
          productId: p.id,
          variantId: variant?.id,
          productName: p.nameAr,
          variantLabel: variant?.labelAr,
          partNumber: variant?.partNumber || p.basePartNumber,
          sku: p.sku,
          brandName: p.brandName,
          currentStock: variant?.stockQuantity ?? 0,
          matchStatus: 'MATCHED_EXACT',
          matchMethod: 'EXACT_SKU',
          matchConfidence: 1.0,
          notes: 'تطابق تام مع كود SKU للمنتج',
        }
      }
      for (const v of p.variants) {
        if (v.variantSku.toLowerCase() === cleanRef.toLowerCase()) {
          return {
            productId: p.id,
            variantId: v.id,
            productName: p.nameAr,
            variantLabel: v.labelAr,
            partNumber: v.partNumber,
            sku: v.variantSku,
            brandName: p.brandName,
            currentStock: v.stockQuantity,
            matchStatus: 'MATCHED_EXACT',
            matchMethod: 'EXACT_SKU',
            matchConfidence: 1.0,
            notes: 'تطابق تام مع كود SKU للمتغير',
          }
        }
      }
    }
  }

  // 2. Exact Part Number Match
  if (cleanRef) {
    for (const p of catalog) {
      if (p.basePartNumber.toLowerCase() === cleanRef.toLowerCase()) {
        const variant = p.variants[0]
        return {
          productId: p.id,
          variantId: variant?.id,
          productName: p.nameAr,
          variantLabel: variant?.labelAr,
          partNumber: p.basePartNumber,
          sku: p.sku,
          brandName: p.brandName,
          currentStock: variant?.stockQuantity ?? 0,
          matchStatus: 'MATCHED_EXACT',
          matchMethod: 'EXACT_PART_NUMBER',
          matchConfidence: 0.98,
          notes: 'تطابق تام مع رقم القطعة الأساسي (Part Number)',
        }
      }
      for (const v of p.variants) {
        if (v.partNumber.toLowerCase() === cleanRef.toLowerCase()) {
          return {
            productId: p.id,
            variantId: v.id,
            productName: p.nameAr,
            variantLabel: v.labelAr,
            partNumber: v.partNumber,
            sku: v.variantSku,
            brandName: p.brandName,
            currentStock: v.stockQuantity,
            matchStatus: 'MATCHED_EXACT',
            matchMethod: 'EXACT_PART_NUMBER',
            matchConfidence: 0.98,
            notes: 'تطابق تام مع رقم قطعة المتغير (Variant Part Number)',
          }
        }
      }
    }
  }

  // 3. Normalized Part Number Match (e.g. "P1-20815-W 1" -> "P120815W1")
  if (normRef && normRef.length >= 3) {
    for (const p of catalog) {
      if (normalizePartNumber(p.basePartNumber) === normRef) {
        const variant = p.variants[0]
        return {
          productId: p.id,
          variantId: variant?.id,
          productName: p.nameAr,
          variantLabel: variant?.labelAr,
          partNumber: p.basePartNumber,
          sku: p.sku,
          brandName: p.brandName,
          currentStock: variant?.stockQuantity ?? 0,
          matchStatus: 'MATCHED_HIGH_CONFIDENCE',
          matchMethod: 'NORMALIZED_PART_NUMBER',
          matchConfidence: 0.95,
          notes: 'تطابق مؤكد مع رقم القطعة بعد المعايرة وحذف الفواصل والمسافات',
        }
      }
      for (const v of p.variants) {
        if (normalizePartNumber(v.partNumber) === normRef) {
          return {
            productId: p.id,
            variantId: v.id,
            productName: p.nameAr,
            variantLabel: v.labelAr,
            partNumber: v.partNumber,
            sku: v.variantSku,
            brandName: p.brandName,
            currentStock: v.stockQuantity,
            matchStatus: 'MATCHED_HIGH_CONFIDENCE',
            matchMethod: 'NORMALIZED_PART_NUMBER',
            matchConfidence: 0.95,
            notes: 'تطابق مؤكد مع رقم قطعة المتغير بعد المعايرة',
          }
        }
      }
    }
  }

  // 4. Brand + Normalized Part Number Match
  if (normBrand && normRef && normRef.length >= 3) {
    for (const p of catalog) {
      if (normalizeText(p.brandName).includes(normBrand) || normBrand.includes(normalizeText(p.brandName))) {
        if (normalizePartNumber(p.basePartNumber).includes(normRef) || normRef.includes(normalizePartNumber(p.basePartNumber))) {
          const variant = p.variants[0]
          return {
            productId: p.id,
            variantId: variant?.id,
            productName: p.nameAr,
            variantLabel: variant?.labelAr,
            partNumber: p.basePartNumber,
            sku: p.sku,
            brandName: p.brandName,
            currentStock: variant?.stockQuantity ?? 0,
            matchStatus: 'MATCHED_HIGH_CONFIDENCE',
            matchMethod: 'BRAND_PART_NUMBER',
            matchConfidence: 0.92,
            notes: `تطابق رقم القطعة مع التحقق من العلامة التجارية (${p.brandName})`,
          }
        }
      }
    }
  }

  // 5. Product Alias Match
  if (cleanRef || productName) {
    const searchTerms = [cleanRef, productName].filter(Boolean)
    for (const term of searchTerms) {
      const normTerm = normalizeText(term)
      for (const p of catalog) {
        for (const alias of p.aliases) {
          if (normalizeText(alias) === normTerm) {
            const variant = p.variants[0]
            return {
              productId: p.id,
              variantId: variant?.id,
              productName: p.nameAr,
              variantLabel: variant?.labelAr,
              partNumber: p.basePartNumber,
              sku: p.sku,
              brandName: p.brandName,
              currentStock: variant?.stockQuantity ?? 0,
              matchStatus: 'MATCHED_HIGH_CONFIDENCE',
              matchMethod: 'ALIAS',
              matchConfidence: 0.88,
              notes: `تطابق عبر الاسم المرادف (${alias})`,
            }
          }
        }
      }
    }
  }

  // 6. Fuzzy Match by Product Name & Brand (Requires Review)
  if (normName && normName.length >= 4) {
    let bestMatch: CatalogProduct | null = null
    let highestScore = 0

    for (const p of catalog) {
      const scoreAr = calculateSimilarity(p.nameAr, normName)
      const scoreFr = p.nameFr ? calculateSimilarity(p.nameFr, normName) : 0
      let maxScore = Math.max(scoreAr, scoreFr)

      // Boost score if brand matches
      if (normBrand && normalizeText(p.brandName).includes(normBrand)) {
        maxScore = Math.min(1.0, maxScore + 0.15)
      }

      if (maxScore > highestScore) {
        highestScore = maxScore
        bestMatch = p
      }
    }

    if (bestMatch && highestScore >= 0.70) {
      const variant = bestMatch.variants[0]
      return {
        productId: bestMatch.id,
        variantId: variant?.id,
        productName: bestMatch.nameAr,
        variantLabel: variant?.labelAr,
        partNumber: bestMatch.basePartNumber,
        sku: bestMatch.sku,
        brandName: bestMatch.brandName,
        currentStock: variant?.stockQuantity ?? 0,
        matchStatus: highestScore >= 0.85 ? 'MATCHED_HIGH_CONFIDENCE' : 'MATCHED_REVIEW_REQUIRED',
        matchMethod: 'NAME_BRAND_FUZZY',
        matchConfidence: Math.round(highestScore * 100) / 100,
        notes: `تطابق تقريبي بالاسم (${Math.round(highestScore * 100)}%) - يتطلب مراجعة وتأكيد المسؤول`,
      }
    }

    if (bestMatch && highestScore >= 0.50) {
      const variant = bestMatch.variants[0]
      return {
        productId: bestMatch.id,
        variantId: variant?.id,
        productName: bestMatch.nameAr,
        variantLabel: variant?.labelAr,
        partNumber: bestMatch.basePartNumber,
        sku: bestMatch.sku,
        brandName: bestMatch.brandName,
        currentStock: variant?.stockQuantity ?? 0,
        matchStatus: 'MATCHED_REVIEW_REQUIRED',
        matchMethod: 'NAME_BRAND_FUZZY',
        matchConfidence: Math.round(highestScore * 100) / 100,
        notes: `اقتراح مطابق بنسبة منخفضة (${Math.round(highestScore * 100)}%) - يتطلب مراجعة دقيقة`,
      }
    }
  }

  // 7. Unmatched
  return {
    matchStatus: 'UNMATCHED',
    matchMethod: 'NONE',
    matchConfidence: 0,
    notes: 'لم يتم العثور على منتج مطابق في الكتالوج الحالي',
  }
}
