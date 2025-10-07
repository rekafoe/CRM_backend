import { getDb } from '../config/database'
import { PricingService } from './pricingService'
// import { FLYERS_UP_ON_SRA3, getQtyDiscountK } from '../utils/calculators' // MOVED TO ARCHIVE
// Временно используем локальные константы
const FLYERS_UP_ON_SRA3 = { A6: 8, A5: 4, A4: 2 };
const getQtyDiscountK = (qty: number) => qty >= 1000 ? 0.8 : qty >= 500 ? 0.85 : qty >= 100 ? 0.9 : 1;

export class EnhancedCalculatorService {
  // Расширенный расчет цен для листовок с использованием новой политики ценообразования
  static async calculateFlyersPrice(params: {
    format: 'A6'|'A5'|'A4';
    qty: number;
    sides: 1|2;
    paperDensity: 130|150;
    lamination: 'none'|'matte'|'glossy';
    priceType?: 'rush'|'online'|'promo';
    customerType?: 'regular'|'vip';
  }) {
    const { format, qty, sides, paperDensity, lamination, priceType, customerType } = params
    
    if (!format || !qty || !sides) {
      throw new Error('format, qty, sides обязательны')
    }

    // Используем новую политику ценообразования
    const pricing = await PricingService.calculateProductPrice({
      productType: 'Листовки',
      productName: `Листовки ${format}`,
      quantity: qty,
      specifications: {
        format,
        sides,
        paperDensity,
        lamination,
        magnetic: false
      },
      pricingType: priceType || 'online',
      customerType: customerType || 'regular'
    })

    // Рассчитываем количество листов SRA3 для совместимости с существующим кодом
    const up = FLYERS_UP_ON_SRA3[format] || 8
    const sra3PerItem = 1 / up
    const wasteRatio = 0.02
    const totalSheets = Math.ceil(qty * sra3PerItem * (1 + wasteRatio))

    // Получаем ID материалов для компонентов
    const paperId = await this.getMaterialIdByDensity(paperDensity)
    const components: Array<{ materialId: number; qtyPerItem: number }> = []
    
    if (paperId) {
      components.push({ 
        materialId: paperId, 
        qtyPerItem: sra3PerItem * (1 + wasteRatio) 
      })
    }

    // Добавляем ламинацию если нужно
    if (lamination && lamination !== 'none') {
      const lamId = await this.getLaminationMatId(lamination)
      if (lamId) {
        components.push({ 
          materialId: lamId, 
          qtyPerItem: sra3PerItem * (1 + wasteRatio) 
        })
      }
    }

    return {
      pricePerItem: pricing.finalPrice / qty,
      totalPrice: pricing.finalPrice,
      totalSheets,
      components,
      derived: { 
        up, 
        sra3PerItem, 
        wasteRatio, 
        discountK: getQtyDiscountK(qty),
        pricingDetails: pricing
      }
    }
  }

  // Расчет цен для визиток
  static async calculateBusinessCardsPrice(params: {
    qty: number;
    lamination: 'none'|'matte'|'glossy';
    magnetic: boolean;
    priceType?: 'rush'|'online'|'promo';
    customerType?: 'regular'|'vip';
  }) {
    const { qty, lamination, magnetic, priceType, customerType } = params
    
    if (!qty) {
      throw new Error('qty обязателен')
    }

    const productName = magnetic ? 'Визитки магнитные' : 
                       lamination !== 'none' ? 'Визитки ламинированные' : 
                       'Визитки стандартные'

    const pricing = await PricingService.calculateProductPrice({
      productType: 'Визитки',
      productName,
      quantity: qty,
      specifications: {
        lamination,
        magnetic,
        roundCorners: true,
        format: 'стандартные'
      },
      pricingType: priceType || 'online',
      customerType: customerType || 'regular'
    })

    // Рассчитываем компоненты
    const components: Array<{ materialId: number; qtyPerItem: number }> = []
    
    // Бумага 300г/м² для визиток
    const paperId = await this.getMaterialIdByDensity(300)
    if (paperId) {
      components.push({ 
        materialId: paperId, 
        qtyPerItem: 0.24 // 24 визитки на лист SRA3
      })
    }

    // Ламинация если нужно
    if (lamination && lamination !== 'none') {
      const lamId = await this.getLaminationMatId(lamination)
      if (lamId) {
        components.push({ 
          materialId: lamId, 
          qtyPerItem: 0.1
        })
      }
    }

    return {
      pricePerItem: pricing.finalPrice / qty,
      totalPrice: pricing.finalPrice,
      totalSheets: Math.ceil(qty / 10),
      components,
      derived: { 
        pricingDetails: pricing
      }
    }
  }

