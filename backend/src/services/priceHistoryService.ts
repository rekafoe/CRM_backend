import { getDb } from '../db';
import { logger } from '../utils/logger';

export interface PriceSnapshot {
  materialPrices: Record<string, number>;
  basePrices: Record<string, number>;
  pricingMultipliers: Record<string, number>;
  discountRules: Record<string, number>;
  timestamp: string;
}

export interface PriceChangeNotification {
  id: number;
  material_id: number;
  old_price: number;
  new_price: number;
  change_percent: number;
  affected_orders_count: number;
  notification_sent: boolean;
  created_at: string;
}

export class PriceHistoryService {
  /**
   * Создать снимок цен на момент создания заказа
   */
  static async createPriceSnapshot(): Promise<PriceSnapshot> {
    try {
      const db = await getDb();
      
      // Получаем текущие цены материалов
      const materials = await db.all(`
        SELECT id, name, sheet_price_single, price
        FROM materials
        WHERE sheet_price_single IS NOT NULL OR price IS NOT NULL
      `);
      
      const materialPrices: Record<string, number> = {};
      materials.forEach((material: any) => {
        const price = material.sheet_price_single || material.price || 0;
        if (price > 0) {
          materialPrices[material.name] = price;
        }
      });
      
      // Получаем базовые цены продуктов
      const basePrices = await db.all(`
        SELECT product_type, format, urgency, base_price
        FROM product_base_prices
        WHERE is_active = 1
      `);
      
      const basePricesMap: Record<string, number> = {};
      basePrices.forEach((price: any) => {
        const key = `${price.product_type}_${price.format}_${price.urgency}`;
        basePricesMap[key] = price.base_price;
      });
      
      // Получаем коэффициенты ценообразования
      const multipliers = await db.all(`
        SELECT multiplier_type, multiplier_name, multiplier_value
        FROM pricing_multipliers
        WHERE is_active = 1
      `);
      
      const pricingMultipliers: Record<string, number> = {};
      multipliers.forEach((mult: any) => {
        const key = `${mult.multiplier_type}_${mult.multiplier_name}`;
        pricingMultipliers[key] = mult.multiplier_value;
      });
      
      // Получаем правила скидок
      const discounts = await db.all(`
        SELECT discount_type, discount_name, discount_percent
        FROM discount_rules
        WHERE is_active = 1
      `);
      
      const discountRules: Record<string, number> = {};
      discounts.forEach((discount: any) => {
        const key = `${discount.discount_type}_${discount.discount_name}`;
        discountRules[key] = discount.discount_percent;
      });
      
      const snapshot: PriceSnapshot = {
        materialPrices,
        basePrices: basePricesMap,
        pricingMultipliers,
        discountRules,
        timestamp: new Date().toISOString()
      };
      
      logger.info('PriceHistoryService', 'Price snapshot created', {
        materialsCount: Object.keys(materialPrices).length,
        basePricesCount: Object.keys(basePricesMap).length,
        multipliersCount: Object.keys(pricingMultipliers).length,
        discountsCount: Object.keys(discountRules).length
      });
      
      return snapshot;
    } catch (error) {
      logger.error('PriceHistoryService', 'Error creating price snapshot', error);
      throw error;
    }
  }
  
  /**
   * Сохранить снимок цен для товара в заказе
   */
  static async saveItemPriceSnapshot(itemId: number, snapshot: PriceSnapshot): Promise<void> {
    try {
      const db = await getDb();
      
      await db.run(`
        UPDATE items 
        SET 
          price_snapshot = ?,
          material_prices_snapshot = ?,
          base_price_snapshot = ?,
          pricing_calculated_at = ?
        WHERE id = ?
      `, 
        JSON.stringify(snapshot),
        JSON.stringify(snapshot.materialPrices),
        JSON.stringify(snapshot.basePrices),
        snapshot.timestamp,
        itemId
      );
      
      logger.info('PriceHistoryService', 'Price snapshot saved for item', { itemId });
    } catch (error) {
      logger.error('PriceHistoryService', 'Error saving price snapshot', error);
      throw error;
    }
  }
  
  /**
   * Получить снимок цен для товара
   */
  static async getItemPriceSnapshot(itemId: number): Promise<PriceSnapshot | null> {
    try {
      const db = await getDb();
      
      const item = await db.get(`
        SELECT price_snapshot, pricing_calculated_at
        FROM items
        WHERE id = ?
      `, itemId);
      
      if (!item || !item.price_snapshot) {
        return null;
      }
      
      return JSON.parse(item.price_snapshot);
    } catch (error) {
      logger.error('PriceHistoryService', 'Error getting price snapshot', error);
      return null;
    }
  }
  
