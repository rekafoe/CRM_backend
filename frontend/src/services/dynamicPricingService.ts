import { logger } from '../utils/logger';

export interface DynamicPricingData {
  minimumOrderCosts: any[];
  productBasePrices: any[];
  materialPrices: any[];
  servicePrices: any[];
  pricingMultipliers: any[];
  discountRules: any[];
  aiModelConfigs: any[];
}

export class DynamicPricingService {
  private static pricingData: DynamicPricingData | null = null;
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  // Загрузка данных динамического ценообразования
  static async loadPricingData(): Promise<DynamicPricingData> {
    const now = Date.now();
    
    // Проверяем кэш
    if (this.pricingData && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.pricingData;
    }

    try {
      const token = localStorage.getItem('crmToken') || 'admin-token-123';
      const response = await fetch('/api/dynamic-pricing/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        this.pricingData = result.data;
        this.lastFetch = now;
        logger.info('DynamicPricingService', 'Данные динамического ценообразования загружены');
        return this.pricingData!;
      } else {
        throw new Error('Неверный формат ответа API');
      }
    } catch (error) {
      logger.error('DynamicPricingService', 'Ошибка загрузки данных ценообразования', error);
      
      // Возвращаем fallback данные
      return this.getFallbackData();
    }
  }

  // Fallback данные на случай ошибки API
  private static getFallbackData(): DynamicPricingData {
    return {
      minimumOrderCosts: [
        { id: 1, format: 'A6', product_type: 'flyers', minimum_cost: 2.50, max_quantity: 10, is_active: true },
        { id: 2, format: 'A5', product_type: 'flyers', minimum_cost: 3.50, max_quantity: 10, is_active: true },
        { id: 3, format: 'A4', product_type: 'flyers', minimum_cost: 5.00, max_quantity: 10, is_active: true },
        { id: 4, format: 'SRA3', product_type: 'flyers', minimum_cost: 8.00, max_quantity: 5, is_active: true }
      ],
      productBasePrices: [
        { id: 1, product_type: 'flyers', format: 'A6', base_price: 0.15, urgency: 'urgent', is_active: true },
        { id: 2, product_type: 'flyers', format: 'A6', base_price: 0.10, urgency: 'online', is_active: true },
        { id: 3, product_type: 'flyers', format: 'A6', base_price: 0.07, urgency: 'promo', is_active: true },
        { id: 4, product_type: 'flyers', format: 'A5', base_price: 0.25, urgency: 'urgent', is_active: true },
        { id: 5, product_type: 'flyers', format: 'A5', base_price: 0.18, urgency: 'online', is_active: true },
        { id: 6, product_type: 'flyers', format: 'A5', base_price: 0.12, urgency: 'promo', is_active: true },
        { id: 7, product_type: 'flyers', format: 'A4', base_price: 0.40, urgency: 'urgent', is_active: true },
        { id: 8, product_type: 'flyers', format: 'A4', base_price: 0.30, urgency: 'online', is_active: true },
        { id: 9, product_type: 'flyers', format: 'A4', base_price: 0.20, urgency: 'promo', is_active: true },
        { id: 10, product_type: 'flyers', format: 'SRA3', base_price: 0.60, urgency: 'urgent', is_active: true },
        { id: 11, product_type: 'flyers', format: 'SRA3', base_price: 0.45, urgency: 'online', is_active: true },
        { id: 12, product_type: 'flyers', format: 'SRA3', base_price: 0.35, urgency: 'promo', is_active: true }
      ],
      materialPrices: [
        { id: 1, material_name: 'Бумага NEVIA SRA3 128г/м²', price_per_unit: 0.05, unit: 'лист', is_active: true },
        { id: 2, material_name: 'Бумага NEVIA SRA3 150г/м²', price_per_unit: 0.06, unit: 'лист', is_active: true }
      ],
      servicePrices: [
        { id: 1, service_name: 'Печать цифровая', price_per_unit: 0.03, unit: 'лист', is_active: true },
        { id: 2, service_name: 'Ламинация матовая', price_per_unit: 0.05, unit: 'лист', is_active: true }
      ],
      pricingMultipliers: [
        { id: 1, multiplier_type: 'urgency', multiplier_name: 'Срочно', multiplier_value: 1.5, is_active: true },
        { id: 2, multiplier_type: 'urgency', multiplier_name: 'Онлайн', multiplier_value: 1.0, is_active: true },
        { id: 3, multiplier_type: 'urgency', multiplier_name: 'Акция', multiplier_value: 0.7, is_active: true }
      ],
      discountRules: [
        { id: 1, discount_type: 'volume', discount_name: 'Скидка 10% от 1000 шт', min_quantity: 1000, discount_percent: 10, is_active: true },
        { id: 2, discount_type: 'volume', discount_name: 'Скидка 20% от 5000 шт', min_quantity: 5000, discount_percent: 20, is_active: true }
      ],
      aiModelConfigs: [
        { id: 1, model_name: 'price_prediction_v1', model_parameters: { minimumOrderCosts: { 'SRA3': 8.00 } }, is_active: true }
      ]
    };
  }

