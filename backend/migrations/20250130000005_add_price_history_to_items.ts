import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  console.log('📊 Adding price history fields to items table...');
  
  try {
    // Добавляем поля для истории цен в таблицу items
    await db.exec(`
      ALTER TABLE items ADD COLUMN price_snapshot TEXT;
    `);
    
    await db.exec(`
      ALTER TABLE items ADD COLUMN material_prices_snapshot TEXT;
    `);
    
    await db.exec(`
      ALTER TABLE items ADD COLUMN base_price_snapshot TEXT;
    `);
    
    await db.exec(`
      ALTER TABLE items ADD COLUMN pricing_calculated_at TEXT DEFAULT (datetime('now'));
    `);
    
    console.log('✅ Price history fields added to items table');
    
    // Создаем таблицу для отслеживания изменений цен
    await db.exec(`
      CREATE TABLE IF NOT EXISTS price_change_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER,
        old_price REAL,
        new_price REAL,
        change_percent REAL,
        affected_orders_count INTEGER DEFAULT 0,
        notification_sent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(material_id) REFERENCES materials(id)
      )
    `);
    
    console.log('✅ Price change notifications table created');
    
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ Price history fields already exist, skipping...');
    } else {
      throw error;
    }
  }
}

export async function down(db: Database): Promise<void> {
  console.log('🔄 Removing price history fields from items table...');
  
  try {
    // Удаляем таблицу уведомлений
    await db.exec('DROP TABLE IF EXISTS price_change_notifications');
    
    // Удаляем поля из items (SQLite не поддерживает DROP COLUMN, поэтому оставляем)
    console.log('⚠️ SQLite does not support DROP COLUMN, fields will remain');
    
    console.log('✅ Price history cleanup completed');
  } catch (error) {
    console.log('⚠️ Error during cleanup:', error);
    throw error;
  }
}
