import { Database } from 'sqlite'

export async function up(db: Database) {
  // Создаем таблицу категорий материалов
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#1976d2',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Добавляем колонку category_id в таблицу materials (если не существует)
  try {
    await db.exec(`
      ALTER TABLE materials ADD COLUMN category_id INTEGER REFERENCES material_categories(id)
    `)
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column category_id already exists, skipping...')
    } else {
      throw error
    }
  }

  // Создаем индексы
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id)
  `)

  // Вставляем базовые категории
  await db.exec(`
    INSERT OR IGNORE INTO material_categories (name, description, color) VALUES
    ('Бумага', 'Бумага для печати', '#4caf50'),
    ('Пленка', 'Пленка для ламинации', '#ff9800'),
    ('Краска', 'Краска и тонер', '#9c27b0'),
    ('Прочее', 'Прочие материалы', '#607d8b')
  `)
}

export async function down(db: Database) {
  // Удаляем колонку category_id из materials
  await db.exec(`
    ALTER TABLE materials DROP COLUMN category_id
  `)

  // Удаляем таблицу категорий
  await db.exec(`
    DROP TABLE IF EXISTS material_categories
  `)
}
