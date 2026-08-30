import sqlite3
import os

SQLITE_PATH = r"c:\website\KAS\app\server\data\kas_autoparts.sqlite"
OUTPUT_SQL_PATH = r"c:\website\KAS\app\server\data\kas_autoparts_pg_dump.sql"

conn = sqlite3.connect(SQLITE_PATH)
cursor = conn.cursor()

# Order of tables to respect foreign keys
TABLE_ORDER = [
    "algeria_wilayas",
    "algeria_communes",
    "categories",
    "brands",
    "vehicle_makes",
    "vehicle_models",
    "vehicle_generations",
    "vehicle_engines",
    "products",
    "product_variants",
    "product_specs",
    "product_images",
    "part_compatibility",
    "product_aliases",
    "landing_offers",
    "offer_features",
    "customers",
    "orders",
    "order_items",
    "order_timeline",
    "inventory_transactions",
    "contact_messages",
    "admin_users",
    "admin_sessions",
    "audit_logs",
    "marketing_campaigns",
    "campaign_visits",
    "notifications",
    "system_settings",
    "import_batches",
    "import_batch_rows",
    "part_requests",
]

def escape_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

with open(OUTPUT_SQL_PATH, "w", encoding="utf-8") as f:
    f.write("-- ====================================================\n")
    f.write("-- Khaled Auto Spares (KAS) - Complete PostgreSQL Dump\n")
    f.write("-- Compatible with Railway, Supabase, Neon, PostgreSQL\n")
    f.write("-- ====================================================\n\n")
    f.write("BEGIN;\n\n")
    f.write("SET CONSTRAINTS ALL DEFERRED;\n\n")

    for tbl in TABLE_ORDER:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{tbl}'")
        if not cursor.fetchone():
            continue
        
        cursor.execute(f"PRAGMA table_info({tbl})")
        cols = [c[1] for c in cursor.fetchall()]
        cols_str = ", ".join([f'"{c}"' for c in cols])
        
        cursor.execute(f"SELECT * FROM {tbl}")
        rows = cursor.fetchall()
        
        if not rows:
            continue
            
        f.write(f"-- Table: {tbl} ({len(rows)} rows)\n")
        f.write(f'DELETE FROM "{tbl}";\n')
        
        # Batch into groups of 500
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]
            val_clauses = []
            for r in batch:
                vals = [escape_val(v) for v in r]
                val_clauses.append(f"({', '.join(vals)})")
            f.write(f'INSERT INTO "{tbl}" ({cols_str}) VALUES\n' + ",\n".join(val_clauses) + ";\n")
        
        f.write("\n")

    f.write("COMMIT;\n")

print(f"🎉 PostgreSQL dump successfully generated at: {OUTPUT_SQL_PATH}")
print(f"   Size: {os.path.getsize(OUTPUT_SQL_PATH) // 1024} KB")

conn.close()
