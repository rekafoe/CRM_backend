import { getDb } from '../config/database'
import { Material } from '../models'
import { WarehouseTransactionService } from './warehouseTransactionService'

export class MaterialService {
  static async getAllMaterials() {
    const db = await getDb()
    const allMats = await db.all<Material & { sheet_price_single: number | null }>(
      `SELECT 
        m.id, m.name, m.unit, m.quantity, m.min_quantity as min_quantity, m.sheet_price_single,
        m.category_id, c.name as category_name, c.color as category_color,
        m.supplier_id, s.name as supplier_name, s.contact_person as supplier_contact,
        m.paper_type_id, pt.display_name as paper_type_name, m.density
       FROM materials m
       LEFT JOIN material_categories c ON c.id = m.category_id
       LEFT JOIN suppliers s ON s.id = m.supplier_id
       LEFT JOIN paper_types pt ON pt.id = m.paper_type_id
       ORDER BY c.name, m.name`
    ) as any
    
    // Добавляем поля для резервирования и совместимости с фронтендом
    const result = await Promise.all(allMats.map(async (material: any) => {
      // Получаем резервированное количество из таблицы material_reservations
      const reservedQuery = `
        SELECT COALESCE(SUM(quantity), 0) as reserved_quantity
        FROM material_reservations 
        WHERE material_id = ? AND status = 'reserved'
      `;
      
      let reserved_quantity = 0;
      try {
        const reservedResult = await db.get(reservedQuery, material.id) as any;
        reserved_quantity = reservedResult?.reserved_quantity || 0;
      } catch (error) {
        // Если таблица не существует, игнорируем ошибку
        console.warn('Material reservations table not found, using 0 for reserved quantity');
      }
      
      const available_quantity = Math.max(0, (material.quantity || 0) - reserved_quantity);
      
      return {
        ...material,
        price: material.sheet_price_single || 0,
        reserved_quantity,
        available_quantity
      };
    }));
    
    return result;
  }

