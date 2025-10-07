import { Request, Response } from 'express'
import { EnhancedCalculatorService } from '../services/enhancedCalculatorService'
import { asyncHandler } from '../middleware'

export class EnhancedCalculatorController {
  // Расширенный расчет цен для листовок
  static calculateFlyersPrice = asyncHandler(async (req: Request, res: Response) => {
    const {
      format,
      qty,
      sides,
      paperDensity,
      lamination,
      priceType,
      customerType
    } = req.body

    if (!format || !qty || !sides) {
      res.status(400).json({
        success: false,
        message: 'format, qty, sides обязательны'
      })
      return
    }

    const result = await EnhancedCalculatorService.calculateFlyersPrice({
      format,
      qty: Number(qty),
      sides: Number(sides) as 1|2,
      paperDensity: paperDensity || 130,
      lamination: lamination || 'none',
      priceType: priceType || 'online',
      customerType: customerType || 'regular'
    })

    res.json({
      success: true,
      data: result
    })
  })

  // Расчет цен для визиток
  static calculateBusinessCardsPrice = asyncHandler(async (req: Request, res: Response) => {
    const {
      qty,
      lamination,
      magnetic,
      priceType,
      customerType
    } = req.body

    if (!qty) {
      res.status(400).json({
        success: false,
        message: 'qty обязателен'
      })
      return
    }

    const result = await EnhancedCalculatorService.calculateBusinessCardsPrice({
      qty: Number(qty),
      lamination: lamination || 'none',
      magnetic: magnetic || false,
      priceType: priceType || 'online',
      customerType: customerType || 'regular'
    })

    res.json({
      success: true,
      data: result
    })
  })

  // Расчет цен для буклетов
  static calculateBookletsPrice = asyncHandler(async (req: Request, res: Response) => {
    const {
      format,
      pages,
      qty,
      priceType,
      customerType
    } = req.body

    if (!format || !pages || !qty) {
      res.status(400).json({
        success: false,
        message: 'format, pages, qty обязательны'
      })
      return
    }

    const result = await EnhancedCalculatorService.calculateBookletsPrice({
      format,
      pages: Number(pages),
      qty: Number(qty),
      priceType: priceType || 'online',
      customerType: customerType || 'regular'
    })

    res.json({
      success: true,
      data: result
    })
  })

  // Получить доступные типы продуктов
  static getAvailableProductTypes = asyncHandler(async (req: Request, res: Response) => {
    const productTypes = await EnhancedCalculatorService.getAvailableProductTypes()
    
    res.json({
      success: true,
      data: productTypes
    })
  })

  // Получить политику ценообразования
  static getPricingPolicy = asyncHandler(async (req: Request, res: Response) => {
    const policy = await EnhancedCalculatorService.getPricingPolicy()
    
    res.json({
      success: true,
      data: policy
    })
  })

  // Универсальный расчет цен
  static calculateUniversalPrice = asyncHandler(async (req: Request, res: Response) => {
    const {
      productType,
      specifications,
      qty,
      priceType,
      customerType
    } = req.body

    if (!productType || !qty) {
      res.status(400).json({
        success: false,
        message: 'productType, qty обязательны'
      })
      return
    }

    let result

    switch (productType) {
      case 'Листовки':
        result = await EnhancedCalculatorService.calculateFlyersPrice({
          format: specifications.format || 'A6',
          qty: Number(qty),
          sides: specifications.sides || 1,
          paperDensity: specifications.paperDensity || 130,
          lamination: specifications.lamination || 'none',
          priceType: priceType || 'online',
          customerType: customerType || 'regular'
        })
        break

      case 'Визитки':
        result = await EnhancedCalculatorService.calculateBusinessCardsPrice({
          qty: Number(qty),
          lamination: specifications.lamination || 'none',
          magnetic: specifications.magnetic || false,
          priceType: priceType || 'online',
          customerType: customerType || 'regular'
        })
        break

      case 'Буклеты':
        result = await EnhancedCalculatorService.calculateBookletsPrice({
          format: specifications.format || 'A4',
          pages: specifications.pages || 4,
          qty: Number(qty),
          priceType: priceType || 'online',
          customerType: customerType || 'regular'
        })
        break

      default:
        res.status(400).json({
          success: false,
          message: 'Неподдерживаемый тип продукта'
        })
        return
    }

    res.json({
      success: true,
      data: result
    })
  })
}
