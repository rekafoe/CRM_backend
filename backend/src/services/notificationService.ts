import { getDb } from '../db';

export interface NotificationRule {
  id: number;
  name: string;
  orderType: 'website' | 'telegram' | 'all';
  statusFrom: string | number;
  statusTo: string | number;
  delayHours?: number; // Задержка в часах (для проверки сроков)
  messageTemplate: string;
  enabled: boolean;
}

export interface NotificationLog {
  id: number;
  orderId: number;
  orderType: string;
  ruleId: number;
  message: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
}

export class NotificationService {
  /**
   * Проверка заказов на необходимость отправки уведомлений
   */
  static async checkOrderNotifications(): Promise<void> {
    try {
      const db = await getDb();
      
      // Получаем активные правила уведомлений
      const rules = await db.all(`
        SELECT * FROM notification_rules 
        WHERE enabled = 1
      `);
      
      for (const rule of rules) {
        await this.processNotificationRule(rule);
      }
      
      console.log(`✅ Проверка уведомлений завершена. Обработано правил: ${rules.length}`);
    } catch (error) {
      console.error('❌ Ошибка при проверке уведомлений:', error);
    }
  }
  
  /**
   * Обработка конкретного правила уведомлений
   */
  private static async processNotificationRule(rule: NotificationRule): Promise<void> {
    try {
      const db = await getDb();
      
      // Ищем заказы, которые соответствуют правилу
      let query = '';
      let params: any[] = [];
      
      if (rule.orderType === 'telegram') {
        query = `
          SELECT id, status, created_at, updated_at, first_name, chat_id
          FROM photo_orders 
          WHERE status = ? AND updated_at > datetime('now', '-1 hour')
        `;
        params = [rule.statusTo];
      } else if (rule.orderType === 'website') {
        query = `
          SELECT id, status, createdAt as created_at, updated_at, customerName, customerPhone
          FROM orders 
          WHERE status = ? AND updated_at > datetime('now', '-1 hour')
        `;
        params = [rule.statusTo];
      } else {
        // Для 'all' проверяем обе таблицы
        // Это более сложная логика, пока пропустим
        return;
      }
      
      const orders = await db.all(query, params);
      
      for (const order of orders) {
        // Проверяем, не отправляли ли уже уведомление
        const existingNotification = await db.get(`
          SELECT id FROM notification_logs 
          WHERE order_id = ? AND order_type = ? AND rule_id = ?
        `, [order.id, rule.orderType, rule.id]);
        
        if (existingNotification) {
          continue; // Уведомление уже отправлено
        }
        
        // Проверяем задержку, если указана
        if (rule.delayHours) {
          const orderTime = new Date(order.created_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < rule.delayHours) {
            continue; // Еще рано отправлять уведомление
          }
        }
        
        // Отправляем уведомление
        await this.sendNotification(order, rule);
      }
      
    } catch (error) {
      console.error(`❌ Ошибка при обработке правила ${rule.name}:`, error);
    }
  }
  
  /**
   * Отправка уведомления
   */
  private static async sendNotification(order: any, rule: NotificationRule): Promise<void> {
    try {
      const db = await getDb();
      
      // Формируем сообщение
      const message = this.formatMessage(rule.messageTemplate, order, rule);
      
      // Логируем уведомление
      await db.run(`
        INSERT INTO notification_logs (order_id, order_type, rule_id, message, sent_at, status)
        VALUES (?, ?, ?, ?, datetime('now'), 'sent')
      `, [order.id, rule.orderType, rule.id, message]);
      
      // Здесь будет логика отправки (SMS, email, Telegram, etc.)
      console.log(`📧 Уведомление отправлено для заказа ${order.id}: ${message}`);
      
    } catch (error) {
      console.error(`❌ Ошибка при отправке уведомления для заказа ${order.id}:`, error);
      
      // Логируем ошибку
      const db = await getDb();
      await db.run(`
        INSERT INTO notification_logs (order_id, order_type, rule_id, message, sent_at, status, error_message)
        VALUES (?, ?, ?, ?, datetime('now'), 'failed', ?)
      `, [order.id, rule.orderType, rule.id, '', error instanceof Error ? error.message : String(error)]);
    }
  }
  
  /**
   * Форматирование сообщения
   */
  private static formatMessage(template: string, order: any, rule: NotificationRule): string {
    let message = template;
    
    // Заменяем плейсхолдеры
    message = message.replace('{orderId}', order.id);
    message = message.replace('{orderNumber}', order.number || `#${order.id}`);
    message = message.replace('{customerName}', order.customerName || order.first_name || 'Клиент');
    message = message.replace('{status}', this.getStatusLabel(order.status, rule.orderType));
    message = message.replace('{createdAt}', order.created_at);
    message = message.replace('{updatedAt}', order.updated_at);
    
    return message;
  }
  
  /**
   * Получение текстового описания статуса
   */
  private static getStatusLabel(status: string | number, orderType: string): string {
    // Унифицированная система статусов для всех типов заказов
    switch (Number(status)) {
      case 1: return 'Принят в обработку';
      case 2: return 'В работе';
      case 3: return 'Готов';
      case 4: return 'В печати';
      case 5: return 'Завершен';
      case 6: return 'Доставлен';
      case 9: return 'Отменен';
      default: return status.toString();
    }
  }
  
  /**
   * Создание правила уведомлений
   */
  static async createNotificationRule(rule: Omit<NotificationRule, 'id'>): Promise<number> {
    try {
      const db = await getDb();
      
      const result = await db.run(`
        INSERT INTO notification_rules (name, order_type, status_from, status_to, delay_hours, message_template, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [rule.name, rule.orderType, rule.statusFrom, rule.statusTo, rule.delayHours || null, rule.messageTemplate, rule.enabled]);
      
      console.log(`✅ Создано правило уведомлений: ${rule.name}`);
      return result.lastID || 0;
    } catch (error) {
      console.error('❌ Ошибка при создании правила уведомлений:', error);
      throw error;
    }
  }
  
  /**
   * Получение логов уведомлений
   */
  static async getNotificationLogs(limit: number = 100): Promise<NotificationLog[]> {
    try {
      const db = await getDb();
      
      const logs = await db.all(`
        SELECT nl.*, nr.name as rule_name
        FROM notification_logs nl
        LEFT JOIN notification_rules nr ON nl.rule_id = nr.id
        ORDER BY nl.sent_at DESC
        LIMIT ?
      `, [limit]);
      
      return logs;
    } catch (error) {
      console.error('❌ Ошибка при получении логов уведомлений:', error);
      return [];
    }
  }
}
