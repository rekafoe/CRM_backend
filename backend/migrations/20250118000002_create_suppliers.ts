import { Database } from 'sqlite'

export async function up(db: Database) {
  // Создаем таблицу поставщиков
  await db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Добавляем колонку supplier_id в таблицу materials (если не существует)
  try {
    await db.exec(`
      ALTER TABLE materials ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)
    `)
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column supplier_id already exists, skipping...')
    } else {
      throw error
    }
  }

  // Создаем индексы
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id)
  `)

  // Вставляем базовых поставщиков
  await db.exec(`
    INSERT OR IGNORE INTO suppliers (name, contact_person, phone, email, is_active) VALUES
    ('ООО "Бумага-Про"', 'Иванов И.И.', '+375291234567', 'info@bumaga-pro.by', 1),
    ('ИП "Пленка-М"', 'Петров П.П.', '+375291234568', 'petrov@pленка.by', 1),
    ('ЗАО "Краска-Люкс"', 'Сидоров С.С.', '+375291234569', 'sidorov@краска.by', 1),
    ('ООО "Универсал"', 'Козлов К.К.', '+375291234570', 'kozlov@универсал.by', 1)
  `)
}

export async function down(db: Database) {
  // Удаляем колонку supplier_id из materials
  await db.exec(`
    ALTER TABLE materials DROP COLUMN supplier_id
  `)

  // Удаляем таблицу поставщиков
  await db.exec(`
    DROP TABLE IF EXISTS suppliers
  `)
}