  /**
   * Отследить изменение цены материала
   */
  static async trackMaterialPriceChange(
    materialId: number, 
    oldPrice: number, 
    newPrice: number,
    changeReason: string = 'Price update'
  ): Promise<void> {
    try {
      const db = await getDb();
      
      const changePercent = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
      
      // Подсчитываем количество заказов, которые могут быть затронуты
      const affectedOrders = await db.get(`
        SELECT COUNT(*) as count
        FROM items i
        JOIN orders o ON o.id = i.orderId
        WHERE i.material_prices_snapshot IS NOT NULL
        AND o.status IN ('pending', 'in_progress')
        AND JSON_EXTRACT(i.material_prices_snapshot, '$."' || (SELECT name FROM materials WHERE id = ?) || '"') IS NOT NULL
      `, materialId);
      
      const affectedOrdersCount = affectedOrders?.count || 0;
      
      // Сохраняем уведомление об изменении цены
      await db.run(`
        INSERT INTO price_change_notifications (
          material_id, old_price, new_price, change_percent, 
          affected_orders_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, materialId, oldPrice, newPrice, changePercent, affectedOrdersCount, new Date().toISOString());
      
      // Сохраняем в историю цен материалов
      await db.run(`
        INSERT INTO material_price_history (
          material_id, old_price, new_price, change_reason, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `, materialId, oldPrice, newPrice, changeReason, new Date().toISOString());
      
      logger.info('PriceHistoryService', 'Material price change tracked', {
        materialId,
        oldPrice,
        newPrice,
        changePercent: changePercent.toFixed(2) + '%',
        affectedOrdersCount
      });
      
    } catch (error) {
      logger.error('PriceHistoryService', 'Error tracking material price change', error);
      throw error;
    }
  }
  
  /**
   * Получить уведомления об изменениях цен
   */
  static async getPriceChangeNotifications(limit: number = 50): Promise<PriceChangeNotification[]> {
    try {
      const db = await getDb();
      
      const notifications = await db.all(`
        SELECT 
          pcn.*,
          m.name as material_name
        FROM price_change_notifications pcn
        LEFT JOIN materials m ON m.id = pcn.material_id
        ORDER BY pcn.created_at DESC
        LIMIT ?
      `, limit);
      
      return notifications.map((n: any) => ({
        id: n.id,
        material_id: n.material_id,
        old_price: n.old_price,
        new_price: n.new_price,
        change_percent: n.change_percent,
        affected_orders_count: n.affected_orders_count,
        notification_sent: Boolean(n.notification_sent),
        created_at: n.created_at,
        material_name: n.material_name
      }));
    } catch (error) {
      logger.error('PriceHistoryService', 'Error getting price change notifications', error);
      return [];
    }
  }
  
  /**
   * Пересчитать цену товара с текущими ценами
   */
  static async recalculateItemPrice(itemId: number): Promise<{
    oldPrice: number;
    newPrice: number;
    priceDifference: number;
    priceDifferencePercent: number;
  } | null> {
    try {
      const db = await getDb();
      
      // Получаем товар
      const item = await db.get(`
        SELECT i.*, o.status as order_status
        FROM items i
        JOIN orders o ON o.id = i.orderId
        WHERE i.id = ?
      `, itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      const oldPrice = item.price;
      
      // Парсим параметры товара
      const params = JSON.parse(item.params);
      
      if (!params.specifications) {
        throw new Error('Item specifications not found');
      }
      
      // Здесь нужно будет интегрировать с DynamicPricingService
      // Пока возвращаем заглушку
      const newPrice = oldPrice; // TODO: Реализовать пересчет
      
      const priceDifference = newPrice - oldPrice;
      const priceDifferencePercent = oldPrice > 0 ? (priceDifference / oldPrice) * 100 : 0;
      
      logger.info('PriceHistoryService', 'Item price recalculated', {
        itemId,
        oldPrice,
        newPrice,
        priceDifference,
        priceDifferencePercent: priceDifferencePercent.toFixed(2) + '%'
      });
      
      return {
        oldPrice,
        newPrice,
        priceDifference,
        priceDifferencePercent
      };
    } catch (error) {
      logger.error('PriceHistoryService', 'Error recalculating item price', error);
      return null;
    }
  }
}
