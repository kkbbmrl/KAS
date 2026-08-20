import { query, isPostgres, sqliteDb } from './db.js'
import fs from 'node:fs'
import path from 'node:path'

export async function initDatabase() {
  console.log('🔄 Initializing database schema...')

  if (isPostgres) {
    const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'server', 'db', 'schema.sql'), 'utf-8')
    const indexesSql = fs.readFileSync(path.resolve(process.cwd(), 'server', 'db', 'indexes.sql'), 'utf-8')
    await query(schemaSql)
    await query(indexesSql)
    console.log('✅ PostgreSQL schema and indexes initialized.')
  } else if (sqliteDb) {
    // SQLite compatible schema initialization
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS algeria_wilayas (
        code TEXT PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        delivery_time_text TEXT NOT NULL,
        min_delivery_hours INTEGER NOT NULL DEFAULT 24,
        max_delivery_hours INTEGER NOT NULL DEFAULT 72,
        shipping_fee REAL NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS algeria_communes (
        id TEXT PRIMARY KEY,
        wilaya_code TEXT NOT NULL REFERENCES algeria_wilayas(code),
        name_ar TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        postal_code TEXT,
        shipping_fee_override REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name_ar TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        icon_name TEXT NOT NULL DEFAULT 'Layers',
        is_available INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        parent_id TEXT REFERENCES categories(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        origin_country TEXT,
        is_featured INTEGER NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicle_makes (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name_ar TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        logo_url TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicle_models (
        id TEXT PRIMARY KEY,
        make_id TEXT NOT NULL REFERENCES vehicle_makes(id),
        slug TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(make_id, slug)
      );

      CREATE TABLE IF NOT EXISTS vehicle_generations (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL REFERENCES vehicle_models(id),
        generation_name TEXT NOT NULL,
        year_start INTEGER NOT NULL,
        year_end INTEGER,
        engine_type TEXT,
        engine_code TEXT,
        fuel_type TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        base_part_number TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id),
        brand_id TEXT NOT NULL REFERENCES brands(id),
        badge TEXT,
        rating REAL NOT NULL DEFAULT 5.0,
        description_ar TEXT NOT NULL,
        description_fr TEXT,
        featured_home INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        variant_sku TEXT NOT NULL UNIQUE,
        part_number TEXT NOT NULL,
        label_ar TEXT NOT NULL,
        label_fr TEXT,
        price REAL NOT NULL,
        old_price REAL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        stock_status TEXT NOT NULL DEFAULT 'in_stock',
        image_url TEXT,
        extra_specs TEXT NOT NULL DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_aliases (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        alias_term TEXT NOT NULL,
        language_code TEXT NOT NULL DEFAULT 'universal',
        UNIQUE(product_id, alias_term)
      );

      CREATE TABLE IF NOT EXISTS product_specs (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        label_ar TEXT NOT NULL,
        value_ar TEXT NOT NULL,
        label_fr TEXT,
        value_fr TEXT,
        display_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        image_url TEXT NOT NULL,
        alt_text_ar TEXT,
        alt_text_fr TEXT,
        is_primary INTEGER NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS part_compatibility (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        variant_id TEXT REFERENCES product_variants(id),
        make_id TEXT NOT NULL REFERENCES vehicle_makes(id),
        model_id TEXT NOT NULL REFERENCES vehicle_models(id),
        generation_id TEXT REFERENCES vehicle_generations(id),
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS landing_offers (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        product_id TEXT NOT NULL REFERENCES products(id),
        variant_id TEXT REFERENCES product_variants(id),
        title_ar TEXT NOT NULL,
        subtitle_ar TEXT NOT NULL,
        title_fr TEXT,
        badge_text TEXT,
        urgency_text TEXT,
        delivery_note TEXT,
        custom_price REAL,
        custom_old_price REAL,
        hero_image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS offer_features (
        id TEXT PRIMARY KEY,
        offer_id TEXT NOT NULL REFERENCES landing_offers(id),
        icon_name TEXT NOT NULL DEFAULT 'ShieldCheck',
        text_ar TEXT NOT NULL,
        text_fr TEXT,
        display_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        wilaya_code TEXT REFERENCES algeria_wilayas(code),
        commune TEXT,
        address TEXT,
        total_orders_count INTEGER NOT NULL DEFAULT 0,
        delivered_orders_count INTEGER NOT NULL DEFAULT 0,
        refused_orders_count INTEGER NOT NULL DEFAULT 0,
        is_blacklisted INTEGER NOT NULL DEFAULT 0,
        internal_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_reference TEXT NOT NULL UNIQUE,
        order_source TEXT NOT NULL DEFAULT 'cart_checkout',
        offer_id TEXT REFERENCES landing_offers(id),
        customer_id TEXT REFERENCES customers(id),
        customer_first_name TEXT NOT NULL,
        customer_last_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        wilaya_code TEXT NOT NULL REFERENCES algeria_wilayas(code),
        commune TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'COD',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        status TEXT NOT NULL DEFAULT 'pending_confirmation',
        subtotal REAL NOT NULL,
        shipping_fee REAL NOT NULL,
        discount_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL,
        customer_notes TEXT,
        call_center_notes TEXT,
        tracking_number TEXT,
        courier_company TEXT DEFAULT 'Yalidine',
        client_ip TEXT,
        client_user_agent TEXT,
        confirmed_at TEXT,
        dispatched_at TEXT,
        delivered_at TEXT,
        cancelled_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        variant_id TEXT REFERENCES product_variants(id),
        product_name_snapshot TEXT NOT NULL,
        part_number_snapshot TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        line_total REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        variant_id TEXT NOT NULL REFERENCES product_variants(id),
        delta_type TEXT NOT NULL,
        order_id TEXT REFERENCES orders(id),
        quantity_delta INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        reason TEXT,
        created_by TEXT NOT NULL DEFAULT 'SYSTEM',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        sender_name TEXT NOT NULL,
        sender_phone TEXT NOT NULL,
        sender_email TEXT,
        message_body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unread',
        admin_reply_notes TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        old_data TEXT,
        new_data TEXT,
        performed_by TEXT NOT NULL DEFAULT 'SYSTEM',
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        avatar_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_timeline (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        status TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        note TEXT,
        created_by TEXT NOT NULL DEFAULT 'SYSTEM',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'facebook',
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        budget REAL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS campaign_visits (
        id TEXT PRIMARY KEY,
        campaign_id TEXT REFERENCES marketing_campaigns(id),
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        landing_slug TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_read INTEGER NOT NULL DEFAULT 0,
        link TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for fast lookups
      CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(order_reference);
      CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
      CREATE INDEX IF NOT EXISTS idx_variants_prod ON product_variants(product_id);
      CREATE INDEX IF NOT EXISTS idx_variants_pnum ON product_variants(part_number);
      CREATE INDEX IF NOT EXISTS idx_timeline_order ON order_timeline(order_id);
      CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(is_read);
    `)
    console.log('✅ SQLite schema initialized.')
  }

  await migrateAdminAuthSchema()
}

async function migrateAdminAuthSchema() {
  try {
    await query(`ALTER TABLE admin_users ADD COLUMN username TEXT`)
  } catch {
    // column already exists
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {
    // already exists
  }

  try {
    await query(
      `UPDATE admin_users
       SET username = LOWER(REPLACE(SUBSTR(email, 1, INSTR(email, '@') - 1), '.', ''))
       WHERE username IS NULL OR username = ''`
    )
  } catch {
    try {
      await query(
        `UPDATE admin_users
         SET username = LOWER(SPLIT_PART(email, '@', 1))
         WHERE username IS NULL OR username = ''`
      )
    } catch {
      // ignore if no rows / dialect mismatch
    }
  }

  try {
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)`)
  } catch {
    // unique index may already exist
  }
}
