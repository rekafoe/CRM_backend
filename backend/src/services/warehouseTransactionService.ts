import { getDb } from '../config/database';
import { logger } from '../utils/logger';

export interface TransactionOperation {
  type: 'spend' | 'add' | 'adjust' | 'reserve' | 'unreserve';
  materialId: number;
  quantity: number;
  reason: string;
  orderId?: number;
  userId?: number;
  metadata?: any;
}

export interface TransactionResult {
  success: boolean;
  materialId: number;
  oldQuantity: number;
  newQuantity: number;
  operation: TransactionOperation;
  timestamp: string;
}

export class WarehouseTransactionService {
  // Выполнение атомарной транзакции
  static async executeTransaction(operations: TransactionOperation[]): Promise<TransactionResult[]> {
    const db = await getDb();
    const results: TransactionResult[] = [];
    
    await db.run('BEGIN');
    
    try {
      for (const operation of operations) {
        const result = await this.executeOperation(db, operation);
        results.push(result);
      }
      
      await db.run('COMMIT');
      logger.info('Транзакция выполнена успешно', { 
        operationsCount: operations.length,
        results: results.map(r => ({ materialId: r.materialId, success: r.success }))
      });
      
      return results;
    } catch (error) {
      await db.run('ROLLBACK');
      logger.error('Ошибка выполнения транзакции, откат', error);
      throw error;
    }
  }

  // Выполнение одной операции в рамках транзакции
  private static async executeOperation(db: any, operation: TransactionOperation): Promise<TransactionResult> {
    const { type, materialId, quantity, reason, orderId, userId, metadata } = operation;
    
    // Получаем текущее состояние материала с блокировкой
    const material = await db.get(
      'SELECT * FROM materials WHERE id = ?',
      materialId
    );
    
    if (!material) {
      throw new Error(`Материал с ID ${materialId} не найден`);
    }
    
    const oldQuantity = material.quantity;
    let newQuantity = oldQuantity;
    
    // Выполняем операцию в зависимости от типа
    switch (type) {
      case 'spend':
        if (oldQuantity < quantity) {
          throw new Error(`Недостаточно материала ${material.name}. Доступно: ${oldQuantity}, требуется: ${quantity}`);
        }
        newQuantity = oldQuantity - quantity;
        await db.run(
          'UPDATE materials SET quantity = ? WHERE id = ?',
          newQuantity, materialId
        );
        break;
        
      case 'add':
        newQuantity = oldQuantity + quantity;
        await db.run(
          'UPDATE materials SET quantity = ? WHERE id = ?',
          newQuantity, materialId
        );
        break;
        
      case 'adjust':
        newQuantity = quantity; // Прямая установка количества
        await db.run(
          'UPDATE materials SET quantity = ? WHERE id = ?',
          newQuantity, materialId
        );
        break;
        
      case 'reserve':
        // Резервирование - не изменяем количество, только создаем резерв
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа
        
        await db.run(`
          INSERT INTO material_reservations 
          (material_id, order_id, quantity, status, reason, expires_at)
          VALUES (?, ?, ?, 'reserved', ?, ?)
        `, materialId, orderId, quantity, reason, expiresAt.toISOString());
        break;
        
      case 'unreserve':
        // Отмена резерва
        await db.run(`
          UPDATE material_reservations 
          SET status = 'cancelled' 
          WHERE material_id = ? AND order_id = ? AND status = 'reserved'
        `, materialId, orderId);
        break;
        
      default:
        throw new Error(`Неизвестный тип операции: ${type}`);
    }
    
    // Записываем движение материала
    if (type !== 'reserve' && type !== 'unreserve') {
      const delta = newQuantity - oldQuantity;
      await db.run(`
        INSERT INTO material_moves 
        (materialId, delta, reason, orderId, user_id)
        VALUES (?, ?, ?, ?, ?)
      `, materialId, delta, reason, orderId, userId);
    }
    
    // Записываем в аудит
    await this.logOperation(db, {
      operationType: type,
      materialId,
      quantity,
      oldQuantity,
      newQuantity,
      reason,
      orderId,
      userId,
      metadata
    });
    
    return {
      success: true,
      materialId,
      oldQuantity,
      newQuantity,
      operation,
      timestamp: new Date().toISOString()
    };
  }

