import { Router } from 'express'
import { isPostgres, query } from '../../db/db.js'

const router = Router()

function rangeClause(range: string): { sql: string; prevSql: string } {
  if (isPostgres) {
    if (range === 'today') {
      return {
        sql: `created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
        prevSql: `created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE`,
      }
    }
    if (range === '7d') {
      return {
        sql: `created_at >= NOW() - INTERVAL '7 days'`,
        prevSql: `created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'`,
      }
    }
    if (range === 'this_month') {
      return {
        sql: `created_at >= date_trunc('month', NOW())`,
        prevSql: `created_at >= date_trunc('month', NOW()) - INTERVAL '1 month' AND created_at < date_trunc('month', NOW())`,
      }
    }
    return {
      sql: `created_at >= NOW() - INTERVAL '30 days'`,
      prevSql: `created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'`,
    }
  }

  if (range === 'today') {
    return {
      sql: `DATE(created_at) = DATE('now')`,
      prevSql: `DATE(created_at) = DATE('now', '-1 day')`,
    }
  }
  if (range === '7d') {
    return {
      sql: `created_at >= datetime('now', '-7 days')`,
      prevSql: `created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')`,
    }
  }
  if (range === 'this_month') {
    return {
      sql: `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
      prevSql: `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')`,
    }
  }
  return {
    sql: `created_at >= datetime('now', '-30 days')`,
    prevSql: `created_at >= datetime('now', '-60 days') AND created_at < datetime('now', '-30 days')`,
  }
}

function trendPct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? '+100%' : '0%'
  const pct = ((current - previous) / previous) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

