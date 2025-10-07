import { Database } from 'sqlite'

export async function up(db: Database) {
  // Создаем таблицу правил материалов для продуктов
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_material_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_type TEXT NOT NULL,
      product_name TEXT NOT NULL,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      qty_per_item REAL NOT NULL,
      calculation_type TEXT NOT NULL CHECK (calculation_type IN ('per_item', 'per_sheet', 'per_sqm', 'fixed')),
      is_required BOOLEAN DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Создаем индексы
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_product_material_rules_product_type ON product_material_rules(product_type)
  `)
  
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_product_material_rules_material_id ON product_material_rules(material_id)
  `)

  // Вставляем базовые правила для листовок
  await db.exec(`
    INSERT OR IGNORE INTO product_material_rules (product_type, product_name, material_id, qty_per_item, calculation_type, is_required, notes) VALUES
    ('flyers', 'Листовки A6', (SELECT id FROM materials WHERE name LIKE '%бумага%' LIMIT 1), 1, 'per_sheet', 1, 'Бумага для печати'),
    ('flyers', 'Листовки A6', (SELECT id FROM materials WHERE name LIKE '%краска%' LIMIT 1), 0.1, 'per_sheet', 1, 'Краска для печати'),
    ('flyers', 'Листовки A5', (SELECT id FROM materials WHERE name LIKE '%бумага%' LIMIT 1), 1, 'per_sheet', 1, 'Бумага для печати'),
    ('flyers', 'Листовки A5', (SELECT id FROM materials WHERE name LIKE '%краска%' LIMIT 1), 0.1, 'per_sheet', 1, 'Краска для печати'),
    ('business_cards', 'Визитки', (SELECT id FROM materials WHERE name LIKE '%бумага%' LIMIT 1), 1, 'per_sheet', 1, 'Бумага для визиток'),
    ('business_cards', 'Визитки', (SELECT id FROM materials WHERE name LIKE '%краска%' LIMIT 1), 0.05, 'per_sheet', 1, 'Краска для печати')
  `)
}

export async function down(db: Database) {
  // Удаляем таблицу правил
  await db.exec(`
    DROP TABLE IF EXISTS product_material_rules
  `)
}
