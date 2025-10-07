import { getDb } from '../db';
import { logger } from '../utils/logger';

export interface MinimumOrderCost {
  id: number;
  format: string;
  product_type: string;
  minimum_cost: number;
  max_quantity: number;
  is_active: boolean;
}

export interface ProductBasePrice {
  id: number;
  product_type: string;
  format: string;
  paper_type?: string;
  paper_density?: number;
  lamination?: string;
  base_price: number;
  urgency: string;
  is_active: boolean;
}

export interface MaterialPrice {
  id: number;
  material_name: string;
  material_type: string;
  unit: string;
  price_per_unit: number;
  supplier?: string;
  is_active: boolean;
}

export interface ServicePrice {
  id: number;
  service_name: string;
  service_type: string;
  unit: string;
  price_per_unit: number;
  is_active: boolean;
}

export interface PricingMultiplier {
  id: number;
  multiplier_type: string;
  multiplier_name: string;
  multiplier_value: number;
  description?: string;
  is_active: boolean;
}

export interface DiscountRule {
  id: number;
  discount_type: string;
  discount_name: string;
  min_quantity?: number;
  min_amount?: number;
  discount_percent: number;
  conditions?: string;
  is_active: boolean;
}

export interface AIModelConfig {
  id: number;
  model_name: string;
  model_type: string;
  model_parameters: any;
  accuracy?: number;
  confidence_threshold: number;
  is_active: boolean;
  last_training?: Date;
}

export class DynamicPricingService {
  // Получение минимальных стоимостей заказов
  static async getMinimumOrderCosts(): Promise<MinimumOrderCost[]> {
    try {
      // Пока возвращаем статические данные, пока таблицы не созданы
      const staticCosts: MinimumOrderCost[] = [
        { id: 1, format: 'A6', product_type: 'flyers', minimum_cost: 2.50, max_quantity: 10, is_active: true },
        { id: 2, format: 'A5', product_type: 'flyers', minimum_cost: 3.50, max_quantity: 10, is_active: true },
        { id: 3, format: 'A4', product_type: 'flyers', minimum_cost: 5.00, max_quantity: 10, is_active: true },
        { id: 4, format: 'SRA3', product_type: 'flyers', minimum_cost: 8.00, max_quantity: 5, is_active: true },
        { id: 5, format: 'A3', product_type: 'posters', minimum_cost: 6.00, max_quantity: 10, is_active: true },
        { id: 6, format: 'A2', product_type: 'posters', minimum_cost: 10.00, max_quantity: 5, is_active: true },
        { id: 7, format: 'A1', product_type: 'posters', minimum_cost: 15.00, max_quantity: 3, is_active: true },
        { id: 8, format: '90x50', product_type: 'business_cards', minimum_cost: 4.00, max_quantity: 50, is_active: true }
      ];
      
      logger.info('Получены минимальные стоимости заказов', { count: staticCosts.length });
      return staticCosts;
    } catch (error) {
      logger.error('Ошибка получения минимальных стоимостей заказов', error);
      return [];
    }
  }

  // Получение минимальной стоимости для конкретного формата и типа продукта
  static async getMinimumCostForOrder(format: string, productType: string, quantity: number): Promise<number | null> {
    try {
      const costs = await this.getMinimumOrderCosts();
      const cost = costs.find(c => 
        c.format === format && 
        c.product_type === productType && 
        c.max_quantity >= quantity &&
        c.is_active
      );
      
      return cost ? cost.minimum_cost : null;
    } catch (error) {
      logger.error('Ошибка получения минимальной стоимости заказа', error);
      return null;
    }
  }