  static async createOrUpdateMaterial(material: Material & { sheet_price_single?: number | null }) {
    console.log('=== СОЗДАНИЕ/ОБНОВЛЕНИЕ МАТЕРИАЛА ===');
    console.log('Данные материала:', JSON.stringify(material, null, 2));
    const db = await getDb()
    try {
      console.log('🔍 Начинаем проверки...');
      // Определяем цену: приоритет у sheet_price_single, затем price
      const price = material.sheet_price_single ?? (material as any).price ?? null;
      
      // Проверяем существование поставщика
      if (material.supplier_id) {
        const supplier = await db.get('SELECT id, name FROM suppliers WHERE id = ?', material.supplier_id);
        if (!supplier) {
          console.error(`❌ Поставщик с ID ${material.supplier_id} не найден`);
          const err: any = new Error(`Поставщик с ID ${material.supplier_id} не найден`);
          err.status = 400;
          throw err;
        }
        console.log(`✅ Поставщик найден: ${supplier.name} (ID: ${supplier.id})`);
      }
      
      // Проверяем существование категории
      if (material.category_id) {
        console.log(`🔍 Проверяем категорию с ID: ${material.category_id}`);
        const category = await db.get('SELECT id, name FROM material_categories WHERE id = ?', material.category_id);
        if (!category) {
          console.error(`❌ Категория с ID ${material.category_id} не найдена`);
          const err: any = new Error(`Категория с ID ${material.category_id} не найдена`);
          err.status = 400;
          throw err;
        }
        console.log(`✅ Категория найдена: ${category.name} (ID: ${category.id})`);
      } else {
        console.log('ℹ️ category_id не указан, пропускаем проверку');
      }
      
      if (material.id) {
        // Проверяем, существуют ли поля paper_type_id и density
        const tableInfo = await db.all("PRAGMA table_info(materials)");
        const hasExtraFields = tableInfo.some((col: any) => col.name === 'paper_type_id') && 
                               tableInfo.some((col: any) => col.name === 'density');
        
        // Получаем min_quantity из min_quantity (совместимость с фронтендом)
        const minQuantity = (material as any).min_quantity ?? material.min_quantity ?? null;
        
        if (hasExtraFields) {
          await db.run(
            'UPDATE materials SET name = ?, unit = ?, quantity = ?, min_quantity = ?, sheet_price_single = ?, category_id = ?, supplier_id = ?, paper_type_id = ?, density = ?, description = ? WHERE id = ?',
            material.name,
            material.unit,
            material.quantity,
            minQuantity,
            price,
            material.category_id ?? null,
            material.supplier_id ?? null,
            (material as any).paper_type_id ?? null,
            (material as any).density ?? null,
            (material as any).description ?? null,
            material.id
          )
        } else {
          await db.run(
            'UPDATE materials SET name = ?, unit = ?, quantity = ?, min_quantity = ?, sheet_price_single = ?, category_id = ?, supplier_id = ?, description = ? WHERE id = ?',
            material.name,
            material.unit,
            material.quantity,
            minQuantity,
            price,
            material.category_id ?? null,
            material.supplier_id ?? null,
            (material as any).description ?? null,
            material.id
          )
        }
      } else {
        console.log('🆕 Создаем новый материал (material.id не указан)');
        // Проверяем, существуют ли поля paper_type_id и density
        const tableInfo = await db.all("PRAGMA table_info(materials)");
        const hasExtraFields = tableInfo.some((col: any) => col.name === 'paper_type_id') && 
                               tableInfo.some((col: any) => col.name === 'density');
        
        // Проверяем, есть ли поле description
        const hasDescription = tableInfo.some((col: any) => col.name === 'description');
        const hasMaxStock = tableInfo.some((col: any) => col.name === 'max_stock_level');
        
        console.log('📋 Поля в таблице materials:', tableInfo.map((col: any) => col.name));
        console.log('🔧 hasExtraFields:', hasExtraFields);
        console.log('📝 hasDescription:', hasDescription);
        console.log('📊 hasMaxStock:', hasMaxStock);
        
        if (hasExtraFields && hasDescription) {
          console.log('💾 Выполняем INSERT с полными полями (hasExtraFields && hasDescription)');
          await db.run(
            'INSERT INTO materials (name, unit, quantity, min_quantity, sheet_price_single, category_id, supplier_id, paper_type_id, density, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            material.name,
            material.unit,
            material.quantity,
            material.min_quantity ?? null,
            price,
            material.category_id ?? null,
            material.supplier_id ?? null,
            (material as any).paper_type_id ?? null,
            (material as any).density ?? null,
            (material as any).description ?? null
          )
        } else if (hasExtraFields) {
          await db.run(
            'INSERT INTO materials (name, unit, quantity, min_quantity, sheet_price_single, category_id, supplier_id, paper_type_id, density) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            material.name,
            material.unit,
            material.quantity,
            material.min_quantity ?? null,
            price,
            material.category_id ?? null,
            material.supplier_id ?? null,
            (material as any).paper_type_id ?? null,
            (material as any).density ?? null
          )
        } else if (hasDescription) {
          await db.run(
            'INSERT INTO materials (name, unit, quantity, min_quantity, sheet_price_single, category_id, supplier_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            material.name,
            material.unit,
            material.quantity,
            material.min_quantity ?? null,
            price,
            material.category_id ?? null,
            material.supplier_id ?? null,
            (material as any).description ?? null
          )
        } else {
          await db.run(
            'INSERT INTO materials (name, unit, quantity, min_quantity, sheet_price_single, category_id, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            material.name,
            material.unit,
            material.quantity,
            material.min_quantity ?? null,
            price,
            material.category_id ?? null,
            material.supplier_id ?? null
          )
        }
      }
    } catch (e: any) {
      console.error('Ошибка при создании/обновлении материала:', e);
      console.error('Детали ошибки:', {
        message: e.message,
        code: e.code,
        errno: e.errno,
        sql: e.sql
      });
      
      if (e && typeof e.message === 'string' && e.message.includes('UNIQUE constraint failed: materials.name')) {
        const err: any = new Error('Материал с таким именем уже существует')
        err.status = 409
        throw err
      }
      throw e
    }
    
    const allMats = await db.all<Material & { sheet_price_single: number | null }>(
      `SELECT 
        m.id, m.name, m.unit, m.quantity, m.min_quantity as min_quantity, m.sheet_price_single,
        m.category_id, c.name as category_name, c.color as category_color,
        m.supplier_id, s.name as supplier_name, s.contact_person as supplier_contact,
        m.paper_type_id, pt.display_name as paper_type_name, m.density
       FROM materials m
       LEFT JOIN material_categories c ON c.id = m.category_id
       LEFT JOIN suppliers s ON s.id = m.supplier_id
       LEFT JOIN paper_types pt ON pt.id = m.paper_type_id
       ORDER BY c.name, m.name`
    ) as any
    
        // Добавляем поля для резервирования и совместимости с фронтендом
        const result = await Promise.all(allMats.map(async (material: any) => {
          // Получаем резервированное количество из таблицы material_reservations
          const reservedQuery = `
            SELECT COALESCE(SUM(quantity), 0) as reserved_quantity
            FROM material_reservations 
            WHERE material_id = ? AND status = 'reserved'
          `;
          
          let reserved_quantity = 0;
          try {
            const reservedResult = await db.get(reservedQuery, material.id) as any;
            reserved_quantity = reservedResult?.reserved_quantity || 0;
          } catch (error) {
            // Если таблица не существует, игнорируем ошибку
            console.warn('Material reservations table not found, using 0 for reserved quantity');
          }
          
          const available_quantity = Math.max(0, (material.quantity || 0) - reserved_quantity);
          
          return {
            ...material,
            price: material.sheet_price_single || 0,
            reserved_quantity,
            available_quantity
          };
        }));
    
    return result;
  }

