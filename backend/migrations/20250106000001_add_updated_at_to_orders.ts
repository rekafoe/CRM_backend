import { getDb } from '../src/db';

export async function up(): Promise<void> {
  const db = await getDb();
  
  console.log('🕒 Adding updated_at field to orders table...');
  
  // Добавляем поле updated_at в таблицу orders
  await db.run(`
    ALTER TABLE orders 
    ADD COLUMN updated_at DATETIME
  `);
  
  // Обновляем все существующие записи, устанавливая updated_at = createdAt
  await db.run(`
    UPDATE orders 
    SET updated_at = createdAt 
    WHERE updated_at IS NULL
  `);
  
  console.log('✅ Added updated_at field to orders table');
}

export async function down(): Promise<void> {
  const db = await getDb();
  
  console.log('🕒 Removing updated_at field from orders table...');
  
  // SQLite не поддерживает DROP COLUMN, поэтому создаем новую таблицу
  await db.run(`
    CREATE TABLE orders_backup AS 
    SELECT id, number, status, createdAt, userId, customerName, 
           customerPhone, customerEmail, prepaymentAmount, 
           prepaymentStatus, paymentUrl, paymentId, paymentMethod
    FROM orders
  `);
  
  await db.run(`DROP TABLE orders`);
  await db.run(`ALTER TABLE orders_backup RENAME TO orders`);
  
  console.log('✅ Removed updated_at field from orders table');
}
