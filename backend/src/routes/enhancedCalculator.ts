import { Router } from 'express'
import { EnhancedCalculatorController } from '../controllers/enhancedCalculatorController'

const router = Router()

// Расчет цен для листовок
router.post('/flyers', EnhancedCalculatorController.calculateFlyersPrice)

// Расчет цен для визиток
router.post('/business-cards', EnhancedCalculatorController.calculateBusinessCardsPrice)

// Расчет цен для буклетов
router.post('/booklets', EnhancedCalculatorController.calculateBookletsPrice)

// Универсальный расчет цен
router.post('/calculate', EnhancedCalculatorController.calculateUniversalPrice)

// Получить доступные типы продуктов
router.get('/product-types', EnhancedCalculatorController.getAvailableProductTypes)

// Получить политику ценообразования
router.get('/pricing-policy', EnhancedCalculatorController.getPricingPolicy)

export default router

