import { Database } from 'sqlite'

export async function up(db: Database) {
  // Создаем таблицу уведомлений о материалах
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon')),
      current_quantity REAL NOT NULL,
      threshold_quantity REAL NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      user_id INTEGER REFERENCES users(id)
    )
  `)

  // Создаем индексы
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_alerts_material_id ON material_alerts(material_id)
  `)
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_alerts_is_read ON material_alerts(is_read)
  `)
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_alerts_created_at ON material_alerts(created_at)
  `)
}

export async function down(db: Database) {
  // Удаляем таблицу уведомлений
  await db.exec(`
    DROP TABLE IF EXISTS material_alerts
  `)
}
