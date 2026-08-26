import { query } from '../db/db.js'

async function checkLatestOrder() {
  const orders = await query(`SELECT id, order_reference, customer_first_name, customer_phone, subtotal, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 3`)
  console.log('LATEST ORDERS:', JSON.stringify(orders.rows, null, 2))
  for (const o of orders.rows) {
    const items = await query(`SELECT * FROM order_items WHERE order_id = $1`, [o.id])
    console.log('ITEMS FOR ' + o.order_reference + ':', JSON.stringify(items.rows, null, 2))
  }
}

checkLatestOrder().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
