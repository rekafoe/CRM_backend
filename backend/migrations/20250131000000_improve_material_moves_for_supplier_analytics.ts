import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  console.log('📊 Improving material_moves table for supplier analytics...');

  // Добавляем поля для отслеживания поставок в material_moves
  try {
    await db.exec(`ALTER TABLE material_moves ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)`);
    console.log('✅ Added supplier_id to material_moves');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column supplier_id already exists in material_moves, skipping...');
    } else {
      throw error;
    }
  }

  try {
    await db.exec(`ALTER TABLE material_moves ADD COLUMN delivery_number TEXT`);
    console.log('✅ Added delivery_number to material_moves');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column delivery_number already exists in material_moves, skipping...');
    } else {
      throw error;
    }
  }

  try {
    await db.exec(`ALTER TABLE material_moves ADD COLUMN invoice_number TEXT`);
    console.log('✅ Added invoice_number to material_moves');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column invoice_number already exists in material_moves, skipping...');
    } else {
      throw error;
    }
  }

  try {
    await db.exec(`ALTER TABLE material_moves ADD COLUMN delivery_date TEXT`);
    console.log('✅ Added delivery_date to material_moves');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column delivery_date already exists in material_moves, skipping...');
    } else {
      throw error;
    }
  }

  try {
    await db.exec(`ALTER TABLE material_moves ADD COLUMN delivery_notes TEXT`);
    console.log('✅ Added delivery_notes to material_moves');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column delivery_notes already exists in material_moves, skipping...');
    } else {
      throw error;
    }
  }

  // Добавляем индексы для оптимизации запросов аналитики
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_moves_supplier_id ON material_moves(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_material_moves_delivery_date ON material_moves(delivery_date);
  `);
  console.log('✅ Indexes added to material_moves');

  console.log('✅ material_moves table improved for supplier analytics');
}

export async function down(db: Database): Promise<void> {
  // Удаляем индексы
  await db.exec(`DROP INDEX IF EXISTS idx_material_moves_supplier_id`);
  await db.exec(`DROP INDEX IF EXISTS idx_material_moves_delivery_number`);
  await db.exec(`DROP INDEX IF EXISTS idx_material_moves_delivery_date`);
  await db.exec(`DROP INDEX IF EXISTS idx_material_moves_supplier_fk`);

  // Удаляем колонки (SQLite не поддерживает DROP COLUMN, поэтому создаем новую таблицу)
  await db.exec(`
    CREATE TABLE material_moves_backup AS 
    SELECT id, materialId, delta, reason, orderId, user_id, created_at
    FROM material_moves
  `);

  await db.exec(`DROP TABLE material_moves`);
  await db.exec(`ALTER TABLE material_moves_backup RENAME TO material_moves`);

  console.log('✅ Material moves table reverted');
}

