import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  console.log('🤖 Creating auto_orders tables...');
  
  // Таблица автоматических заказов
  await db.exec(`
    CREATE TABLE IF NOT EXISTS auto_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      supplier_name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'delivered', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT,
      delivered_at TEXT,
      notes TEXT,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    )
  `);
  
  // Таблица материалов в автоматических заказах
  await db.exec(`
    CREATE TABLE IF NOT EXISTS auto_order_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      current_stock REAL NOT NULL,
      min_stock REAL NOT NULL,
      order_quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES auto_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);
  
  // Создаем индексы для быстрого поиска
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_auto_orders_supplier_id ON auto_orders(supplier_id)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_auto_orders_status ON auto_orders(status)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_auto_orders_created_at ON auto_orders(created_at)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_auto_order_materials_order_id ON auto_order_materials(order_id)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_auto_order_materials_material_id ON auto_order_materials(material_id)
  `);
  
  console.log('✅ Auto orders tables created');
}

export async function down(db: Database): Promise<void> {
  console.log('🔄 Dropping auto_orders tables...');
  
  await db.exec(`DROP INDEX IF EXISTS idx_auto_order_materials_material_id`);
  await db.exec(`DROP INDEX IF EXISTS idx_auto_order_materials_order_id`);
  await db.exec(`DROP INDEX IF EXISTS idx_auto_orders_created_at`);
  await db.exec(`DROP INDEX IF EXISTS idx_auto_orders_status`);
  await db.exec(`DROP INDEX IF EXISTS idx_auto_orders_supplier_id`);
  await db.exec(`DROP TABLE IF EXISTS auto_order_materials`);
  await db.exec(`DROP TABLE IF EXISTS auto_orders`);
  
  console.log('✅ Auto orders tables dropped');
}
