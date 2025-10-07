import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  // Таблица резервирования материалов
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      order_id INTEGER,
      quantity_reserved REAL NOT NULL,
      reserved_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'fulfilled', 'cancelled', 'expired'
      reserved_by INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Индексы для оптимизации
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_reservations_material_id 
    ON material_reservations(material_id)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_reservations_order_id 
    ON material_reservations(order_id)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_reservations_status 
    ON material_reservations(status)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_reservations_expires 
    ON material_reservations(expires_at)
  `);

  // Таблица алертов склада
  await db.exec(`
    CREATE TABLE IF NOT EXISTS warehouse_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL, -- 'low_stock', 'out_of_stock', 'expiring'
      current_quantity REAL NOT NULL,
      threshold_quantity REAL NOT NULL,
      message TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);

  // Индексы для алертов
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_warehouse_alerts_material_id 
    ON warehouse_alerts(material_id)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_warehouse_alerts_type 
    ON warehouse_alerts(alert_type)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_warehouse_alerts_resolved 
    ON warehouse_alerts(is_resolved)
  `);
}

export async function down(db: Database): Promise<void> {
  await db.exec('DROP TABLE IF EXISTS warehouse_alerts');
  await db.exec('DROP TABLE IF EXISTS material_reservations');
}

