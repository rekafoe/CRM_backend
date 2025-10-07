import { getDb } from '../src/db';

export async function up(): Promise<void> {
  const db = await getDb();
  
  console.log('🔔 Creating notification system tables...');
  
  // Таблица правил уведомлений
  await db.run(`
    CREATE TABLE IF NOT EXISTS notification_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      order_type TEXT NOT NULL CHECK (order_type IN ('website', 'telegram', 'all')),
      status_from TEXT,
      status_to TEXT NOT NULL,
      delay_hours INTEGER,
      message_template TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Таблица логов уведомлений
  await db.run(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_type TEXT NOT NULL,
      rule_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      sent_at DATETIME NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES notification_rules (id)
    )
  `);
  
  // Создаем индексы для производительности
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_notification_logs_order 
    ON notification_logs (order_id, order_type)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
    ON notification_logs (sent_at)
  `);
  
  // Создаем базовые правила уведомлений
  await db.run(`
    INSERT INTO notification_rules (name, order_type, status_to, message_template, enabled) VALUES
    ('Заказ готов (Telegram)', 'telegram', 'completed', '🎉 Ваш заказ #{orderId} готов! Можете забрать его в нашем офисе.', 1),
    ('Заказ готов (Сайт)', 'website', '3', '🎉 Ваш заказ #{orderNumber} готов! Можете забрать его в нашем офисе.', 1),
    ('Заказ в работе (Telegram)', 'telegram', 'in_progress', '⚙️ Ваш заказ #{orderId} взят в работу. Ожидаемое время готовности: 24 часа.', 1),
    ('Заказ в работе (Сайт)', 'website', '2', '⚙️ Ваш заказ #{orderNumber} взят в работу. Ожидаемое время готовности: 24 часа.', 1),
    ('Заказ принят (Сайт)', 'website', '1', '✅ Ваш заказ #{orderNumber} принят в обработку. Мы свяжемся с вами в ближайшее время.', 1),
    ('Заказ в печати (Сайт)', 'website', '4', '🖨️ Ваш заказ #{orderNumber} отправлен в печать. Ожидаемое время готовности: 2-4 часа.', 1),
    ('Заказ на доставке (Сайт)', 'website', '5', '🚚 Ваш заказ #{orderNumber} готов и отправлен на доставку. Курьер свяжется с вами.', 1),
    ('Заказ доставлен (Сайт)', 'website', '6', '🎉 Ваш заказ #{orderNumber} успешно доставлен! Спасибо за выбор нашей компании!', 1),
    ('Заказ отменен (Сайт)', 'website', '9', '❌ Ваш заказ #{orderNumber} был отменен. Если у вас есть вопросы, свяжитесь с нами.', 1),
    ('Заказ готов к проверке (Telegram)', 'telegram', 'ready_for_approval', '👀 Ваш заказ #{orderId} готов к проверке! Пожалуйста, подтвердите качество обработки.', 1)
  `);
  
  console.log('✅ Notification system tables created');
}

export async function down(): Promise<void> {
  const db = await getDb();
  
  console.log('🔔 Dropping notification system tables...');
  
  await db.run(`DROP TABLE IF EXISTS notification_logs`);
  await db.run(`DROP TABLE IF EXISTS notification_rules`);
  
  console.log('✅ Notification system tables dropped');
}
