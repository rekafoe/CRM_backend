import { Router } from 'express'
import { PricingController } from '../controllers/pricingController'

const router = Router()

// Получить политику ценообразования
router.get('/policy', PricingController.getPricingPolicy)

// Рассчитать цену продукта
router.post('/calculate', PricingController.calculateProductPrice)

// Получить базовые цены
router.get('/base-prices', PricingController.getBasePrices)

// Получить цены на материалы
router.get('/materials', PricingController.getMaterialPrices)

// Получить цены на услуги
router.get('/services', PricingController.getServicePrices)

// Получить коэффициенты ценообразования
router.get('/multipliers', PricingController.getPricingMultipliers)

// Получить скидки по объему
router.get('/volume-discounts', PricingController.getVolumeDiscounts)

// Получить скидки по типу клиента
router.get('/loyalty-discounts', PricingController.getLoyaltyDiscounts)

// Сравнить с конкурентами
router.post('/compare', PricingController.compareWithCompetitors)

// Обновить политику ценообразования
router.put('/policy', PricingController.updatePricingPolicy)

// Получить аналитику ценообразования
router.get('/analytics', PricingController.getPricingAnalytics)

export default router

