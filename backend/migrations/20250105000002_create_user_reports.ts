import { Database } from 'sqlite3';

export async function up(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      total_orders INTEGER DEFAULT 0,
      completed_orders INTEGER DEFAULT 0,
      total_revenue INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );
    
    CREATE TABLE IF NOT EXISTS user_report_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      order_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      notes TEXT,
      FOREIGN KEY (report_id) REFERENCES user_reports (id) ON DELETE CASCADE,
      UNIQUE(order_id, order_type)
    );
    
    CREATE INDEX IF NOT EXISTS idx_user_reports_user_date ON user_reports (user_id, date);
    CREATE INDEX IF NOT EXISTS idx_user_report_orders_report ON user_report_orders (report_id);
    CREATE INDEX IF NOT EXISTS idx_user_report_orders_order ON user_report_orders (order_id, order_type);
  `);
}

export async function down(db: Database) {
  await db.exec(`
    DROP TABLE IF EXISTS user_report_orders;
    DROP TABLE IF EXISTS user_reports;
  `);
}