router.get('/overview', async (req, res) => {
  try {
    const { range = '30d' } = req.query as Record<string, string>
    const { sql: period, prevSql } = rangeClause(range)

    const totals = await query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(subtotal), 0) AS revenue 
       FROM orders 
       WHERE (${period}) AND status NOT IN ('cancelled', 'refused_returned')`
    )
    const prev = await query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(subtotal), 0) AS revenue 
       FROM orders 
       WHERE (${prevSql}) AND status NOT IN ('cancelled', 'refused_returned')`
    )
    const totalOrders = Number(totals.rows[0]?.count || 0)
    const totalRevenue = Number(totals.rows[0]?.revenue || 0)
    const prevOrders = Number(prev.rows[0]?.count || 0)
    const prevRevenue = Number(prev.rows[0]?.revenue || 0)

    const todayRes = await query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(subtotal), 0) AS revenue
       FROM orders
       WHERE (DATE(created_at) = DATE('now') OR DATE(created_at) = CURRENT_DATE)
         AND status NOT IN ('cancelled', 'refused_returned')`
    )
    const todayOrders = Number(todayRes.rows[0]?.count || 0)
    const todayRevenue = Number(todayRes.rows[0]?.revenue || 0)

    const statusRes = await query(
      `SELECT status, COUNT(*) AS count FROM orders WHERE ${period} GROUP BY status`
    )
    const statusMap: Record<string, number> = {}
    for (const r of statusRes.rows) {
      statusMap[r.status] = Number(r.count)
    }

    const newOrders = statusMap['pending_confirmation'] || 0
    const confirmedOrders = statusMap['confirmed'] || 0
    const deliveredOrders = statusMap['delivered'] || 0
    const cancelledOrders =
      (statusMap['cancelled'] || 0) + (statusMap['refused_returned'] || 0)

    const prodsCountRes = await query(
      `SELECT COUNT(*) AS count FROM products WHERE is_active = 1 OR is_active = TRUE`
    )
    const totalProducts = Number(prodsCountRes.rows[0]?.count || 0)

    const stockRes = await query(
      `SELECT
        COALESCE(SUM(stock_quantity), 0) AS total_units,
        SUM(CASE WHEN stock_quantity > 5 THEN 1 ELSE 0 END) AS in_stock,
        SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 1 ELSE 0 END) AS low_stock,
        SUM(CASE WHEN stock_quantity = 0 OR stock_status = 'out_of_stock' THEN 1 ELSE 0 END) AS out_of_stock
       FROM product_variants WHERE is_active = 1 OR is_active = TRUE`
    )
    const totalStockUnits = Number(stockRes.rows[0]?.total_units || 0)
    const inStockCount = Number(stockRes.rows[0]?.in_stock || 0)
    const lowStockCount = Number(stockRes.rows[0]?.low_stock || 0)
    const outOfStockCount = Number(stockRes.rows[0]?.out_of_stock || 0)

    const custRes = await query(`SELECT COUNT(*) AS count FROM customers`)
    const totalCustomers = Number(custRes.rows[0]?.count || 0)

    const adOrdersRes = await query(
      `SELECT COUNT(*) AS count 
       FROM orders 
       WHERE (${period}) AND (order_source = 'landing_offer' OR offer_id IS NOT NULL)
         AND status NOT IN ('cancelled', 'refused_returned')`
    )
    const adOrdersCount = Number(adOrdersRes.rows[0]?.count || 0)

    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    const visitsCountRes = await query(`SELECT COUNT(*) AS count FROM campaign_visits`)
    const totalVisits = Number(visitsCountRes.rows[0]?.count || 0)
    const conversionRate = totalVisits > 0 ? Number(((totalOrders / totalVisits) * 100).toFixed(1)) : 0

    res.json({
      kpis: {
        totalOrders,
        todayOrders,
        totalRevenue,
        todayRevenue,
        aov,
        newOrders,
        confirmedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        totalStockUnits,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalCustomers,
        adOrdersCount,
        conversionRate,
        revenueTrend: trendPct(totalRevenue, prevRevenue),
        ordersTrend: trendPct(totalOrders, prevOrders),
      },
    })
  } catch (err) {
    console.error('Analytics overview error:', err)
    res.status(500).json({ error: 'Failed to fetch overview analytics' })
  }
})

router.get('/charts', async (_req, res) => {
  try {
    const dayExpr = isPostgres
      ? `TO_CHAR(created_at::date, 'YYYY-MM-DD')`
      : `DATE(created_at)`
    const lastDaysFilter = isPostgres
      ? `created_at >= NOW() - INTERVAL '7 days'`
      : `created_at >= datetime('now', '-7 days')`

    const salesRes = await query(
      `SELECT ${dayExpr} AS date,
              COALESCE(SUM(subtotal), 0) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE (${lastDaysFilter}) AND status NOT IN ('cancelled', 'refused_returned')
       GROUP BY ${dayExpr}
       ORDER BY date ASC`
    )

    const spendRes = await query(
      `SELECT COALESCE(SUM(budget), 0) AS spend FROM marketing_campaigns WHERE is_active = 1 OR is_active = TRUE`
    )
    const activeDays = Math.max(salesRes.rows.length, 1)
    const dailyAdSpend = Number(spendRes.rows[0]?.spend || 0) / 7

    const salesOverTime = salesRes.rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
      adSpend: Math.round(dailyAdSpend),
    }))

    const statusRes = await query(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`)
    const statusLabels: Record<string, { name: string; color: string }> = {
      pending_confirmation: { name: 'جديد بانتظار التأكيد', color: '#eab308' },
      confirmed: { name: 'مؤكد', color: '#3b82f6' },
      preparing: { name: 'قيد التجهيز / شحن', color: '#8b5cf6' },
      shipped: { name: 'قيد التجهيز / شحن', color: '#8b5cf6' },
      delivered: { name: 'تم التسليم', color: '#22c55e' },
      cancelled: { name: 'ملغي / راجع', color: '#ef4444' },
      refused_returned: { name: 'ملغي / راجع', color: '#ef4444' },
    }
    const ordersByStatusMap = new Map<string, { name: string; value: number; color: string }>()
    for (const r of statusRes.rows) {
      const meta = statusLabels[r.status] || { name: r.status, color: '#71717a' }
      const existing = ordersByStatusMap.get(meta.name)
      const count = Number(r.count || 0)
      if (existing) existing.value += count
      else ordersByStatusMap.set(meta.name, { name: meta.name, value: count, color: meta.color })
    }
    const ordersByStatus = [...ordersByStatusMap.values()].filter((s) => s.value > 0)

    const topProductsRes = await query(
      `SELECT p.id, p.name_ar AS name, p.base_part_number AS "partNumber", c.name_ar AS category,
              (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.status NOT IN ('cancelled', 'refused_returned')) AS sales_count,
              (SELECT COALESCE(SUM(oi.line_total), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.status NOT IN ('cancelled', 'refused_returned')) AS total_revenue
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY sales_count DESC, p.created_at DESC
       LIMIT 6`
    )

    const topWilayasRes = await query(
      `SELECT w.name_ar AS wilaya, o.wilaya_code AS code,
              COUNT(*) AS orders, COALESCE(SUM(o.subtotal), 0) AS revenue
       FROM orders o
       JOIN algeria_wilayas w ON w.code = o.wilaya_code
       WHERE o.status NOT IN ('cancelled', 'refused_returned')
       GROUP BY o.wilaya_code, w.name_ar
       ORDER BY orders DESC
       LIMIT 6`
    )

    const trafficRes = await query(
      `SELECT order_source AS source, COUNT(*) AS orders, COALESCE(SUM(subtotal), 0) AS revenue
       FROM orders
       WHERE status NOT IN ('cancelled', 'refused_returned')
       GROUP BY order_source
       ORDER BY orders DESC`
    )
    const trafficTotal = trafficRes.rows.reduce((sum, r) => sum + Number(r.orders || 0), 0) || 1
    const sourceLabels: Record<string, string> = {
      facebook: 'Facebook Ads',
      instagram: 'Instagram Ads / Reels',
      tiktok: 'TikTok Ads',
      google: 'Google Search Ads',
      landing_offer: 'صفحات الهبوط',
      cart_checkout: 'مباشر (Direct)',
      direct: 'مباشر (Direct)',
    }
    const trafficSources = trafficRes.rows.map((r) => {
      const orders = Number(r.orders || 0)
      return {
        source: sourceLabels[r.source] || r.source,
        orders,
        percentage: Math.round((orders / trafficTotal) * 100),
        revenue: Number(r.revenue || 0),
      }
    })

    res.json({
      salesOverTime,
      ordersByStatus,
      topProducts: topProductsRes.rows,
      topWilayas: topWilayasRes.rows.map((r) => ({
        wilaya: r.wilaya,
        code: r.code,
        orders: Number(r.orders || 0),
        revenue: Number(r.revenue || 0),
      })),
      trafficSources,
    })
  } catch (err) {
    console.error('Analytics charts error:', err)
    res.status(500).json({ error: 'Failed to fetch chart analytics' })
  }
})

export default router