  // Расчет цен для буклетов
  static async calculateBookletsPrice(params: {
    format: 'A4'|'A5';
    pages: number;
    qty: number;
    priceType?: 'rush'|'online'|'promo';
    customerType?: 'regular'|'vip';
  }) {
    const { format, pages, qty, priceType, customerType } = params
    
    if (!format || !pages || !qty) {
      throw new Error('format, pages, qty обязательны')
    }

    const productName = `Буклеты ${format} ${pages}стр`

    const pricing = await PricingService.calculateProductPrice({
      productType: 'Буклеты',
      productName,
      quantity: qty,
      specifications: {
        format,
        pages
      },
      pricingType: priceType || 'online',
      customerType: customerType || 'regular'
    })

    // Рассчитываем компоненты
    const components: Array<{ materialId: number; qtyPerItem: number }> = []
    
    // Бумага 130г/м² для буклетов
    const paperId = await this.getMaterialIdByDensity(130)
    if (paperId) {
      const sheetsPerItem = Math.ceil(pages / 4) // 4 страницы на лист SRA3
      components.push({ 
        materialId: paperId, 
        qtyPerItem: sheetsPerItem * 1.02 // +2% на отходы
      })
    }

    return {
      pricePerItem: pricing.finalPrice / qty,
      totalPrice: pricing.finalPrice,
      totalSheets: Math.ceil(qty * Math.ceil(pages / 4) * 1.02),
      components,
      derived: { 
        pricingDetails: pricing
      }
    }
  }

  // Получить ID материала по плотности
  private static async getMaterialIdByDensity(d: number): Promise<number | undefined> {
    const db = await getDb()
    let name: string
    
    if (d >= 300) {
      name = 'Бумага NEVIA SRA3 300г/м²'
    } else if (d >= 200) {
      name = 'Бумага NEVIA SRA3 200г/м²'
    } else if (d >= 150) {
      name = 'Бумага NEVIA SRA3 150г/м²'
    } else {
      name = 'Бумага NEVIA SRA3 128г/м²'
    }
    
    const result = await db.get<{ id: number }>('SELECT id FROM materials WHERE name = ?', name)
    return (result as any)?.id
  }

  // Получить ID материала ламинации
  private static async getLaminationMatId(type: string): Promise<number | undefined> {
    const db = await getDb()
    const name = type === 'glossy' ? 
      'Плёнка ламинации глянцевая 35 мкм, SRA3' : 
      'Плёнка ламинации матовая 35 мкм, SRA3'
    const result = await db.get<{ id: number }>('SELECT id FROM materials WHERE name = ?', name)
    return (result as any)?.id
  }

  // Получить все доступные типы продуктов
  static async getAvailableProductTypes() {
    return [
      {
        type: 'Листовки',
        name: 'Листовки',
        description: 'Рекламные листовки различных форматов',
        formats: ['A6', 'A5', 'A4'],
        paperDensities: [128, 130, 150],
        laminations: ['none', 'matte', 'glossy']
      },
      {
        type: 'Визитки',
        name: 'Визитки',
        description: 'Деловые визитки',
        formats: ['стандартные'],
        laminations: ['none', 'matte', 'glossy'],
        magnetic: [true, false]
      },
      {
        type: 'Буклеты',
        name: 'Буклеты',
        description: 'Рекламные буклеты и каталоги',
        formats: ['A4', 'A5'],
        pages: [4, 8, 12, 16, 20, 24]
      }
    ]
  }

  // Получить политику ценообразования
  static async getPricingPolicy() {
    return await PricingService.getPricingPolicy()
  }
}
