import { getDb } from '../src/db';

export async function up(): Promise<void> {
  const db = await getDb();
  
  console.log('🏷️ Adding source field to orders table...');
  
  // Добавляем поле source в таблицу orders
  await db.run(`
    ALTER TABLE orders 
    ADD COLUMN source TEXT DEFAULT 'manual'
  `);
  
  // Обновляем существующие заказы
  // Заказы с customerName/customerPhone считаем с сайта, остальные - ручные
  await db.run(`
    UPDATE orders 
    SET source = 'website' 
    WHERE customerName IS NOT NULL OR customerPhone IS NOT NULL
  `);
  
  console.log('✅ Added source field to orders table');
}

export async function down(): Promise<void> {
  const db = await getDb();
  
  console.log('🏷️ Removing source field from orders table...');
  
  // SQLite не поддерживает DROP COLUMN, поэтому создаем новую таблицу
  await db.run(`
    CREATE TABLE orders_backup AS 
    SELECT id, number, status, createdAt, userId, customerName, 
           customerPhone, customerEmail, prepaymentAmount, 
           prepaymentStatus, paymentUrl, paymentId, paymentMethod, updated_at
    FROM orders
  `);
  
  await db.run(`DROP TABLE orders`);
  await db.run(`ALTER TABLE orders_backup RENAME TO orders`);
  
  console.log('✅ Removed source field from orders table');
}
