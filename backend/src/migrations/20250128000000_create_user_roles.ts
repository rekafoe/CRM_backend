export async function up(db: any): Promise<void> {
  
  // Создаем таблицу ролей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Создаем таблицу назначений ролей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS role_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (role_id) REFERENCES user_roles (id),
      FOREIGN KEY (assigned_by) REFERENCES users (id)
    )
  `)

  // Добавляем колонку role в таблицу users, если её нет
  try {
    await db.exec(`
      ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'operator'
    `)
  } catch (error) {
    // Колонка уже существует, игнорируем ошибку
  }

  // Добавляем колонку is_active в таблицу users, если её нет
  try {
    await db.exec(`
      ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1
    `)
  } catch (error) {
    // Колонка уже существует, игнорируем ошибку
  }

  // Добавляем колонку last_login в таблицу users, если её нет
  try {
    await db.exec(`
      ALTER TABLE users ADD COLUMN last_login TEXT
    `)
  } catch (error) {
    // Колонка уже существует, игнорируем ошибку
  }

  // Создаем индексы
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles (name)
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles (is_active)
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON role_assignments (user_id)
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON role_assignments (role_id)
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active)
  `)
}

export async function down(db: any): Promise<void> {
  
  // Удаляем таблицы
  await db.exec('DROP TABLE IF EXISTS role_assignments')
  await db.exec('DROP TABLE IF EXISTS user_roles')
  
  // Удаляем индексы
  await db.exec('DROP INDEX IF EXISTS idx_user_roles_name')
  await db.exec('DROP INDEX IF EXISTS idx_user_roles_active')
  await db.exec('DROP INDEX IF EXISTS idx_role_assignments_user')
  await db.exec('DROP INDEX IF EXISTS idx_role_assignments_role')
  await db.exec('DROP INDEX IF EXISTS idx_users_role')
  await db.exec('DROP INDEX IF EXISTS idx_users_active')
}