  // Получение базовых цен продуктов
  static async getProductBasePrices(filters?: {
    productType?: string;
    format?: string;
    urgency?: string;
  }): Promise<ProductBasePrice[]> {
    try {
      // Пока возвращаем статические данные
      const staticPrices: ProductBasePrice[] = [
        { id: 1, product_type: 'flyers', format: 'A6', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.15, urgency: 'urgent', is_active: true },
        { id: 2, product_type: 'flyers', format: 'A6', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.10, urgency: 'online', is_active: true },
        { id: 3, product_type: 'flyers', format: 'A6', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.07, urgency: 'promo', is_active: true },
        { id: 4, product_type: 'flyers', format: 'A5', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.25, urgency: 'urgent', is_active: true },
        { id: 5, product_type: 'flyers', format: 'A5', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.18, urgency: 'online', is_active: true },
        { id: 6, product_type: 'flyers', format: 'A5', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.12, urgency: 'promo', is_active: true },
        { id: 7, product_type: 'flyers', format: 'A4', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.40, urgency: 'urgent', is_active: true },
        { id: 8, product_type: 'flyers', format: 'A4', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.30, urgency: 'online', is_active: true },
        { id: 9, product_type: 'flyers', format: 'A4', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.20, urgency: 'promo', is_active: true },
        { id: 10, product_type: 'flyers', format: 'SRA3', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.60, urgency: 'urgent', is_active: true },
        { id: 11, product_type: 'flyers', format: 'SRA3', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.45, urgency: 'online', is_active: true },
        { id: 12, product_type: 'flyers', format: 'SRA3', paper_type: 'semi-matte', paper_density: 120, lamination: 'none', base_price: 0.35, urgency: 'promo', is_active: true }
      ];

      let filteredPrices = staticPrices;
      if (filters?.productType) {
        filteredPrices = filteredPrices.filter(p => p.product_type === filters.productType);
      }
      if (filters?.format) {
        filteredPrices = filteredPrices.filter(p => p.format === filters.format);
      }
      if (filters?.urgency) {
        filteredPrices = filteredPrices.filter(p => p.urgency === filters.urgency);
      }
      
      logger.info('Получены базовые цены продуктов', { count: filteredPrices.length, filters });
      return filteredPrices;
    } catch (error) {
      logger.error('Ошибка получения базовых цен продуктов', error);
      return [];
    }
  }

