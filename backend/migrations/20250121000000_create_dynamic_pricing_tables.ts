import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  // Таблица для хранения минимальных стоимостей заказов
  await db.exec(`
    CREATE TABLE IF NOT EXISTS minimum_order_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      format TEXT NOT NULL,
      product_type TEXT NOT NULL,
      minimum_cost REAL NOT NULL,
      max_quantity INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(format, product_type)
    )
  `);

  // Таблица для хранения базовых цен продуктов
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_base_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_type TEXT NOT NULL,
      format TEXT NOT NULL,
      paper_type TEXT,
      paper_density INTEGER,
      lamination TEXT,
      base_price REAL NOT NULL,
      urgency TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Таблица для хранения цен на материалы
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_name TEXT NOT NULL,
      material_type TEXT NOT NULL,
      unit TEXT NOT NULL,
      price_per_unit REAL NOT NULL,
      supplier TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Таблица для хранения цен на услуги
  await db.exec(`
    CREATE TABLE IF NOT EXISTS service_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      unit TEXT NOT NULL,
      price_per_unit REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Таблица для хранения коэффициентов ценообразования
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pricing_multipliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      multiplier_type TEXT NOT NULL,
      multiplier_name TEXT NOT NULL,
      multiplier_value REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Таблица для хранения скидок
  await db.exec(`
    CREATE TABLE IF NOT EXISTS discount_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discount_type TEXT NOT NULL,
      discount_name TEXT NOT NULL,
      min_quantity INTEGER,
      min_amount REAL,
      discount_percent REAL NOT NULL,
      conditions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Таблица для хранения ИИ-моделей и их параметров
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_model_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      model_type TEXT NOT NULL,
      model_parameters TEXT NOT NULL,
      accuracy REAL,
      confidence_threshold REAL DEFAULT 0.7,
      is_active INTEGER DEFAULT 1,
      last_training TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Вставляем базовые данные
  await insertBaseData(db);
}

export async function down(db: Database): Promise<void> {
  await db.exec('DROP TABLE IF EXISTS ai_model_configs');
  await db.exec('DROP TABLE IF EXISTS discount_rules');
  await db.exec('DROP TABLE IF EXISTS pricing_multipliers');
  await db.exec('DROP TABLE IF EXISTS service_prices');
  await db.exec('DROP TABLE IF EXISTS material_prices');
  await db.exec('DROP TABLE IF EXISTS product_base_prices');
  await db.exec('DROP TABLE IF EXISTS minimum_order_costs');
}

