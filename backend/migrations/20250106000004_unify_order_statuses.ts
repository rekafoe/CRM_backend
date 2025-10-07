import { getDb } from '../src/db';

export async function up(): Promise<void> {
  const db = await getDb();
  
  console.log('🔄 Унификация системы статусов заказов...');
  
  // Создаем временную колонку для новых статусов
  await db.run(`
    ALTER TABLE photo_orders 
    ADD COLUMN status_new INTEGER
  `);
  
  // Конвертируем текстовые статусы в числовые
  console.log('📱 Конвертируем статусы Telegram заказов...');
  
  // pending -> 1 (Принят в обработку)
  await db.run(`
    UPDATE photo_orders 
    SET status_new = 1 
    WHERE status = 'pending'
  `);
  
  // in_progress -> 2 (В работе)
  await db.run(`
    UPDATE photo_orders 
    SET status_new = 2 
    WHERE status = 'in_progress'
  `);
  
  // ready_for_approval -> 3 (Готов)
  await db.run(`
    UPDATE photo_orders 
    SET status_new = 3 
    WHERE status = 'ready_for_approval'
  `);
  
  // completed -> 5 (Завершен)
  await db.run(`
    UPDATE photo_orders 
    SET status_new = 5 
    WHERE status = 'completed'
  `);
  
  // Удаляем старую колонку status
  await db.run(`
    CREATE TABLE photo_orders_backup AS 
    SELECT id, chat_id, username, first_name, status_new as status,
           original_photos, processed_photos, selected_size, processing_options,
           quantity, total_price, notes, created_at, updated_at
    FROM photo_orders
  `);
  
  await db.run(`DROP TABLE photo_orders`);
  await db.run(`ALTER TABLE photo_orders_backup RENAME TO photo_orders`);
  
  // Обновляем правила уведомлений
  console.log('🔔 Обновляем правила уведомлений...');
  
  await db.run(`
    UPDATE notification_rules 
    SET status_to = '2' 
    WHERE order_type = 'telegram' AND status_to = 'in_progress'
  `);
  
  await db.run(`
    UPDATE notification_rules 
    SET status_to = '3' 
    WHERE order_type = 'telegram' AND status_to = 'ready_for_approval'
  `);
  
  await db.run(`
    UPDATE notification_rules 
    SET status_to = '5' 
    WHERE order_type = 'telegram' AND status_to = 'completed'
  `);
  
  console.log('✅ Унификация статусов завершена');
  console.log('📊 Новая система статусов:');
  console.log('   1 - Принят в обработку');
  console.log('   2 - В работе');
  console.log('   3 - Готов');
  console.log('   4 - В печати');
  console.log('   5 - Завершен');
  console.log('   6 - Доставлен');
  console.log('   9 - Отменен');
}

export async function down(): Promise<void> {
  const db = await getDb();
  
  console.log('🔄 Откат унификации статусов...');
  
  // Создаем временную колонку для старых статусов
  await db.run(`
    ALTER TABLE photo_orders 
    ADD COLUMN status_old TEXT
  `);
  
  // Конвертируем числовые статусы обратно в текстовые
  await db.run(`
    UPDATE photo_orders 
    SET status_old = 'pending' 
    WHERE status = 1
  `);
  
  await db.run(`
    UPDATE photo_orders 
    SET status_old = 'in_progress' 
    WHERE status = 2
  `);
  
  await db.run(`
    UPDATE photo_orders 
    SET status_old = 'ready_for_approval' 
    WHERE status = 3
  `);
  
  await db.run(`
    UPDATE photo_orders 
    SET status_old = 'completed' 
    WHERE status = 5
  `);
  
  // Восстанавливаем старую структуру
  await db.run(`
    CREATE TABLE photo_orders_backup AS 
    SELECT id, chat_id, username, first_name, status_old as status,
           original_photos, processed_photos, selected_size, processing_options,
           quantity, total_price, notes, created_at, updated_at
    FROM photo_orders
  `);
  
  await db.run(`DROP TABLE photo_orders`);
  await db.run(`ALTER TABLE photo_orders_backup RENAME TO photo_orders`);
  
  // Восстанавливаем правила уведомлений
  await db.run(`
    UPDATE notification_rules 
    SET status_to = 'in_progress' 
    WHERE order_type = 'telegram' AND status_to = '2'
  `);
  
  await db.run(`
    UPDATE notification_rules 
    SET status_to = 'ready_for_approval' 
    WHERE order_type = 'telegram' AND status_to = '3'
  `);
  
  await db.run(`
    UPDATE notification_rules 
    SET status_to = 'completed' 
    WHERE order_type = 'telegram' AND status_to = '5'
  `);
  
  console.log('✅ Откат завершен');
}
