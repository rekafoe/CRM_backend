import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaterialReservationsEnhanced1706563200000 implements MigrationInterface {
  name = 'CreateMaterialReservationsEnhanced1706563200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем таблицу резервирования материалов
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS material_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL,
        order_id INTEGER,
        quantity_reserved REAL NOT NULL DEFAULT 0,
        reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
        reserved_by INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
        FOREIGN KEY (reserved_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Создаем индексы для оптимизации
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_reservations_material_id ON material_reservations (material_id)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_reservations_order_id ON material_reservations (order_id)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_reservations_status ON material_reservations (status)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_reservations_expires_at ON material_reservations (expires_at)
    `);

    // Создаем таблицу истории резервирований
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS material_reservation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'fulfilled', 'cancelled', 'expired')),
        old_quantity REAL,
        new_quantity REAL,
        changed_by INTEGER,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES material_reservations (id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Создаем триггер для автоматического обновления updated_at
    await queryRunner.query(`
      CREATE TRIGGER IF NOT EXISTS update_material_reservations_updated_at
      AFTER UPDATE ON material_reservations
      BEGIN
        UPDATE material_reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    // Создаем триггер для логирования изменений
    await queryRunner.query(`
      CREATE TRIGGER IF NOT EXISTS log_material_reservation_changes
      AFTER UPDATE ON material_reservations
      BEGIN
        INSERT INTO material_reservation_history (
          reservation_id, action, old_quantity, new_quantity, changed_by, reason
        ) VALUES (
          NEW.id, 'updated', OLD.quantity_reserved, NEW.quantity_reserved, NEW.reserved_by, 'System update'
        );
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS log_material_reservation_changes`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_material_reservations_updated_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS material_reservation_history`);
    await queryRunner.query(`DROP TABLE IF EXISTS material_reservations`);
  }
}

