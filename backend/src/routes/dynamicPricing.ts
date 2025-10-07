import { Router } from 'express';
import { DynamicPricingController } from '../controllers/dynamicPricingController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Минимальные стоимости заказов
router.get('/minimum-order-costs', asyncHandler(DynamicPricingController.getMinimumOrderCosts));
router.get('/minimum-order-costs/check', asyncHandler(DynamicPricingController.getMinimumCostForOrder));
router.put('/minimum-order-costs/:id', asyncHandler(DynamicPricingController.updateMinimumOrderCost));

// Базовые цены продуктов
router.get('/product-base-prices', asyncHandler(DynamicPricingController.getProductBasePrices));
router.put('/product-base-prices/:id', asyncHandler(DynamicPricingController.updateProductBasePrice));

// Цены на материалы
router.get('/material-prices', asyncHandler(DynamicPricingController.getMaterialPrices));
router.put('/material-prices/:id', asyncHandler(DynamicPricingController.updateMaterialPrice));

// Цены на услуги
router.get('/service-prices', asyncHandler(DynamicPricingController.getServicePrices));
router.put('/service-prices/:id', asyncHandler(DynamicPricingController.updateServicePrice));

// Коэффициенты ценообразования
router.get('/pricing-multipliers', asyncHandler(DynamicPricingController.getPricingMultipliers));
router.put('/pricing-multipliers/:id', asyncHandler(DynamicPricingController.updatePricingMultiplier));

// Правила скидок
router.get('/discount-rules', asyncHandler(DynamicPricingController.getDiscountRules));
router.put('/discount-rules/:id', asyncHandler(DynamicPricingController.updateDiscountRule));

// Конфигурация ИИ-модели
router.get('/ai-model-config', asyncHandler(DynamicPricingController.getAIModelConfig));
router.put('/ai-model-config/:id', asyncHandler(DynamicPricingController.updateAIModelConfig));

// Экспорт данных ценообразования
router.get('/export', asyncHandler(DynamicPricingController.exportPricingData));

export default router;

