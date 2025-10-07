import { Request, Response } from 'express'
import { OptimizedQueries } from '../services/optimizedQueries'
import { CacheService } from '../services/cacheService'
import { asyncHandler } from '../middleware'

export class OptimizedMaterialController {
  // Оптимизированная загрузка материалов с кэшированием
  static getMaterials = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, supplierId, search } = req.query

    const filters = {
      categoryId: categoryId ? Number(categoryId) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
      search: search as string
    }

    const cacheKey = CacheService.getMaterialsKey(filters)
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      res.json(cached)
      return
    }

    const materials = await OptimizedQueries.getMaterialsWithDetails(filters)
    
    // Cache for 5 minutes
    CacheService.set(cacheKey, materials, 5 * 60 * 1000)

    res.json(materials)
  })

  // Отчет по потреблению материалов
  static getConsumptionReport = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo } = req.query

    if (!dateFrom || !dateTo) {
      res.status(400).json({ error: 'dateFrom and dateTo are required' })
      return
    }

    const cacheKey = `materials:consumption:${dateFrom}:${dateTo}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      res.json(cached)
      return
    }

    const report = await OptimizedQueries.getMaterialConsumptionReport(
      dateFrom as string, 
      dateTo as string
    )
    
    // Cache for 10 minutes
    CacheService.set(cacheKey, report, 10 * 60 * 1000)

    res.json(report)
  })

  // Инвалидация кэша материалов
  static invalidateCache = asyncHandler(async (req: Request, res: Response) => {
    CacheService.invalidateMaterials()
    res.json({ message: 'Materials cache invalidated' })
  })
}
