import { getDb } from '../config/database'

export interface PricingTier {
  id: string
  name: string
  description: string
  deliveryTime: 'urgent' | 'online' | 'promo'
  multiplier: number
  minOrder: number
  maxOrder?: number
  isActive: boolean
}

export interface ProductPricing {
  id: string
  productType: string
  productName: string
  basePrice: number
  pricingTiers: PricingTier[]
  materials: {
    materialId: string
    materialName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  services: {
    serviceId: string
    serviceName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  totalCost: number
  markup: number
  finalPrice: number
}

export interface PricingPolicy {
  id: string
  name: string
  description: string
  isActive: boolean
      tiers: {
        rush: PricingTier
        online: PricingTier
        promo: PricingTier
      }
  markups: {
    materials: number
    services: number
    labor: number
  }
  discounts: {
    volume: {
      minQuantity: number
      discountPercent: number
    }[]
    loyalty: {
      customerType: string
      discountPercent: number
    }[]
  }
}

export class PricingService {
  // Базовые цены на основе анализа karandash.by
  private static readonly BASE_PRICES = {
    // Листовки (за штуку)
    flyers: {
      A6: { urgent: 0.15, online: 0.10, promo: 0.07 },
      A5: { urgent: 0.25, online: 0.18, promo: 0.12 },
      A4: { urgent: 0.40, online: 0.30, promo: 0.20 }
    },
    // Визитки (за штуку)
    business_cards: {
      standard: { urgent: 0.35, online: 0.25, promo: 0.18 },
      laminated: { urgent: 0.45, online: 0.35, promo: 0.25 },
      magnetic: { urgent: 0.60, online: 0.45, promo: 0.35 }
    },
    // Буклеты (за штуку)
    booklets: {
      A4_4page: { urgent: 0.80, online: 0.60, promo: 0.45 },
      A4_8page: { urgent: 1.20, online: 0.90, promo: 0.70 },
      A5_4page: { urgent: 0.50, online: 0.40, promo: 0.30 }
    }
  }

  // Материалы и их базовые цены
  private static readonly MATERIAL_PRICES = {
    'Бумага NEVIA SRA3 128г/м²': 0.05, // за лист
    'Бумага NEVIA SRA3 150г/м²': 0.06, // за лист
    'Бумага NEVIA SRA3 200г/м²': 0.08, // за лист
    'Бумага NEVIA SRA3 300г/м²': 0.12, // за лист
    'Краска черная': 0.15, // за мл
    'Краска цветная': 0.15, // за мл
    'Плёнка ламинации матовая 35 мкм, SRA3': 0.03, // за лист
    'Плёнка ламинации глянцевая 35 мкм, SRA3': 0.03 // за лист
  }

  // Услуги и их базовые цены
  private static readonly SERVICE_PRICES = {
    'Печать цифровая': 0.03, // за лист
    'Резка': 0.01, // за рез
    'Биговка': 0.01, // за линию
    'Скругление углов': 0.02, // за угол
    'Ламинация матовая': 0.05, // за лист
    'Ламинация глянцевая': 0.05, // за лист
    'Сшивка': 0.10, // за штуку
    'Расшивка': 0.10 // за штуку
  }

  // Коэффициенты для разных типов ценообразования
  private static readonly PRICING_MULTIPLIERS = {
    rush: 1.5,    // Срочно - +50%
    online: 1.0,  // Онлайн - базовая цена
    promo: 0.7    // Акция - -30%
  }

  // Наценки на материалы и услуги
  private static readonly MARKUPS = {
    materials: 1.3, // +30% на материалы
    services: 1.5,  // +50% на услуги
    labor: 1.2      // +20% на труд
  }

  // Скидки по объему
  private static readonly VOLUME_DISCOUNTS = [
    { minQuantity: 1000, discountPercent: 10 },
    { minQuantity: 5000, discountPercent: 20 },
    { minQuantity: 10000, discountPercent: 30 }
  ]

  static async calculateProductPrice(params: {
    productType: string
    productName: string
    quantity: number
    specifications: {
      format?: string
      sides?: number
      paperDensity?: number
      lamination?: string
      pages?: number
      magnetic?: boolean
      roundCorners?: boolean
    }
    pricingType: 'rush' | 'online' | 'promo'
    customerType?: 'regular' | 'vip'
  }): Promise<ProductPricing> {
    const { productType, productName, quantity, specifications, pricingType, customerType } = params

    // Получаем базовую цену
    const basePrice = this.getBasePrice(productType, productName, specifications)
    
    // Применяем коэффициент типа ценообразования
    const tierMultiplier = this.PRICING_MULTIPLIERS[pricingType as keyof typeof this.PRICING_MULTIPLIERS]
    const adjustedPrice = basePrice * tierMultiplier

    // Рассчитываем материалы
    const materials = await this.calculateMaterials(productType, specifications, quantity)
    
    // Рассчитываем услуги
    const services = await this.calculateServices(productType, specifications, quantity)

    // Общая стоимость материалов и услуг
    const materialsCost = materials.reduce((sum, m) => sum + m.totalPrice, 0)
    const servicesCost = services.reduce((sum, s) => sum + s.totalPrice, 0)
    const totalCost = materialsCost + servicesCost

    // Применяем наценки
    const materialsWithMarkup = materialsCost * this.MARKUPS.materials
    const servicesWithMarkup = servicesCost * this.MARKUPS.services
    const laborCost = totalCost * (this.MARKUPS.labor - 1)

    // Итоговая стоимость производства
    const productionCost = materialsWithMarkup + servicesWithMarkup + laborCost

    // Применяем скидки по объему
    const volumeDiscount = this.calculateVolumeDiscount(quantity)
    
    // Применяем скидки по типу клиента
    const loyaltyDiscount = this.calculateLoyaltyDiscount(customerType)

    // Итоговая цена
    const finalPrice = productionCost * (1 - volumeDiscount / 100) * (1 - loyaltyDiscount / 100)

    return {
      id: `pricing_${Date.now()}`,
      productType,
      productName,
      basePrice: adjustedPrice,
      pricingTiers: this.getPricingTiers(),
      materials: materials.map(m => ({
        ...m,
        totalPrice: m.totalPrice * this.MARKUPS.materials
      })),
      services: services.map(s => ({
        ...s,
        totalPrice: s.totalPrice * this.MARKUPS.services
      })),
      totalCost: productionCost,
      markup: this.MARKUPS.materials,
      finalPrice: Math.round(finalPrice * 100) / 100
    }
  }

  private static getBasePrice(productType: string, productName: string, specifications: any): number {
    if (productType === 'Листовки') {
      const format = specifications.format || 'A6'
      return this.BASE_PRICES.flyers[format as keyof typeof this.BASE_PRICES.flyers]?.online || 0.10
    }
    
    if (productType === 'Визитки') {
      const type = specifications.lamination ? 'laminated' : 'standard'
      return this.BASE_PRICES.business_cards[type as keyof typeof this.BASE_PRICES.business_cards]?.online || 0.25
    }
    
    if (productType === 'Буклеты') {
      const key = `${specifications.format || 'A4'}_${specifications.pages || 4}page`
      return this.BASE_PRICES.booklets[key as keyof typeof this.BASE_PRICES.booklets]?.online || 0.60
    }

    return 0.10 // Базовая цена по умолчанию
  }

  private static async calculateMaterials(productType: string, specifications: any, quantity: number) {
    const materials = []
    
    // Бумага
    if (specifications.paperDensity) {
      const paperName = `Бумага NEVIA SRA3 ${specifications.paperDensity}г/м²`
      const paperPrice = this.MATERIAL_PRICES[paperName as keyof typeof this.MATERIAL_PRICES] || 0.05
      
      // Рассчитываем количество листов SRA3
      const sheetsPerItem = this.calculateSheetsPerItem(productType, specifications)
      const totalSheets = Math.ceil(quantity * sheetsPerItem * 1.02) // +2% на отходы
      
      materials.push({
        materialId: paperName,
        materialName: paperName,
        quantity: totalSheets,
        unitPrice: paperPrice,
        totalPrice: totalSheets * paperPrice
      })
    }

    // Краска
    const inkUsage = this.calculateInkUsage(productType, specifications)
    if (inkUsage > 0) {
      const inkPrice = this.MATERIAL_PRICES['Краска цветная']
      materials.push({
        materialId: 'Краска цветная',
        materialName: 'Краска цветная',
        quantity: inkUsage * quantity,
        unitPrice: inkPrice,
        totalPrice: inkUsage * quantity * inkPrice
      })
    }

    // Ламинация
    if (specifications.lamination && specifications.lamination !== 'none') {
      const laminationName = `Плёнка ламинации ${specifications.lamination === 'glossy' ? 'глянцевая' : 'матовая'} 35 мкм, SRA3`
      const laminationPrice = this.MATERIAL_PRICES[laminationName as keyof typeof this.MATERIAL_PRICES] || 0.03
      const sheetsPerItem = this.calculateSheetsPerItem(productType, specifications)
      const totalSheets = Math.ceil(quantity * sheetsPerItem * 1.02)
      
      materials.push({
        materialId: laminationName,
        materialName: laminationName,
        quantity: totalSheets,
        unitPrice: laminationPrice,
        totalPrice: totalSheets * laminationPrice
      })
    }

    return materials
  }

  private static async calculateServices(productType: string, specifications: any, quantity: number) {
    const services = []
    
    // Печать
    const sheetsPerItem = this.calculateSheetsPerItem(productType, specifications)
    const totalSheets = Math.ceil(quantity * sheetsPerItem * 1.02)
    const printPrice = this.SERVICE_PRICES['Печать цифровая']
    
    services.push({
      serviceId: 'Печать цифровая',
      serviceName: 'Печать цифровая',
      quantity: totalSheets,
      unitPrice: printPrice,
      totalPrice: totalSheets * printPrice
    })

    // Резка
    const cutsPerItem = this.calculateCutsPerItem(productType, specifications)
    if (cutsPerItem > 0) {
      const cutPrice = this.SERVICE_PRICES['Резка']
      services.push({
        serviceId: 'Резка',
        serviceName: 'Резка',
        quantity: cutsPerItem * quantity,
        unitPrice: cutPrice,
        totalPrice: cutsPerItem * quantity * cutPrice
      })
    }

    // Биговка (для буклетов)
    if (productType === 'Буклеты' && specifications.pages > 4) {
      const foldsPerItem = Math.ceil(specifications.pages / 4) - 1
      const foldPrice = this.SERVICE_PRICES['Биговка']
      services.push({
        serviceId: 'Биговка',
        serviceName: 'Биговка',
        quantity: foldsPerItem * quantity,
        unitPrice: foldPrice,
        totalPrice: foldsPerItem * quantity * foldPrice
      })
    }

    // Скругление углов (для визиток)
    if (productType === 'Визитки' && specifications.roundCorners) {
      const cornersPerItem = 4
      const cornerPrice = this.SERVICE_PRICES['Скругление углов']
      services.push({
        serviceId: 'Скругление углов',
        serviceName: 'Скругление углов',
        quantity: cornersPerItem * quantity,
        unitPrice: cornerPrice,
        totalPrice: cornersPerItem * quantity * cornerPrice
      })
    }

    return services
  }

  private static calculateSheetsPerItem(productType: string, specifications: any): number {
    if (productType === 'Листовки') {
      const format = specifications.format || 'A6'
      const upOnSra3 = {
        'A6': 8,
        'A5': 4,
        'A4': 2
      }
      return 1 / (upOnSra3[format as keyof typeof upOnSra3] || 8)
    }
    
    if (productType === 'Визитки') {
      return 1 / 10 // 10 визиток на лист SRA3
    }
    
    if (productType === 'Буклеты') {
      const pages = specifications.pages || 4
      return Math.ceil(pages / 4) // 4 страницы на лист SRA3
    }

    return 1
  }

  private static calculateCutsPerItem(productType: string, specifications: any): number {
    if (productType === 'Листовки') {
      const format = specifications.format || 'A6'
      const cutsPerSra3 = {
        'A6': 3, // 2 горизонтальных + 1 вертикальный
        'A5': 2, // 1 горизонтальный + 1 вертикальный
        'A4': 1  // 1 вертикальный
      }
      return cutsPerSra3[format as keyof typeof cutsPerSra3] || 3
    }
    
    if (productType === 'Визитки') {
      return 4 // 2 горизонтальных + 2 вертикальных
    }

    return 0
  }

  private static calculateInkUsage(productType: string, specifications: any): number {
    const sides = specifications.sides || 1
    const format = specifications.format || 'A6'
    
    // Базовое потребление краски в мл на лист
    const baseInkPerSheet = {
      'A6': 0.1,
      'A5': 0.2,
      'A4': 0.4
    }
    
    const inkPerSheet = baseInkPerSheet[format as keyof typeof baseInkPerSheet] || 0.1
    return inkPerSheet * sides
  }

  private static calculateVolumeDiscount(quantity: number): number {
    for (let i = this.VOLUME_DISCOUNTS.length - 1; i >= 0; i--) {
      if (quantity >= this.VOLUME_DISCOUNTS[i].minQuantity) {
        return this.VOLUME_DISCOUNTS[i].discountPercent
      }
    }
    return 0
  }

  private static calculateLoyaltyDiscount(customerType?: string): number {
    if (customerType === 'vip') return 15
    if (customerType === 'regular') return 5
    return 0
  }

  private static getPricingTiers(): PricingTier[] {
    return [
      {
        id: 'urgent',
        name: 'Срочно',
        description: 'Срочная печать (1-2 дня)',
        deliveryTime: 'urgent',
        multiplier: this.PRICING_MULTIPLIERS.rush,
        minOrder: 1,
        isActive: true
      },
      {
        id: 'online',
        name: 'Онлайн',
        description: 'Стандартная печать (3-5 дней)',
        deliveryTime: 'online',
        multiplier: this.PRICING_MULTIPLIERS.online,
        minOrder: 1,
        isActive: true
      },
      {
        id: 'promo',
        name: 'Акция',
        description: 'Промо-цены для больших тиражей',
        deliveryTime: 'promo',
        multiplier: this.PRICING_MULTIPLIERS.promo,
        minOrder: 1000,
        isActive: true
      }
    ]
  }

  // Метод для получения ценовой политики
  static async getPricingPolicy(): Promise<PricingPolicy> {
    return {
      id: 'karandash-based',
      name: 'Политика на основе Karandash.by',
      description: 'Ценообразование на основе анализа сайта karandash.by',
      isActive: true,
      tiers: {
        rush: {
          id: 'rush',
          name: 'Срочно',
          description: 'Срочная печать (1-2 дня)',
          deliveryTime: 'urgent',
          multiplier: this.PRICING_MULTIPLIERS.rush,
          minOrder: 1,
          isActive: true
        },
        online: {
          id: 'online',
          name: 'Онлайн',
          description: 'Стандартная печать (3-5 дней)',
          deliveryTime: 'online',
          multiplier: this.PRICING_MULTIPLIERS.online,
          minOrder: 1,
          isActive: true
        },
        promo: {
          id: 'promo',
          name: 'Акция',
          description: 'Промо-цены для больших тиражей',
          deliveryTime: 'promo',
          multiplier: this.PRICING_MULTIPLIERS.promo,
          minOrder: 1000,
          isActive: true
        }
      },
      markups: this.MARKUPS,
      discounts: {
        volume: this.VOLUME_DISCOUNTS,
        loyalty: [
          { customerType: 'regular', discountPercent: 5 },
          { customerType: 'vip', discountPercent: 15 }
        ]
      }
    }
  }
}
