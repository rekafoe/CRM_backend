import { Router } from 'express';
import { PriceManagementController } from '../controllers/priceManagementController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

/**
 * @route GET /api/price-management/history
 * @desc Получить историю изменений цен
 * @access Private
 */
router.get('/history', PriceManagementController.getPriceHistory);

/**
 * @route GET /api/price-management/notifications
 * @desc Получить уведомления об изменениях цен
 * @access Private
 */
router.get('/notifications', PriceManagementController.getPriceNotifications);

/**
 * @route GET /api/price-management/analytics
 * @desc Получить аналитику по ценам
 * @access Private
 */
router.get('/analytics', PriceManagementController.getPriceAnalytics);

/**
 * @route POST /api/price-management/snapshot
 * @desc Создать снимок текущих цен
 * @access Private
 */
router.post('/snapshot', PriceManagementController.createPriceSnapshot);

/**
 * @route GET /api/price-management/item/:itemId/snapshot
 * @desc Получить снимок цен для товара
 * @access Private
 */
router.get('/item/:itemId/snapshot', PriceManagementController.getItemPriceSnapshot);

/**
 * @route POST /api/price-management/item/:itemId/recalculate
 * @desc Пересчитать цену товара
 * @access Private
 */
router.post('/item/:itemId/recalculate', PriceManagementController.recalculateItemPrice);

export default router;
