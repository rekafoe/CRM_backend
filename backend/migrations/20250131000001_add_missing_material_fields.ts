import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  console.log('🔧 Adding missing fields to materials table...');
  
  // Добавляем колонку description в таблицу materials (если не существует)
  try {
    await db.exec(`
      ALTER TABLE materials ADD COLUMN description TEXT
    `);
    console.log('✅ Added description column to materials');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column description already exists, skipping...');
    } else {
      throw error;
    }
  }
  
  // Добавляем колонку max_stock_level в таблицу materials (если не существует)
  try {
    await db.exec(`
      ALTER TABLE materials ADD COLUMN max_stock_level REAL
    `);
    console.log('✅ Added max_stock_level column to materials');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column max_stock_level already exists, skipping...');
    } else {
      throw error;
    }
  }
  
  // Создаем индекс для быстрого поиска по описанию
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_materials_description ON materials(description)
  `);
  
  console.log('✅ Missing fields added to materials table');
}

export async function down(db: Database): Promise<void> {
  console.log('🔄 Removing missing fields from materials table...');
  
  // Удаляем индексы
  await db.exec(`DROP INDEX IF EXISTS idx_materials_description`);
  
  // Удаляем колонки (SQLite не поддерживает DROP COLUMN, поэтому создаем новую таблицу)
  await db.exec(`
    CREATE TABLE materials_backup AS 
    SELECT id, name, unit, quantity, min_quantity, sheet_price_single, category_id, supplier_id, paper_type_id, density
    FROM materials
  `);
  
  await db.exec(`DROP TABLE materials`);
  await db.exec(`ALTER TABLE materials_backup RENAME TO materials`);
  
  console.log('✅ Missing fields removed from materials table');
}

