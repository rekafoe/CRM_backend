import { Request, Response } from 'express'
import { PricingService } from '../services/pricingService'
import { asyncHandler } from '../middleware'

export class PricingController {
  // Получить политику ценообразования
  static getPricingPolicy = asyncHandler(async (req: Request, res: Response) => {
    const policy = await PricingService.getPricingPolicy()
    res.json({
      success: true,
      data: policy
    })
  })

  // Рассчитать цену продукта
  static calculateProductPrice = asyncHandler(async (req: Request, res: Response) => {
    const {
      productType,
      productName,
      quantity,
      specifications,
      pricingType,
      customerType
    } = req.body

    if (!productType || !productName || !quantity) {
      res.status(400).json({
        success: false,
        message: 'productType, productName и quantity обязательны'
      })
      return
    }

    const pricing = await PricingService.calculateProductPrice({
      productType,
      productName,
      quantity: Number(quantity),
      specifications: specifications || {},
      pricingType: pricingType || 'online',
      customerType: customerType || 'regular'
    })

    res.json({
      success: true,
      data: pricing
    })
  })

  // Получить базовые цены для продуктов
  static getBasePrices = asyncHandler(async (req: Request, res: Response) => {
    const basePrices = {
      flyers: {
        A6: { urgent: 0.15, online: 0.10, promo: 0.07 },
        A5: { urgent: 0.25, online: 0.18, promo: 0.12 },
        A4: { urgent: 0.40, online: 0.30, promo: 0.20 }
      },
      business_cards: {
        standard: { urgent: 0.35, online: 0.25, promo: 0.18 },
        laminated: { urgent: 0.45, online: 0.35, promo: 0.25 },
        magnetic: { urgent: 0.60, online: 0.45, promo: 0.35 }
      },
      booklets: {
        A4_4page: { urgent: 0.80, online: 0.60, promo: 0.45 },
        A4_8page: { urgent: 1.20, online: 0.90, promo: 0.70 },
        A5_4page: { urgent: 0.50, online: 0.40, promo: 0.30 }
      }
    }

    res.json({
      success: true,
      data: basePrices
    })
  })

  // Получить цены на материалы
  static getMaterialPrices = asyncHandler(async (req: Request, res: Response) => {
    const materialPrices = {
      'Бумага NEVIA SRA3 128г/м²': 0.05,
      'Бумага NEVIA SRA3 150г/м²': 0.06,
      'Бумага NEVIA SRA3 200г/м²': 0.08,
      'Бумага NEVIA SRA3 300г/м²': 0.12,
      'Краска черная': 0.15,
      'Краска цветная': 0.15,
      'Плёнка ламинации матовая 35 мкм, SRA3': 0.03,
      'Плёнка ламинации глянцевая 35 мкм, SRA3': 0.03
    }

    res.json({
      success: true,
      data: materialPrices
    })
  })

  // Получить цены на услуги
  static getServicePrices = asyncHandler(async (req: Request, res: Response) => {
    const servicePrices = {
      'Печать цифровая': 0.03,
      'Резка': 0.01,
      'Биговка': 0.01,
      'Скругление углов': 0.02,
      'Ламинация матовая': 0.05,
      'Ламинация глянцевая': 0.05,
      'Сшивка': 0.10,
      'Расшивка': 0.10
    }

    res.json({
      success: true,
      data: servicePrices
    })
  })

  // Получить коэффициенты ценообразования
  static getPricingMultipliers = asyncHandler(async (req: Request, res: Response) => {
    const multipliers = {
      urgent: 1.5,
      online: 1.0,
      promo: 0.7
    }

    res.json({
      success: true,
      data: multipliers
    })
  })

  // Получить скидки по объему
  static getVolumeDiscounts = asyncHandler(async (req: Request, res: Response) => {
    const discounts = [
      { minQuantity: 1000, discountPercent: 10 },
      { minQuantity: 5000, discountPercent: 20 },
      { minQuantity: 10000, discountPercent: 30 }
    ]

    res.json({
      success: true,
      data: discounts
    })
  })

  // Получить скидки по типу клиента
  static getLoyaltyDiscounts = asyncHandler(async (req: Request, res: Response) => {
    const discounts = [
      { customerType: 'regular', discountPercent: 5 },
      { customerType: 'vip', discountPercent: 15 }
    ]

    res.json({
      success: true,
      data: discounts
    })
  })

  // Сравнить цены с конкурентами
  static compareWithCompetitors = asyncHandler(async (req: Request, res: Response) => {
    const { productType, specifications, quantity } = req.body

    if (!productType || !quantity) {
      res.status(400).json({
        success: false,
        message: 'productType и quantity обязательны'
      })
      return
    }

    // Рассчитываем наши цены
    const ourPricing = await PricingService.calculateProductPrice({
      productType,
      productName: 'Наш продукт',
      quantity: Number(quantity),
      specifications: specifications || {},
      pricingType: 'online',
      customerType: 'regular'
    })

    // Цены конкурентов (на основе анализа karandash.by)
    const competitorPrices = {
      karandash: {
        urgent: ourPricing.finalPrice * 0.8, // Примерно на 20% дешевле
        online: ourPricing.finalPrice * 0.7, // Примерно на 30% дешевле
        promo: ourPricing.finalPrice * 0.6   // Примерно на 40% дешевле
      },
      average: {
        urgent: ourPricing.finalPrice * 0.9,
        online: ourPricing.finalPrice * 0.8,
        promo: ourPricing.finalPrice * 0.7
      }
    }

    res.json({
      success: true,
      data: {
        ourPricing,
        competitorPrices,
        analysis: {
          isCompetitive: ourPricing.finalPrice <= competitorPrices.average.online * 1.2,
          recommendation: ourPricing.finalPrice > competitorPrices.average.online * 1.2 
            ? 'Снизить цены на 10-15% для повышения конкурентоспособности'
            : 'Цены конкурентоспособны'
        }
      }
    })
  })

  // Обновить политику ценообразования
  static updatePricingPolicy = asyncHandler(async (req: Request, res: Response) => {
    const policyData = req.body

    // В реальном приложении здесь была бы логика сохранения в БД
    // Пока что просто возвращаем обновленные данные
    res.json({
      success: true,
      message: 'Политика ценообразования обновлена',
      data: policyData
    })
  })

  // Получить аналитику ценообразования
  static getPricingAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const analytics = {
      totalProducts: 15,
      averageMarkup: 35,
      mostProfitableProduct: 'Визитки магнитные',
      leastProfitableProduct: 'Листовки А6',
      priceChanges: [
        { date: '2024-01-15', product: 'Листовки А6', oldPrice: 0.12, newPrice: 0.10, change: -16.7 },
        { date: '2024-01-10', product: 'Визитки стандартные', oldPrice: 0.30, newPrice: 0.25, change: -16.7 },
        { date: '2024-01-05', product: 'Буклеты А4', oldPrice: 0.70, newPrice: 0.60, change: -14.3 }
      ],
      competitorAnalysis: {
        karandash: { marketShare: 25, avgPrice: 0.15 },
        average: { marketShare: 15, avgPrice: 0.18 },
        ourPosition: { marketShare: 10, avgPrice: 0.20 }
      }
    }

    res.json({
      success: true,
      data: analytics
    })
  })
}
