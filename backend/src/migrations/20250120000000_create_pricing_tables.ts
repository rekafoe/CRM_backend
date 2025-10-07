import { getDb } from '../db';

export async function up() {
  const db = await getDb();
  
  // Таблица базовых цен
  await db.exec(`
    CREATE TABLE IF NOT EXISTS base_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_type TEXT NOT NULL,
      product_variant TEXT NOT NULL,
      urgent_price REAL NOT NULL,
      online_price REAL NOT NULL,
      promo_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_type, product_variant)
    )
  `);

  // Таблица множителей срочности
  await db.exec(`
    CREATE TABLE IF NOT EXISTS urgency_multipliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_type TEXT NOT NULL UNIQUE,
      multiplier REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица скидок по объему
  await db.exec(`
    CREATE TABLE IF NOT EXISTS volume_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      min_quantity INTEGER NOT NULL,
      discount_percent REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица скидок по типу клиента
  await db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_type TEXT NOT NULL UNIQUE,
      discount_percent REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Вставляем базовые данные
  await insertBaseData(db);
}

async function insertBaseData(db: any) {
  // Базовые цены
  const basePrices = [
    // Листовки
    { product_type: 'flyers', product_variant: 'A6', urgent_price: 0.15, online_price: 0.10, promo_price: 0.07 },
    { product_type: 'flyers', product_variant: 'A5', urgent_price: 0.25, online_price: 0.18, promo_price: 0.12 },
    { product_type: 'flyers', product_variant: 'A4', urgent_price: 0.40, online_price: 0.30, promo_price: 0.20 },
    
    // Визитки
    { product_type: 'business_cards', product_variant: 'standard', urgent_price: 0.35, online_price: 0.25, promo_price: 0.18 },
    { product_type: 'business_cards', product_variant: 'laminated', urgent_price: 0.45, online_price: 0.35, promo_price: 0.25 },
    { product_type: 'business_cards', product_variant: 'magnetic', urgent_price: 0.60, online_price: 0.45, promo_price: 0.35 },
    
    // Буклеты
    { product_type: 'booklets', product_variant: 'A4_4page', urgent_price: 0.80, online_price: 0.60, promo_price: 0.45 },
    { product_type: 'booklets', product_variant: 'A4_8page', urgent_price: 1.20, online_price: 0.90, promo_price: 0.70 },
    { product_type: 'booklets', product_variant: 'A5_4page', urgent_price: 0.50, online_price: 0.40, promo_price: 0.30 }
  ];

  for (const price of basePrices) {
    await db.run(`
      INSERT OR REPLACE INTO base_prices (product_type, product_variant, urgent_price, online_price, promo_price)
      VALUES (?, ?, ?, ?, ?)
    `, [price.product_type, price.product_variant, price.urgent_price, price.online_price, price.promo_price]);
  }

  // Множители срочности
  const multipliers = [
    { price_type: 'urgent', multiplier: 1.5 },
    { price_type: 'online', multiplier: 1.0 },
    { price_type: 'promo', multiplier: 0.7 }
  ];

  for (const multiplier of multipliers) {
    await db.run(`
      INSERT OR REPLACE INTO urgency_multipliers (price_type, multiplier)
      VALUES (?, ?)
    `, [multiplier.price_type, multiplier.multiplier]);
  }

  // Скидки по объему
  const volumeDiscounts = [
    { min_quantity: 1000, discount_percent: 10 },
    { min_quantity: 5000, discount_percent: 20 },
    { min_quantity: 10000, discount_percent: 30 }
  ];

  for (const discount of volumeDiscounts) {
    await db.run(`
      INSERT OR REPLACE INTO volume_discounts (min_quantity, discount_percent)
      VALUES (?, ?)
    `, [discount.min_quantity, discount.discount_percent]);
  }

  // Скидки по типу клиента
  const loyaltyDiscounts = [
    { customer_type: 'regular', discount_percent: 5 },
    { customer_type: 'vip', discount_percent: 15 }
  ];

  for (const discount of loyaltyDiscounts) {
    await db.run(`
      INSERT OR REPLACE INTO loyalty_discounts (customer_type, discount_percent)
      VALUES (?, ?)
    `, [discount.customer_type, discount.discount_percent]);
  }
}

export async function down() {
  const db = await getDb();
  
  await db.exec('DROP TABLE IF EXISTS base_prices');
  await db.exec('DROP TABLE IF EXISTS urgency_multipliers');
  await db.exec('DROP TABLE IF EXISTS volume_discounts');
  await db.exec('DROP TABLE IF EXISTS loyalty_discounts');
}

