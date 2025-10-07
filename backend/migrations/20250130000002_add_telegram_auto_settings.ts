import { getDb } from '../src/db';

export async function up() {
  const db = await getDb();
  
  // Добавляем настройки автоматического добавления пользователей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Добавляем настройки по умолчанию
  const defaultSettings = [
    {
      key: 'auto_add_users',
      value: 'true',
      description: 'Автоматически добавлять пользователей, которые пишут боту'
    },
    {
      key: 'default_role',
      value: 'user',
      description: 'Роль по умолчанию для новых пользователей'
    },
    {
      key: 'welcome_message_enabled',
      value: 'true',
      description: 'Отправлять приветственное сообщение новым пользователям'
    },
    {
      key: 'group_chat_role',
      value: 'manager',
      description: 'Роль для пользователей из групповых чатов'
    },
    {
      key: 'webhook_url',
      value: '',
      description: 'URL для Telegram webhook'
    }
  ];

  for (const setting of defaultSettings) {
    await db.run(`
      INSERT OR IGNORE INTO telegram_settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
    `, [setting.key, setting.value, setting.description]);
  }

  console.log('✅ Created telegram_settings table with default settings');
}

export async function down() {
  const db = await getDb();
  await db.exec(`DROP TABLE IF EXISTS telegram_settings`);
  console.log('✅ Dropped telegram_settings table');
}
