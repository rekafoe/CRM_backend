import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  console.log('📊 Creating stock_alerts table...');
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      current_quantity REAL NOT NULL,
      min_stock_level REAL NOT NULL,
      supplier_name TEXT,
      supplier_contact TEXT,
      category_name TEXT,
      alert_level TEXT NOT NULL CHECK (alert_level IN ('low', 'critical', 'out_of_stock')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_resolved INTEGER DEFAULT 0,
      resolved_at TEXT,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);
  
  // Создаем индексы для быстрого поиска
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_material_id ON stock_alerts(material_id)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_alert_level ON stock_alerts(alert_level)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_is_resolved ON stock_alerts(is_resolved)
  `);
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_created_at ON stock_alerts(created_at)
  `);
  
  console.log('✅ Stock alerts table created');
}

export async function down(db: Database): Promise<void> {
  console.log('🔄 Dropping stock_alerts table...');
  
  await db.exec(`DROP INDEX IF EXISTS idx_stock_alerts_created_at`);
  await db.exec(`DROP INDEX IF EXISTS idx_stock_alerts_is_resolved`);
  await db.exec(`DROP INDEX IF EXISTS idx_stock_alerts_alert_level`);
  await db.exec(`DROP INDEX IF EXISTS idx_stock_alerts_material_id`);
  await db.exec(`DROP TABLE IF EXISTS stock_alerts`);
  
  console.log('✅ Stock alerts table dropped');
}
