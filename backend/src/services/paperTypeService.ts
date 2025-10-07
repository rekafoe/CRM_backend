import { getDb } from '../config/database'

export interface PaperType {
  id: number
  name: string
  display_name: string
  search_keywords: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PrintingPrice {
  id: number
  paper_type_id: number
  density: number
  price: number
  created_at: string
  updated_at: string
}

export interface Material {
  id: number
  name: string
  category_id: number
  paper_type_id?: number
  density?: number
  sheet_price_single?: number
  price?: number
  quantity: number
  min_quantity: number
  max_stock_level: number
  unit: string
  supplier: string
  created_at: string
  updated_at: string
}

export interface PaperTypeWithMaterials extends PaperType {
  materials: Material[]
  prices: { [density: number]: number } // Для обратной совместимости
}

export class PaperTypeService {
  // Получить все типы бумаги с материалами и ценами
  static async getAllPaperTypes(): Promise<PaperTypeWithMaterials[]> {
    const db = await getDb()
    
    const paperTypes = await db.all<PaperType>(
      'SELECT * FROM paper_types ORDER BY display_name'
    ) as unknown as PaperType[]
    
    console.log('Найдено типов бумаги:', paperTypes.length)
    
    // Загружаем материалы для каждого типа бумаги
    const paperTypesWithMaterials = await Promise.all(
      paperTypes.map(async (paperType: any) => {
        // Получаем материалы, связанные с этим типом бумаги
        const materials = await db.all<Material>(
          `SELECT m.*, c.name as category_name 
           FROM materials m 
           LEFT JOIN material_categories c ON m.category_id = c.id 
           WHERE m.paper_type_id = ? 
           ORDER BY m.density`,
          paperType.id
        ) as unknown as Material[]
        
        console.log(`Материалы для ${paperType.display_name}:`, materials)
        
        // Создаем объект цен из материалов для обратной совместимости
        const pricesObject = materials.reduce((acc: any, material: any) => {
          if (material.density && (material.sheet_price_single || material.price)) {
            acc[material.density] = material.sheet_price_single || material.price
          }
          return acc
        }, {} as { [density: number]: number })
        
        console.log(`Цены из материалов для ${paperType.display_name}:`, pricesObject)
        
        return {
          ...paperType,
          materials: materials,
          prices: pricesObject // Для обратной совместимости
        }
      })
    )
    
    console.log('Итоговые данные с материалами:', paperTypesWithMaterials)
    return paperTypesWithMaterials
  }

  // Получить тип бумаги с материалами
  static async getPaperTypeWithMaterials(paperTypeId: number): Promise<PaperTypeWithMaterials | null> {
    const db = await getDb()
    
    const paperType = await db.get<PaperType>(
      'SELECT * FROM paper_types WHERE id = ? AND is_active = 1',
      paperTypeId
    )
    
    if (!paperType) return null
    
    // Получаем материалы, связанные с этим типом бумаги
    const materials = await db.all<Material>(
      `SELECT m.*, c.name as category_name 
       FROM materials m 
       LEFT JOIN material_categories c ON m.category_id = c.id 
       WHERE m.paper_type_id = ? 
       ORDER BY m.density`,
      paperTypeId
    ) as unknown as Material[]
    
    // Создаем объект цен из материалов для обратной совместимости
    const pricesObject = materials.reduce((acc: any, material: any) => {
      if (material.density && (material.sheet_price_single || material.price)) {
        acc[material.density] = material.sheet_price_single || material.price
      }
      return acc
    }, {} as { [density: number]: number })
    
    return {
      ...paperType,
      materials: materials,
      prices: pricesObject
    }
  }

  // Получить все типы бумаги с материалами (алиас для getAllPaperTypes)
  static async getAllPaperTypesWithMaterials(): Promise<PaperTypeWithMaterials[]> {
    return this.getAllPaperTypes()
  }

  // Создать новый тип бумаги
  static async createPaperType(paperType: Omit<PaperType, 'id' | 'created_at' | 'updated_at'>): Promise<PaperType> {
    const db = await getDb()
    
    const result = await db.run(
      'INSERT INTO paper_types (name, display_name, search_keywords, is_active) VALUES (?, ?, ?, ?)',
      paperType.name,
      paperType.display_name,
      paperType.search_keywords,
      paperType.is_active
    )
    
    const newPaperType = await db.get<PaperType>(
      'SELECT * FROM paper_types WHERE id = ?',
      result.lastID
    )
    
    return newPaperType!
  }

  // Обновить тип бумаги
  static async updatePaperType(id: number, paperType: Partial<Omit<PaperType, 'id' | 'created_at' | 'updated_at'>>): Promise<PaperType> {
    const db = await getDb()
    
    const fields = Object.keys(paperType).map(key => `${key} = ?`).join(', ')
    const values = Object.values(paperType)
    
    await db.run(
      `UPDATE paper_types SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ...values,
      id
    )
    
    const updatedPaperType = await db.get<PaperType>(
      'SELECT * FROM paper_types WHERE id = ?',
      id
    )
    
    return updatedPaperType!
  }

  // Удалить тип бумаги (физическое удаление с каскадным удалением связанных данных)
  static async deletePaperType(id: number): Promise<void> {
    const db = await getDb()
    
    try {
      // Временно отключаем проверку внешних ключей
      await db.run('PRAGMA foreign_keys = OFF')
      
      // Удаляем из других таблиц, которые могут ссылаться на paper_types
      await db.run(
        'DELETE FROM printing_prices WHERE paper_type_id = ?',
        id
      )
      
      // Затем удаляем сам тип бумаги
      await db.run(
        'DELETE FROM paper_types WHERE id = ?',
        id
      )
      
      // Включаем обратно проверку внешних ключей
      await db.run('PRAGMA foreign_keys = ON')
    } catch (error) {
      // Включаем обратно проверку внешних ключей в случае ошибки
      await db.run('PRAGMA foreign_keys = ON')
      throw error
    }
  }

  // Добавить материал к типу бумаги
  static async addMaterialToPaperType(paperTypeId: number, materialId: number): Promise<void> {
    const db = await getDb()
    
    await db.run(
      'UPDATE materials SET paper_type_id = ? WHERE id = ?',
      paperTypeId,
      materialId
    )
  }

  // Удалить связь материала с типом бумаги
  static async removeMaterialFromPaperType(materialId: number): Promise<void> {
    const db = await getDb()
    
    await db.run(
      'UPDATE materials SET paper_type_id = NULL WHERE id = ?',
      materialId
    )
  }

  // Найти тип бумаги по ключевым словам в названии материала
  static async findPaperTypeByMaterialName(materialName: string): Promise<PaperType | null> {
    const db = await getDb()
    
    const paperTypes = await this.getAllPaperTypes()
    
    for (const paperType of paperTypes) {
      const keywords = paperType.search_keywords.split(',').map(k => k.trim().toLowerCase())
      
      for (const keyword of keywords) {
        if (materialName.toLowerCase().includes(keyword)) {
          return paperType
        }
      }
    }
    
    return null
  }

  // Получить цену материала для типа бумаги и плотности
  static async getMaterialPrice(paperTypeId: number, density: number): Promise<number | null> {
    const db = await getDb()
    
    const material = await db.get<Material>(
      'SELECT sheet_price_single, price FROM materials WHERE paper_type_id = ? AND density = ?',
      paperTypeId,
      density
    )
    
    return material?.sheet_price_single || material?.price || null
  }
}

