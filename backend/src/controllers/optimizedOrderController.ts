// Временно отключено из-за ошибок TypeScript
/*
import { Request, Response } from 'express'
import { OptimizedQueries } from '../services/optimizedQueries'
import { CacheService } from '../services/cacheService'
import { asyncHandler } from '../middleware'

export class OptimizedOrderController {
  // Оптимизированная загрузка заказов с кэшированием
  static getOrders = asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      status, 
      dateFrom, 
      dateTo 
    } = req.query

    const filters = {
      userId: userId ? Number(userId) : undefined,
      status: status ? Number(status) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string
    }

    const cacheKey = CacheService.getOrdersKey(filters)
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      res.json(cached)
      return
    }

    const offset = (Number(page) - 1) * Number(limit)
    const result = await OptimizedQueries.getOrdersPaginated(
      Number(limit), 
      offset, 
      filters
    )

    // Cache for 2 minutes
    CacheService.set(cacheKey, result, 2 * 60 * 1000)

    res.json(result)
  })

  // Оптимизированный поиск заказов
  static searchOrders = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 20 } = req.query

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' })
      return
    }

    const cacheKey = `orders:search:${q}:${limit}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      res.json(cached)
      return
    }

    const results = await OptimizedQueries.searchOrders(q as string, Number(limit))
    
    // Cache for 1 minute
    CacheService.set(cacheKey, results, 60 * 1000)

    res.json(results)
  })

  // Статистика заказов
  static getOrdersStats = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo } = req.query

    if (!dateFrom || !dateTo) {
      res.status(400).json({ error: 'dateFrom and dateTo are required' })
      return
    }

    const cacheKey = `orders:stats:${dateFrom}:${dateTo}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      res.json(cached)
      return
    }

    const stats = await OptimizedQueries.getOrdersStats(
      dateFrom as string, 
      dateTo as string
    )
    
    // Cache for 5 minutes
    CacheService.set(cacheKey, stats, 5 * 60 * 1000)

    res.json(stats)
  })

  // Инвалидация кэша при изменении заказов
  static invalidateCache = asyncHandler(async (req: Request, res: Response) => {
    CacheService.invalidateOrders()
    res.json({ message: 'Cache invalidated' })
  })
}
*/