async function insertBaseData(db: Database): Promise<void> {
  // Минимальные стоимости заказов
  const minimumCosts = [
    { format: 'A6', product_type: 'flyers', minimum_cost: 2.50, max_quantity: 10 },
    { format: 'A5', product_type: 'flyers', minimum_cost: 3.50, max_quantity: 10 },
    { format: 'A4', product_type: 'flyers', minimum_cost: 5.00, max_quantity: 10 },
    { format: 'SRA3', product_type: 'flyers', minimum_cost: 8.00, max_quantity: 5 },
    { format: 'A3', product_type: 'posters', minimum_cost: 6.00, max_quantity: 10 },
    { format: 'A2', product_type: 'posters', minimum_cost: 10.00, max_quantity: 5 },
    { format: 'A1', product_type: 'posters', minimum_cost: 15.00, max_quantity: 3 },
    { format: '90x50', product_type: 'business_cards', minimum_cost: 4.00, max_quantity: 50 }
  ];

  for (const cost of minimumCosts) {
    await db.run(`
      INSERT OR IGNORE INTO minimum_order_costs (format, product_type, minimum_cost, max_quantity)
      VALUES (?, ?, ?, ?)
    `, cost.format, cost.product_type, cost.minimum_cost, cost.max_quantity);
  }

  // Базовые цены продуктов
  const basePrices = [
    // Листовки
    { product_type: 'flyers', format: 'A6', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.15, urgency: 'urgent' },
    { product_type: 'flyers', format: 'A6', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.10, urgency: 'online' },
    { product_type: 'flyers', format: 'A6', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.07, urgency: 'promo' },
    
    { product_type: 'flyers', format: 'A5', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.25, urgency: 'urgent' },
    { product_type: 'flyers', format: 'A5', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.18, urgency: 'online' },
    { product_type: 'flyers', format: 'A5', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.12, urgency: 'promo' },
    
    { product_type: 'flyers', format: 'A4', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.40, urgency: 'urgent' },
    { product_type: 'flyers', format: 'A4', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.30, urgency: 'online' },
    { product_type: 'flyers', format: 'A4', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.20, urgency: 'promo' },

    // SRA3
    { product_type: 'flyers', format: 'SRA3', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.60, urgency: 'urgent' },
    { product_type: 'flyers', format: 'SRA3', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.45, urgency: 'online' },
    { product_type: 'flyers', format: 'SRA3', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.35, urgency: 'promo' },

    // Визитки
    { product_type: 'business_cards', format: '90x50', paper_type: 'coated', paper_density: 300, lamination: 'none', base_price: 0.35, urgency: 'urgent' },
    { product_type: 'business_cards', format: '90x50', paper_type: 'coated', paper_density: 300, lamination: 'none', base_price: 0.25, urgency: 'online' },
    { product_type: 'business_cards', format: '90x50', paper_type: 'coated', paper_density: 300, lamination: 'none', base_price: 0.18, urgency: 'promo' }
  ];

  for (const price of basePrices) {
    await db.run(`
      INSERT OR IGNORE INTO product_base_prices 
      (product_type, format, paper_type, paper_density, lamination, base_price, urgency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, price.product_type, price.format, price.paper_type, price.paper_density, 
        price.lamination, price.base_price, price.urgency);
  }

  // Цены на материалы
  const materialPrices = [
    { material_name: 'Бумага NEVIA SRA3 128г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.05, supplier: 'NEVIA' },
    { material_name: 'Бумага NEVIA SRA3 150г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.06, supplier: 'NEVIA' },
    { material_name: 'Бумага NEVIA SRA3 200г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.08, supplier: 'NEVIA' },
    { material_name: 'Бумага NEVIA SRA3 300г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.12, supplier: 'NEVIA' },
    { material_name: 'Краска черная', material_type: 'ink', unit: 'мл', price_per_unit: 0.15, supplier: 'HP' },
    { material_name: 'Краска цветная', material_type: 'ink', unit: 'мл', price_per_unit: 0.15, supplier: 'HP' },
    { material_name: 'Плёнка ламинации матовая 35 мкм, SRA3', material_type: 'lamination', unit: 'лист', price_per_unit: 0.03, supplier: 'GBC' },
    { material_name: 'Плёнка ламинации глянцевая 35 мкм, SRA3', material_type: 'lamination', unit: 'лист', price_per_unit: 0.03, supplier: 'GBC' }
  ];

  for (const material of materialPrices) {
    await db.run(`
      INSERT OR IGNORE INTO material_prices 
      (material_name, material_type, unit, price_per_unit, supplier)
      VALUES (?, ?, ?, ?, ?)
    `, material.material_name, material.material_type, material.unit, 
        material.price_per_unit, material.supplier);
  }

  // Цены на услуги
  const servicePrices = [
    { service_name: 'Печать цифровая', service_type: 'printing', unit: 'лист', price_per_unit: 0.03 },
    { service_name: 'Резка', service_type: 'cutting', unit: 'операция', price_per_unit: 0.01 },
    { service_name: 'Биговка', service_type: 'binding', unit: 'операция', price_per_unit: 0.01 },
    { service_name: 'Скругление углов', service_type: 'finishing', unit: 'операция', price_per_unit: 0.02 },
    { service_name: 'Ламинация матовая', service_type: 'lamination', unit: 'лист', price_per_unit: 0.05 },
    { service_name: 'Ламинация глянцевая', service_type: 'lamination', unit: 'лист', price_per_unit: 0.05 },
    { service_name: 'Сшивка', service_type: 'binding', unit: 'операция', price_per_unit: 0.10 },
    { service_name: 'Расшивка', service_type: 'binding', unit: 'операция', price_per_unit: 0.10 }
  ];

  for (const service of servicePrices) {
    await db.run(`
      INSERT OR IGNORE INTO service_prices 
      (service_name, service_type, unit, price_per_unit)
      VALUES (?, ?, ?, ?)
    `, service.service_name, service.service_type, service.unit, service.price_per_unit);
  }

  // Коэффициенты ценообразования
  const multipliers = [
    { multiplier_type: 'urgency', multiplier_name: 'Срочно', multiplier_value: 1.5, description: 'Срочная печать (1-2 дня)' },
    { multiplier_type: 'urgency', multiplier_name: 'Онлайн', multiplier_value: 1.0, description: 'Стандартная печать (3-5 дней)' },
    { multiplier_type: 'urgency', multiplier_name: 'Акция', multiplier_value: 0.7, description: 'Промо-цены для больших тиражей' },
    { multiplier_type: 'seasonality', multiplier_name: 'Январь', multiplier_value: 0.9, description: 'Спад после праздников' },
    { multiplier_type: 'seasonality', multiplier_name: 'Май', multiplier_value: 1.1, description: 'Пик сезона' },
    { multiplier_type: 'seasonality', multiplier_name: 'Декабрь', multiplier_value: 1.3, description: 'Пик сезона' }
  ];

  for (const multiplier of multipliers) {
    await db.run(`
      INSERT OR IGNORE INTO pricing_multipliers 
      (multiplier_type, multiplier_name, multiplier_value, description)
      VALUES (?, ?, ?, ?)
    `, multiplier.multiplier_type, multiplier.multiplier_name, 
        multiplier.multiplier_value, multiplier.description);
  }

  // Правила скидок
  const discountRules = [
    { discount_type: 'volume', discount_name: 'Скидка 10% от 1000 шт', min_quantity: 1000, discount_percent: 10, conditions: '{"min_quantity": 1000}' },
    { discount_type: 'volume', discount_name: 'Скидка 20% от 5000 шт', min_quantity: 5000, discount_percent: 20, conditions: '{"min_quantity": 5000}' },
    { discount_type: 'volume', discount_name: 'Скидка 30% от 10000 шт', min_quantity: 10000, discount_percent: 30, conditions: '{"min_quantity": 10000}' },
    { discount_type: 'loyalty', discount_name: 'Скидка постоянным клиентам', discount_percent: 5, conditions: '{"customer_type": "regular"}' },
    { discount_type: 'loyalty', discount_name: 'Скидка VIP клиентам', discount_percent: 15, conditions: '{"customer_type": "vip"}' }
  ];

  for (const rule of discountRules) {
    await db.run(`
      INSERT OR IGNORE INTO discount_rules 
      (discount_type, discount_name, min_quantity, discount_percent, conditions)
      VALUES (?, ?, ?, ?, ?)
    `, rule.discount_type, rule.discount_name, rule.min_quantity, 
        rule.discount_percent, rule.conditions);
  }

  // Конфигурация ИИ-модели
  const aiModelConfig = {
    model_name: 'price_prediction_v1',
    model_type: 'price_prediction',
    model_parameters: JSON.stringify({
      minimumOrderCosts: {
        'A6': 2.50,
        'A5': 3.50,
        'A4': 5.00,
        'SRA3': 8.00,
        'A3': 6.00,
        'A2': 10.00,
        'A1': 15.00,
        'default': 3.00
      },
      smallOrderThresholds: {
        'SRA3': 5,
        'default': 10,
        'business_cards': 50
      }
    }),
    accuracy: 0.85,
    confidence_threshold: 0.7
  };

  await db.run(`
    INSERT OR IGNORE INTO ai_model_configs 
    (model_name, model_type, model_parameters, accuracy, confidence_threshold)
    VALUES (?, ?, ?, ?, ?)
  `, aiModelConfig.model_name, aiModelConfig.model_type, 
      aiModelConfig.model_parameters, aiModelConfig.accuracy, 
      aiModelConfig.confidence_threshold);
}