// Временно отключено из-за ошибок TypeScript
/*
import { Router } from 'express'
import { OptimizedOrderController } from '../controllers/optimizedOrderController'
import { OptimizedMaterialController } from '../controllers/optimizedMaterialController'
import { asyncHandler } from '../middleware'

const router = Router()

// Оптимизированные маршруты для заказов
router.get('/orders', OptimizedOrderController.getOrders)
router.get('/orders/search', OptimizedOrderController.searchOrders)
router.get('/orders/stats', OptimizedOrderController.getOrdersStats)
router.post('/orders/invalidate-cache', OptimizedOrderController.invalidateCache)

// Оптимизированные маршруты для материалов
router.get('/materials', OptimizedMaterialController.getMaterials)
router.get('/materials/consumption-report', OptimizedMaterialController.getConsumptionReport)
router.post('/materials/invalidate-cache', OptimizedMaterialController.invalidateCache)
*/

// export default router
export default (() => {
  const router = require('express').Router();
  return router;
})();

