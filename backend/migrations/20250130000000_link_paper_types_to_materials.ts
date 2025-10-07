import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  console.log('🔗 Creating link between paper_types and materials...');
  
  // Добавляем колонку material_id в таблицу paper_types (если не существует)
  try {
    await db.exec(`
      ALTER TABLE paper_types ADD COLUMN material_id INTEGER REFERENCES materials(id)
    `);
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column material_id already exists, skipping...');
    } else {
      throw error;
    }
  }
  
  // Создаем индекс для быстрого поиска
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_paper_types_material_id ON paper_types(material_id)
  `);
  
  // Добавляем колонку category_id в таблицу paper_types для категоризации
  try {
    await db.exec(`
      ALTER TABLE paper_types ADD COLUMN category_id INTEGER REFERENCES material_categories(id)
    `);
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column category_id already exists, skipping...');
    } else {
      throw error;
    }
  }
  
  // Создаем индекс для категорий
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_paper_types_category_id ON paper_types(category_id)
  `);
  
  console.log('✅ Paper types linked to materials');
}

export async function down(db: Database): Promise<void> {
  console.log('🔄 Removing link between paper_types and materials...');
  
  // Удаляем индексы
  await db.exec(`DROP INDEX IF EXISTS idx_paper_types_material_id`);
  await db.exec(`DROP INDEX IF EXISTS idx_paper_types_category_id`);
  
  // Удаляем колонки
  await db.exec(`ALTER TABLE paper_types DROP COLUMN material_id`);
  await db.exec(`ALTER TABLE paper_types DROP COLUMN category_id`);
  
  console.log('✅ Paper types unlinked from materials');
}
