import { Database } from 'sqlite'

export async function up(db: Database) {
  console.log('🔍 Adding performance indexes...')
  
  // Индексы для таблицы orders
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdAt);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(userId);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customerName);
  `)
  
  // Индексы для таблицы items
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_order_id ON items(orderId);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
  `)
  
  // Индексы для таблицы materials
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
    CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id);
    CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);
  `)
  
  // Индексы для таблицы product_material_rules
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pmr_product_type ON product_material_rules(product_type);
    CREATE INDEX IF NOT EXISTS idx_pmr_product_name ON product_material_rules(product_name);
    CREATE INDEX IF NOT EXISTS idx_pmr_material_id ON product_material_rules(material_id);
  `)
  
  // Индексы для таблицы daily_reports
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
    CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON daily_reports(user_id);
  `)
  
  // Индексы для таблицы order_files
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_files_order_id ON order_files(orderId);
    CREATE INDEX IF NOT EXISTS idx_order_files_approved ON order_files(approved);
  `)
  
  // Индексы для таблицы material_moves
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_moves_material_id ON material_moves(material_id);
    CREATE INDEX IF NOT EXISTS idx_material_moves_date ON material_moves(move_date);
    CREATE INDEX IF NOT EXISTS idx_material_moves_type ON material_moves(move_type);
  `)
  
  // Индексы для таблицы pricing_flyers_tiers
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pricing_flyers_format ON pricing_flyers_tiers(format);
    CREATE INDEX IF NOT EXISTS idx_pricing_flyers_type ON pricing_flyers_tiers(price_type);
    CREATE INDEX IF NOT EXISTS idx_pricing_flyers_density ON pricing_flyers_tiers(paper_density);
    CREATE INDEX IF NOT EXISTS idx_pricing_flyers_qty ON pricing_flyers_tiers(min_qty);
  `)
  
  console.log('✅ Performance indexes added')
}

export async function down(db: Database) {
  console.log('🗑️ Removing performance indexes...')
  
  await db.exec(`
    DROP INDEX IF EXISTS idx_orders_created_at;
    DROP INDEX IF EXISTS idx_orders_user_id;
    DROP INDEX IF EXISTS idx_orders_status;
    DROP INDEX IF EXISTS idx_orders_customer_name;
    DROP INDEX IF EXISTS idx_items_order_id;
    DROP INDEX IF EXISTS idx_items_type;
    DROP INDEX IF EXISTS idx_materials_name;
    DROP INDEX IF EXISTS idx_materials_category_id;
    DROP INDEX IF EXISTS idx_materials_supplier_id;
    DROP INDEX IF EXISTS idx_pmr_product_type;
    DROP INDEX IF EXISTS idx_pmr_product_name;
    DROP INDEX IF EXISTS idx_pmr_material_id;
    DROP INDEX IF EXISTS idx_daily_reports_date;
    DROP INDEX IF EXISTS idx_daily_reports_user_id;
    DROP INDEX IF EXISTS idx_order_files_order_id;
    DROP INDEX IF EXISTS idx_order_files_approved;
    DROP INDEX IF EXISTS idx_material_moves_material_id;
    DROP INDEX IF EXISTS idx_material_moves_date;
    DROP INDEX IF EXISTS idx_material_moves_type;
    DROP INDEX IF EXISTS idx_pricing_flyers_format;
    DROP INDEX IF EXISTS idx_pricing_flyers_type;
    DROP INDEX IF EXISTS idx_pricing_flyers_density;
    DROP INDEX IF EXISTS idx_pricing_flyers_qty;
  `)
  
  console.log('✅ Performance indexes removed')
}

