import { Database } from 'sqlite3';
import { promisify } from 'util';

export async function up(db: Database) {
  const run = promisify(db.run).bind(db);
  const get = promisify(db.get).bind(db);

  console.log('📋 Creating telegram_settings table...');
  await run(`
    CREATE TABLE IF NOT EXISTS telegram_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  console.log('✅ Created telegram_settings table');

  // Добавляем настройки по умолчанию
  const defaultSettings = [
    { key: 'auto_add_users', value: 'true' },
    { key: 'default_role', value: 'client' },
    { key: 'welcome_message_enabled', value: 'true' },
    { key: 'group_chat_role', value: 'manager' },
    { key: 'webhook_url', value: '' }
  ];

  for (const setting of defaultSettings) {
    const existing = await get(`SELECT value FROM telegram_settings WHERE key = ?`, [setting.key]);
    if (!existing) {
      await run(`INSERT INTO telegram_settings (key, value) VALUES (?, ?)`, [setting.key, setting.value]);
      console.log(`✅ Added setting: ${setting.key} = ${setting.value}`);
    }
  }
}

export async function down(db: Database) {
  const run = promisify(db.run).bind(db);
  console.log('🗑️ Dropping telegram_settings table...');
  await run(`DROP TABLE IF EXISTS telegram_settings;`);
  console.log('✅ Dropped telegram_settings table');
}
