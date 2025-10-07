import { getDb } from '../src/db';

export async function up() {
  const db = await getDb();
  
  // Создаем таблицу для Telegram пользователей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      is_active BOOLEAN DEFAULT 1,
      role TEXT DEFAULT 'user',
      notifications_enabled BOOLEAN DEFAULT 1,
      notification_preferences TEXT DEFAULT '{"low_stock": true, "new_orders": true, "system_alerts": true}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Создаем индексы
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(chat_id);
    CREATE INDEX IF NOT EXISTS idx_telegram_users_active ON telegram_users(is_active);
    CREATE INDEX IF NOT EXISTS idx_telegram_users_role ON telegram_users(role);
  `);

  // Добавляем колонку min_quantity в stock_alerts если её нет
  try {
    await db.exec(`ALTER TABLE stock_alerts ADD COLUMN min_quantity INTEGER DEFAULT 0`);
  } catch (error) {
    // Колонка уже существует, игнорируем ошибку
    console.log('Column min_quantity already exists in stock_alerts');
  }

  console.log('✅ Created telegram_users table and fixed stock_alerts');
}

export async function down() {
  const db = await getDb();
  
  await db.exec(`DROP TABLE IF EXISTS telegram_users`);
  
  // Удаляем колонку min_quantity из stock_alerts
  try {
    await db.exec(`ALTER TABLE stock_alerts DROP COLUMN min_quantity`);
  } catch (error) {
    console.log('Could not drop min_quantity column:', error);
  }
  
  console.log('✅ Dropped telegram_users table');
}