  static async updateMaterial(id: number, material: Material & { sheet_price_single?: number | null }) {
    const db = await getDb()
    try {
      console.log('=== ОБНОВЛЕНИЕ МАТЕРИАЛА ===');
      console.log('ID:', id);
      console.log('Данные материала:', JSON.stringify(material, null, 2));
      
      // Определяем цену: приоритет у sheet_price_single, затем price
      const price = material.sheet_price_single ?? (material as any).price ?? null;
      
      // Проверяем, существуют ли поля paper_type_id и density
      const tableInfo = await db.all("PRAGMA table_info(materials)");
      const hasExtraFields = tableInfo.some((col: any) => col.name === 'paper_type_id') && 
                             tableInfo.some((col: any) => col.name === 'density');
      
      // Получаем min_quantity из min_quantity (совместимость с фронтендом)
      const minQuantity = (material as any).min_quantity ?? material.min_quantity ?? null;
      
      if (hasExtraFields) {
        await db.run(
          'UPDATE materials SET name = ?, unit = ?, quantity = ?, min_quantity = ?, sheet_price_single = ?, category_id = ?, supplier_id = ?, paper_type_id = ?, density = ?, description = ? WHERE id = ?',
          material.name,
          material.unit,
          material.quantity,
          minQuantity,
          price,
          material.category_id ?? null,
          material.supplier_id ?? null,
          (material as any).paper_type_id ?? null,
          (material as any).density ?? null,
          (material as any).description ?? null,
          id
        )
      } else {
        await db.run(
          'UPDATE materials SET name = ?, unit = ?, quantity = ?, min_quantity = ?, sheet_price_single = ?, category_id = ?, supplier_id = ?, description = ? WHERE id = ?',
          material.name,
          material.unit,
          material.quantity,
          minQuantity,
          price,
          material.category_id ?? null,
          material.supplier_id ?? null,
          (material as any).description ?? null,
          id
        )
      }
      
      // Получаем обновленный материал
      const updatedMaterial = await db.get<Material>(
        `SELECT 
          m.id, m.name, m.unit, m.quantity, m.min_quantity, m.sheet_price_single,
          m.category_id, c.name as category_name, c.color as category_color,
          m.supplier_id, s.name as supplier_name, s.contact_person as supplier_contact,
          m.paper_type_id, pt.display_name as paper_type_name, m.density
         FROM materials m
         LEFT JOIN material_categories c ON c.id = m.category_id
         LEFT JOIN suppliers s ON s.id = m.supplier_id
         LEFT JOIN paper_types pt ON pt.id = m.paper_type_id
         WHERE m.id = ?`,
        id
      )
      
      // Добавляем поле price для совместимости с фронтендом
      return {
        ...updatedMaterial,
        price: updatedMaterial?.sheet_price_single || 0
      };
    } catch (e: any) {
      if (e && typeof e.message === 'string' && e.message.includes('UNIQUE constraint failed: materials.name')) {
        const err: any = new Error('Материал с таким именем уже существует')
        err.status = 400
        throw err
      }
      throw e
    }
  }

  static async deleteMaterial(id: number) {
    const db = await getDb()
    await db.run('DELETE FROM materials WHERE id = ?', id)
  }

  static async getLowStockMaterials() {
    const db = await getDb()
    const rows = await db.all<any>(`SELECT id, name, unit, quantity, min_quantity as min_quantity FROM materials WHERE min_quantity IS NOT NULL AND quantity <= min_quantity ORDER BY name`)
    return rows
  }