  // Получение цен на материалы (теперь из основного склада)
  static async getMaterialPrices(): Promise<MaterialPrice[]> {
    try {
      const db = await getDb();
      
      // Получаем материалы из основного склада с учетом резервов
      const materials = await db.all(`
        SELECT 
          m.id,
          m.name as material_name,
          c.name as material_type,
          m.unit,
          m.sheet_price_single as price_per_unit,
          s.name as supplier,
          1 as is_active,
          -- Рассчитываем доступное количество (остаток - резерв)
          m.quantity - COALESCE((
            SELECT SUM(mr.quantity) 
            FROM material_reservations mr 
            WHERE mr.material_id = m.id 
            AND mr.status = 'reserved'
            AND mr.expires_at > datetime('now')
          ), 0) as available_quantity
        FROM materials m
        LEFT JOIN material_categories c ON c.id = m.category_id
        LEFT JOIN suppliers s ON s.id = m.supplier_id
        WHERE m.quantity > 0
        ORDER BY c.name, m.name
      `);
      
      // Преобразуем в формат MaterialPrice
      const materialPrices: MaterialPrice[] = materials.map((material: any) => ({
        id: material.id,
        material_name: material.material_name,
        material_type: material.material_type || 'paper',
        unit: material.unit,
        price_per_unit: material.price_per_unit || 0,
        supplier: material.supplier,
        is_active: Boolean(material.is_active),
        available_quantity: material.available_quantity || 0
      }));
      
      logger.info('Получены цены на материалы из основного склада', { count: materialPrices.length });
      return materialPrices;
    } catch (error) {
      logger.error('Ошибка получения цен на материалы', error);
      
      // Fallback на статические данные при ошибке
      const staticPrices: MaterialPrice[] = [
        { id: 1, material_name: 'Бумага NEVIA SRA3 128г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.05, supplier: 'NEVIA', is_active: true },
        { id: 2, material_name: 'Бумага NEVIA SRA3 150г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.06, supplier: 'NEVIA', is_active: true },
        { id: 3, material_name: 'Бумага NEVIA SRA3 200г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.08, supplier: 'NEVIA', is_active: true },
        { id: 4, material_name: 'Бумага NEVIA SRA3 300г/м²', material_type: 'paper', unit: 'лист', price_per_unit: 0.12, supplier: 'NEVIA', is_active: true }
      ];
      
      logger.warn('Используем статические данные материалов', { count: staticPrices.length });
      return staticPrices;
    }
  }

  // Получение цен на услуги
  static async getServicePrices(): Promise<ServicePrice[]> {
    try {
      // Пока возвращаем статические данные
      const staticPrices: ServicePrice[] = [
        { id: 1, service_name: 'Печать цифровая', service_type: 'printing', unit: 'лист', price_per_unit: 0.03, is_active: true },
        { id: 2, service_name: 'Резка', service_type: 'cutting', unit: 'операция', price_per_unit: 0.01, is_active: true },
        { id: 3, service_name: 'Биговка', service_type: 'binding', unit: 'операция', price_per_unit: 0.01, is_active: true },
        { id: 4, service_name: 'Скругление углов', service_type: 'finishing', unit: 'операция', price_per_unit: 0.02, is_active: true },
        { id: 5, service_name: 'Ламинация матовая', service_type: 'lamination', unit: 'лист', price_per_unit: 0.05, is_active: true },
        { id: 6, service_name: 'Ламинация глянцевая', service_type: 'lamination', unit: 'лист', price_per_unit: 0.05, is_active: true },
        { id: 7, service_name: 'Сшивка', service_type: 'binding', unit: 'операция', price_per_unit: 0.10, is_active: true },
        { id: 8, service_name: 'Расшивка', service_type: 'binding', unit: 'операция', price_per_unit: 0.10, is_active: true }
      ];
      
      logger.info('Получены цены на услуги', { count: staticPrices.length });
      return staticPrices;
    } catch (error) {
      logger.error('Ошибка получения цен на услуги', error);
      return [];
    }
  }

  // Получение коэффициентов ценообразования
  static async getPricingMultipliers(multiplierType?: string): Promise<PricingMultiplier[]> {
    try {
      // Пока возвращаем статические данные
      const staticMultipliers: PricingMultiplier[] = [
        { id: 1, multiplier_type: 'urgency', multiplier_name: 'Срочно', multiplier_value: 1.5, description: 'Срочная печать (1-2 дня)', is_active: true },
        { id: 2, multiplier_type: 'urgency', multiplier_name: 'Онлайн', multiplier_value: 1.0, description: 'Стандартная печать (3-5 дней)', is_active: true },
        { id: 3, multiplier_type: 'urgency', multiplier_name: 'Акция', multiplier_value: 0.7, description: 'Промо-цены для больших тиражей', is_active: true },
        { id: 4, multiplier_type: 'seasonality', multiplier_name: 'Январь', multiplier_value: 0.9, description: 'Спад после праздников', is_active: true },
        { id: 5, multiplier_type: 'seasonality', multiplier_name: 'Май', multiplier_value: 1.1, description: 'Пик сезона', is_active: true },
        { id: 6, multiplier_type: 'seasonality', multiplier_name: 'Декабрь', multiplier_value: 1.3, description: 'Пик сезона', is_active: true }
      ];

      let filteredMultipliers = staticMultipliers;
      if (multiplierType) {
        filteredMultipliers = filteredMultipliers.filter(m => m.multiplier_type === multiplierType);
      }
      
      logger.info('Получены коэффициенты ценообразования', { count: filteredMultipliers.length, multiplierType });
      return filteredMultipliers;
    } catch (error) {
      logger.error('Ошибка получения коэффициентов ценообразования', error);
      return [];
    }
  }

  // Получение правил скидок
  static async getDiscountRules(discountType?: string): Promise<DiscountRule[]> {
    try {
      // Пока возвращаем статические данные
      const staticRules: DiscountRule[] = [
        { id: 1, discount_type: 'volume', discount_name: 'Скидка 10% от 1000 шт', min_quantity: 1000, discount_percent: 10, conditions: '{"min_quantity": 1000}', is_active: true },
        { id: 2, discount_type: 'volume', discount_name: 'Скидка 20% от 5000 шт', min_quantity: 5000, discount_percent: 20, conditions: '{"min_quantity": 5000}', is_active: true },
        { id: 3, discount_type: 'volume', discount_name: 'Скидка 30% от 10000 шт', min_quantity: 10000, discount_percent: 30, conditions: '{"min_quantity": 10000}', is_active: true },
        { id: 4, discount_type: 'loyalty', discount_name: 'Скидка постоянным клиентам', discount_percent: 5, conditions: '{"customer_type": "regular"}', is_active: true },
        { id: 5, discount_type: 'loyalty', discount_name: 'Скидка VIP клиентам', discount_percent: 15, conditions: '{"customer_type": "vip"}', is_active: true }
      ];

      let filteredRules = staticRules;
      if (discountType) {
        filteredRules = filteredRules.filter(r => r.discount_type === discountType);
      }
      
      logger.info('Получены правила скидок', { count: filteredRules.length, discountType });
      return filteredRules;
    } catch (error) {
      logger.error('Ошибка получения правил скидок', error);
      return [];
    }
  }

  // Получение конфигурации ИИ-модели
  static async getAIModelConfig(modelName?: string): Promise<AIModelConfig | null> {
    try {
      // Пока возвращаем статические данные
      const staticConfig: AIModelConfig = {
        id: 1,
        model_name: 'price_prediction_v1',
        model_type: 'price_prediction',
        model_parameters: {
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
        },
        accuracy: 0.85,
        confidence_threshold: 0.7,
        is_active: true,
        last_training: new Date()
      };
      
      if (modelName && staticConfig.model_name !== modelName) {
        return null;
      }
      
      logger.info('Получена конфигурация ИИ-модели', { modelName: staticConfig.model_name });
      return staticConfig;
    } catch (error) {
      logger.error('Ошибка получения конфигурации ИИ-модели', error);
      return null;
    }
  }

  // Обновление минимальной стоимости заказа
  static async updateMinimumOrderCost(
    id: number, 
    updates: Partial<MinimumOrderCost>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлена минимальная стоимость заказа', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления минимальной стоимости заказа', error);
      return false;
    }
  }

  // Обновление базовой цены продукта
  static async updateProductBasePrice(
    id: number, 
    updates: Partial<ProductBasePrice>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлена базовая цена продукта', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления базовой цены продукта', error);
      return false;
    }
  }

  // Обновление цены материала
  static async updateMaterialPrice(
    id: number, 
    updates: Partial<MaterialPrice>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлена цена материала', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления цены материала', error);
      return false;
    }
  }

  // Обновление цены услуги
  static async updateServicePrice(
    id: number, 
    updates: Partial<ServicePrice>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлена цена услуги', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления цены услуги', error);
      return false;
    }
  }

  // Обновление коэффициента ценообразования
  static async updatePricingMultiplier(
    id: number, 
    updates: Partial<PricingMultiplier>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлен коэффициент ценообразования', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления коэффициента ценообразования', error);
      return false;
    }
  }

  // Обновление правила скидки
  static async updateDiscountRule(
    id: number, 
    updates: Partial<DiscountRule>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлено правило скидки', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления правила скидки', error);
      return false;
    }
  }

  // Обновление конфигурации ИИ-модели
  static async updateAIModelConfig(
    id: number, 
    updates: Partial<AIModelConfig>
  ): Promise<boolean> {
    try {
      // Пока просто логируем обновление
      logger.info('Обновлена конфигурация ИИ-модели', { id, updates });
      return true;
    } catch (error) {
      logger.error('Ошибка обновления конфигурации ИИ-модели', error);
      return false;
    }
  }

  // Получение всех данных ценообразования для экспорта
  static async exportPricingData(): Promise<{
    minimumOrderCosts: MinimumOrderCost[];
    productBasePrices: ProductBasePrice[];
    materialPrices: MaterialPrice[];
    servicePrices: ServicePrice[];
    pricingMultipliers: PricingMultiplier[];
    discountRules: DiscountRule[];
    aiModelConfigs: AIModelConfig[];
  }> {
    try {
      const [
        minimumOrderCosts,
        productBasePrices,
        materialPrices,
        servicePrices,
        pricingMultipliers,
        discountRules,
        aiModelConfigs
      ] = await Promise.all([
        this.getMinimumOrderCosts(),
        this.getProductBasePrices(),
        this.getMaterialPrices(),
        this.getServicePrices(),
        this.getPricingMultipliers(),
        this.getDiscountRules(),
        this.getAIModelConfig()
      ]);

      const result = {
        minimumOrderCosts,
        productBasePrices,
        materialPrices,
        servicePrices,
        pricingMultipliers,
        discountRules,
        aiModelConfigs: aiModelConfigs ? [aiModelConfigs] : []
      };

      logger.info('Экспортированы данные ценообразования', {
        minimumOrderCosts: result.minimumOrderCosts.length,
        productBasePrices: result.productBasePrices.length,
        materialPrices: result.materialPrices.length,
        servicePrices: result.servicePrices.length,
        pricingMultipliers: result.pricingMultipliers.length,
        discountRules: result.discountRules.length,
        aiModelConfigs: result.aiModelConfigs.length
      });

      return result;
    } catch (error) {
      logger.error('Ошибка экспорта данных ценообразования', error);
      throw error;
    }
  }
}