  // Получение базовой цены продукта
  static async getProductBasePrice(
    productType: string, 
    format: string, 
    urgency: string = 'online'
  ): Promise<number> {
    const data = await this.loadPricingData();
    
    console.log(`🔍 getProductBasePrice: looking for ${productType}, ${format}, ${urgency}`);
    console.log(`🔍 Available productBasePrices:`, data.productBasePrices);
    
    const price = data.productBasePrices.find(p => 
      p.product_type === productType && 
      p.format === format && 
      p.urgency === urgency &&
      p.is_active
    );
    
    console.log(`🔍 Found price:`, price);
    
    return price ? price.base_price : 0.10; // Fallback цена
  }

  // Получение минимальной стоимости заказа
  static async getMinimumOrderCost(format: string, productType: string, quantity: number): Promise<number> {
    const data = await this.loadPricingData();
    const cost = data.minimumOrderCosts.find(c => 
      c.format === format && 
      c.product_type === productType && 
      c.max_quantity >= quantity &&
      c.is_active
    );
    
    return cost ? cost.minimum_cost : 0;
  }

  // Получение коэффициента срочности
  static async getUrgencyMultiplier(urgency: string): Promise<number> {
    const data = await this.loadPricingData();
    const multiplier = data.pricingMultipliers.find(m => 
      m.multiplier_type === 'urgency' && 
      m.multiplier_name === urgency &&
      m.is_active
    );
    
    return multiplier ? multiplier.multiplier_value : 1.0;
  }

  // Получение скидки по объему
  static async getVolumeDiscount(quantity: number): Promise<number> {
    const data = await this.loadPricingData();
    const discount = data.discountRules.find(d => 
      d.discount_type === 'volume' && 
      d.min_quantity <= quantity &&
      d.is_active
    );
    
    return discount ? discount.discount_percent / 100 : 0;
  }

  // Получение цены материала
  static async getMaterialPrice(materialName: string): Promise<number> {
    const data = await this.loadPricingData();
    const material = data.materialPrices.find(m => 
      m.material_name === materialName &&
      m.is_active
    );
    
    return material ? material.price_per_unit : 0.05; // Fallback цена
  }

  // Получение цены услуги
  static async getServicePrice(serviceName: string): Promise<number> {
    const data = await this.loadPricingData();
    const service = data.servicePrices.find(s => 
      s.service_name === serviceName &&
      s.is_active
    );
    
    return service ? service.price_per_unit : 0.03; // Fallback цена
  }

  // Основная функция расчета цены с использованием динамического ценообразования
  static async calculateDynamicPrice(params: {
    productType: string;
    format: string;
    quantity: number;
    urgency?: string;
    paperType?: string;
    lamination?: string;
    sides?: number;
  }): Promise<{
    basePrice: number;
    materialCost: number;
    serviceCost: number;
    urgencyMultiplier: number;
    volumeDiscount: number;
    minimumOrderCost: number;
    finalPrice: number;
    total: number;
  }> {
    const {
      productType,
      format,
      quantity,
      urgency = 'online',
      paperType = 'semi-matte',
      lamination = 'none',
      sides = 1
    } = params;

    try {
      // Загружаем данные
      const data = await this.loadPricingData();
      
      // Базовая цена продукта
      const basePrice = await this.getProductBasePrice(productType, format, urgency);
      console.log(`🔍 Base price for ${productType} ${format} ${urgency}: ${basePrice}`);
      
      // Стоимость материалов
      const materialCost = await this.getMaterialPrice(`Бумага NEVIA SRA3 150г/м²`);
      console.log(`🔍 Material cost: ${materialCost}`);
      
      // Стоимость услуг
      let serviceCost = 0;
      if (lamination !== 'none') {
        serviceCost += await this.getServicePrice('Ламинация матовая');
      }
      serviceCost += await this.getServicePrice('Печать цифровая');
      
      // Коэффициент срочности
      const urgencyMultiplier = await this.getUrgencyMultiplier(urgency);
      
      // Объемная скидка
      const volumeDiscount = await this.getVolumeDiscount(quantity);
      
      // Минимальная стоимость заказа
      const minimumOrderCost = await this.getMinimumOrderCost(format, productType, quantity);
      
      // Расчет итоговой цены
      const pricePerItem = (basePrice + materialCost + serviceCost) * urgencyMultiplier * (1 - volumeDiscount);
      const finalPrice = Math.max(pricePerItem, minimumOrderCost / quantity);
      const total = finalPrice * quantity;
      
      logger.info('DynamicPricingService', 'Цена рассчитана с использованием динамического ценообразования', {
        productType,
        format,
        quantity,
        finalPrice,
        total
      });
      
      return {
        basePrice,
        materialCost,
        serviceCost,
        urgencyMultiplier,
        volumeDiscount,
        minimumOrderCost,
        finalPrice,
        total
      };
    } catch (error) {
      logger.error('DynamicPricingService', 'Ошибка расчета цены', error);
      
      // Fallback на простой расчет
      const fallbackPrice = 0.10 * quantity;
      return {
        basePrice: 0.10,
        materialCost: 0.05,
        serviceCost: 0.03,
        urgencyMultiplier: 1.0,
        volumeDiscount: 0,
        minimumOrderCost: 0,
        finalPrice: 0.10,
        total: fallbackPrice
      };
    }
  }
}