  // Логирование операции в аудит
  private static async logOperation(db: any, operation: {
    operationType: string;
    materialId: number;
    quantity: number;
    oldQuantity: number;
    newQuantity: number;
    reason: string;
    orderId?: number;
    userId?: number;
    metadata?: any;
  }) {
    await db.run(`
      INSERT INTO warehouse_audit_log 
      (operation_type, material_id, quantity, old_quantity, new_quantity, reason, order_id, user_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      operation.operationType,
      operation.materialId,
      operation.quantity,
      operation.oldQuantity,
      operation.newQuantity,
      operation.reason,
      operation.orderId,
      operation.userId,
      JSON.stringify(operation.metadata || {}),
      new Date().toISOString()
    );
  }

  // Безопасное списание материалов
  static async spendMaterial(materialId: number, quantity: number, reason: string, orderId?: number, userId?: number): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [{
      type: 'spend',
      materialId,
      quantity,
      reason,
      orderId,
      userId
    }];
    
    const results = await this.executeTransaction(operations);
    return results[0];
  }

  // Безопасное добавление материалов
  static async addMaterial(materialId: number, quantity: number, reason: string, orderId?: number, userId?: number): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [{
      type: 'add',
      materialId,
      quantity,
      reason,
      orderId,
      userId
    }];
    
    const results = await this.executeTransaction(operations);
    return results[0];
  }

  // Безопасная корректировка остатков
  static async adjustStock(materialId: number, newQuantity: number, reason: string, userId?: number): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [{
      type: 'adjust',
      materialId,
      quantity: newQuantity,
      reason,
      userId
    }];
    
    const results = await this.executeTransaction(operations);
    return results[0];
  }

  // Безопасное резервирование материалов
  static async reserveMaterials(reservations: Array<{
    materialId: number;
    quantity: number;
    orderId: number;
    reason: string;
  }>): Promise<TransactionResult[]> {
    const operations: TransactionOperation[] = reservations.map(reservation => ({
      type: 'reserve',
      materialId: reservation.materialId,
      quantity: reservation.quantity,
      orderId: reservation.orderId,
      reason: reservation.reason
    }));
    
    return await this.executeTransaction(operations);
  }

  // Отмена резерва
  static async unreserveMaterials(materialIds: number[], orderId: number): Promise<TransactionResult[]> {
    const operations: TransactionOperation[] = materialIds.map(materialId => ({
      type: 'unreserve',
      materialId,
      quantity: 0,
      reason: 'Отмена резерва',
      orderId
    }));
    
    return await this.executeTransaction(operations);
  }

  // Комплексная операция: резерв + списание
  static async reserveAndSpend(materialId: number, quantity: number, orderId: number, reason: string, userId?: number): Promise<TransactionResult[]> {
    const operations: TransactionOperation[] = [
      {
        type: 'reserve',
        materialId,
        quantity,
        orderId,
        reason: `Резерв: ${reason}`
      },
      {
        type: 'spend',
        materialId,
        quantity,
        reason: `Списание: ${reason}`,
        orderId,
        userId
      }
    ];
    
    return await this.executeTransaction(operations);
  }

  // Получение истории операций
  static async getOperationHistory(materialId?: number, orderId?: number, limit: number = 100): Promise<any[]> {
    const db = await getDb();
    
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (materialId) {
      whereClause += ' AND material_id = ?';
      params.push(materialId);
    }
    
    if (orderId) {
      whereClause += ' AND order_id = ?';
      params.push(orderId);
    }
    
    const operations = await db.all(`
      SELECT 
        wal.*,
        m.name as material_name,
        u.name as user_name
      FROM warehouse_audit_log wal
      LEFT JOIN materials m ON m.id = wal.material_id
      LEFT JOIN users u ON u.id = wal.user_id
      WHERE ${whereClause}
      ORDER BY wal.created_at DESC
      LIMIT ?
    `, ...params, limit);
    
    return operations;
  }

  // Проверка доступности материалов
  static async checkAvailability(materialRequirements: Array<{
    materialId: number;
    quantity: number;
  }>): Promise<{
    available: boolean;
    unavailable: Array<{
      materialId: number;
      required: number;
      available: number;
      shortfall: number;
    }>;
  }> {
    const db = await getDb();
    const unavailable: any[] = [];
    
    for (const requirement of materialRequirements) {
      const material = await db.get(
        'SELECT * FROM materials WHERE id = ?',
        requirement.materialId
      );
      
      if (!material) {
        unavailable.push({
          materialId: requirement.materialId,
          required: requirement.quantity,
          available: 0,
          shortfall: requirement.quantity
        });
        continue;
      }
      
      // Получаем зарезервированное количество
      const reserved = await db.get(`
        SELECT COALESCE(SUM(quantity), 0) as reserved
        FROM material_reservations 
        WHERE material_id = ? AND status = 'reserved' AND expires_at > datetime('now')
      `, requirement.materialId);
      
      const available = material.quantity - (reserved?.reserved || 0);
      
      if (available < requirement.quantity) {
        unavailable.push({
          materialId: requirement.materialId,
          required: requirement.quantity,
          available,
          shortfall: requirement.quantity - available
        });
      }
    }
    
    return {
      available: unavailable.length === 0,
      unavailable
    };
  }
}