  static async getMaterialMoves(filters: {
    materialId?: number;
    user_id?: number;
    orderId?: number;
    from?: string;
    to?: string;
    categoryId?: number;
    supplierId?: number;
    reason?: string;
    limit?: number;
    offset?: number;
  }) {
    const { materialId, user_id, orderId, from, to, categoryId, supplierId, reason, limit, offset } = filters
    const where: string[] = []
    const params: any[] = []
    
    if (materialId) { where.push('mm.materialId = ?'); params.push(Number(materialId)) }
    if (user_id) { where.push('mm.user_id = ?'); params.push(Number(user_id)) }
    if (orderId) { where.push('mm.orderId = ?'); params.push(Number(orderId)) }
    if (from) { where.push('mm.created_at >= ?'); params.push(String(from)) }
    if (to) { where.push('mm.created_at <= ?'); params.push(String(to)) }
    if (categoryId) { where.push('m.category_id = ?'); params.push(Number(categoryId)) }
    if (supplierId) { where.push('m.supplier_id = ?'); params.push(Number(supplierId)) }
    if (reason) { where.push('mm.reason LIKE ?'); params.push(`%${reason}%`) }
    
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limitSql = limit ? `LIMIT ${limit}` : ''
    const offsetSql = offset ? `OFFSET ${offset}` : ''
    
    const db = await getDb()
    const rows = await db.all<any>(
      `SELECT 
        mm.id, mm.materialId, m.name as material_name, mm.delta, mm.reason, 
        mm.orderId, mm.user_id, u.name as user_name, mm.created_at,
        c.name as category_name, s.name as supplier_name
       FROM material_moves mm
       JOIN materials m ON m.id = mm.materialId
       LEFT JOIN users u ON u.id = mm.user_id
       LEFT JOIN material_categories c ON c.id = m.category_id
       LEFT JOIN suppliers s ON s.id = m.supplier_id
      ${whereSql}
      ORDER BY mm.created_at DESC, mm.id DESC
      ${limitSql} ${offsetSql}`,
      ...params
    )
    return rows
  }

  static async getMaterialMovesStats(filters: {
    materialId?: number;
    user_id?: number;
    orderId?: number;
    from?: string;
    to?: string;
    categoryId?: number;
    supplierId?: number;
  }) {
    const { materialId, user_id, orderId, from, to, categoryId, supplierId } = filters
    const where: string[] = []
    const params: any[] = []
    
    if (materialId) { where.push('mm.materialId = ?'); params.push(Number(materialId)) }
    if (user_id) { where.push('mm.user_id = ?'); params.push(Number(user_id)) }
    if (orderId) { where.push('mm.orderId = ?'); params.push(Number(orderId)) }
    if (from) { where.push('mm.created_at >= ?'); params.push(String(from)) }
    if (to) { where.push('mm.created_at <= ?'); params.push(String(to)) }
    if (categoryId) { where.push('m.category_id = ?'); params.push(Number(categoryId)) }
    if (supplierId) { where.push('m.supplier_id = ?'); params.push(Number(supplierId)) }
    
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const db = await getDb()
    
    const stats = await db.get<{
      total_moves: number;
      total_incoming: number;
      total_outgoing: number;
      unique_materials: number;
      unique_users: number;
    }>(
      `SELECT 
        COUNT(*) as total_moves,
        SUM(CASE WHEN mm.delta > 0 THEN mm.delta ELSE 0 END) as total_incoming,
        SUM(CASE WHEN mm.delta < 0 THEN ABS(mm.delta) ELSE 0 END) as total_outgoing,
        COUNT(DISTINCT mm.materialId) as unique_materials,
        COUNT(DISTINCT mm.user_id) as unique_users
       FROM material_moves mm
       JOIN materials m ON m.id = mm.materialId
      ${whereSql}`,
      ...params
    )
    return stats
  }

  // УСТАРЕВШИЙ МЕТОД - используйте WarehouseTransactionService
  static async spendMaterial(materialId: number, delta: number, reason?: string, orderId?: number, userId?: number) {
    console.warn('⚠️ MaterialService.spendMaterial устарел. Используйте WarehouseTransactionService.spendMaterial');
    
    // Если delta отрицательный - это списание, если положительный - поступление
    if (delta < 0) {
      return await WarehouseTransactionService.spendMaterial(
        materialId, 
        Math.abs(delta), 
        reason || 'Списание материала', 
        orderId, 
        userId
      );
    } else {
      return await WarehouseTransactionService.addMaterial(
        materialId, 
        delta, 
        reason || 'Поступление материала', 
        orderId, 
        userId
      );
    }
  }

  // Новый безопасный метод списания
  static async safeSpendMaterial(materialId: number, quantity: number, reason: string, orderId?: number, userId?: number) {
    return await WarehouseTransactionService.spendMaterial(materialId, quantity, reason, orderId, userId);
  }

  // Новый безопасный метод добавления
  static async safeAddMaterial(materialId: number, quantity: number, reason: string, orderId?: number, userId?: number) {
    return await WarehouseTransactionService.addMaterial(materialId, quantity, reason, orderId, userId);
  }

  // Новый безопасный метод корректировки
  static async safeAdjustStock(materialId: number, newQuantity: number, reason: string, userId?: number) {
    return await WarehouseTransactionService.adjustStock(materialId, newQuantity, reason, userId);
  }
}
