import { Router } from 'express'
import authRoutes from './auth'
import orderRoutes from './orders'
import materialRoutes from './materials'
import materialCategoryRoutes from './materialCategories'
import supplierRoutes from './suppliers'
import materialReportRoutes from './materialReports'
import materialAlertRoutes from './materialAlerts'
import materialBulkRoutes from './materialBulk'
import materialImportExportRoutes from './materialImportExport'
import materialCostTrackingRoutes from './materialCostTracking'
import universalCalculatorRoutes from './universalCalculator'
// import calculatorRoutes from './calculators' // MOVED TO ARCHIVE
import dailyReportRoutes from './dailyReports'
import webhookRoutes from './webhooks'
import presetRoutes from './presets'
import reportRoutes from './reports'
import printerRoutes from './printers'
import userRoutes from './users'
import orderStatusRoutes from './orderStatuses'
// import optimizedRoutes from './optimized' // Временно отключено
// import performanceRoutes from './performance' // Временно отключено
import pricingRoutes from './pricing'
// import databasePricingRoutes from './databasePricing' // Временно отключено
import enhancedCalculatorRoutes from './enhancedCalculator'
import paperTypeRoutes from './paperTypes'
import dynamicPricingRoutes from './dynamicPricing'
import unifiedWarehouseRoutes from './unifiedWarehouse'
import warehouseTransactionRoutes from './warehouseTransactions'
// import autoMaterialDeductionRoutes from './autoMaterialDeduction' // Временно отключено
// import lowStockNotificationRoutes from './lowStockNotifications' // Временно отключено
import costCalculationRoutes from './costCalculation'
import materialsAnalyticsRoutes from './materialsAnalytics'
import userRolesRoutes from './userRoles'
// import materialReservationsRoutes from './materialReservationsRoutes' // Временно отключено
import productConfigRoutes from './productConfigRoutes'
// ВРЕМЕННО ОТКЛЮЧЕНО - ошибки TypeScript
// import priceManagementRoutes from './priceManagement'
import notificationRoutes from './notifications'
import photoOrderRoutes from './photoOrders'
import orderManagementRoutes from './orderManagement'

const router = Router()

router.use('/auth', authRoutes)
router.use('/orders', orderRoutes)
router.use('/materials', materialRoutes)
router.use('/material-categories', materialCategoryRoutes)
router.use('/suppliers', supplierRoutes)
router.use('/material-reports', materialReportRoutes)
router.use('/material-alerts', materialAlertRoutes)
router.use('/material-bulk', materialBulkRoutes)
router.use('/material-import-export', materialImportExportRoutes)
router.use('/material-cost-tracking', materialCostTrackingRoutes)
router.use('/universal-calculator', universalCalculatorRoutes)

// Отладочный endpoint
router.get('/debug-routes', (req, res) => {
  res.json({
    message: 'Роуты загружены',
    universalCalculator: 'OK',
    timestamp: new Date().toISOString()
  })
})
// router.use('/calculators', calculatorRoutes) // MOVED TO ARCHIVE
router.use('/daily-reports', dailyReportRoutes)
router.use('/webhooks', webhookRoutes)
router.use('/presets', presetRoutes)
router.use('/reports', reportRoutes)
router.use('/printers', printerRoutes)
router.use('/users', userRoutes) // users
router.use('/order-statuses', orderStatusRoutes) // order-statuses
// router.use('/optimized', optimizedRoutes) // optimized endpoints // Временно отключено
// router.use('/performance', performanceRoutes) // performance monitoring // Временно отключено
router.use('/pricing', pricingRoutes) // pricing policy
// router.use('/database-pricing', databasePricingRoutes) // database pricing // Временно отключено
router.use('/enhanced-calculator', enhancedCalculatorRoutes) // enhanced calculator
router.use('/paper-types', paperTypeRoutes) // paper types and printing prices
router.use('/dynamic-pricing', dynamicPricingRoutes) // dynamic pricing system
router.use('/unified-warehouse', unifiedWarehouseRoutes) // unified warehouse system
router.use('/warehouse-transactions', warehouseTransactionRoutes) // warehouse transactions
// router.use('/auto-material-deduction', autoMaterialDeductionRoutes) // automatic material deduction // Временно отключено
// router.use('/low-stock-notifications', lowStockNotificationRoutes) // low stock notifications // Временно отключено
router.use('/cost-calculation', costCalculationRoutes) // cost calculation
router.use('/materials-analytics', materialsAnalyticsRoutes) // materials analytics
router.use('/user-roles', userRolesRoutes) // user roles and permissions
// router.use('/material-reservations', materialReservationsRoutes) // material reservations // Временно отключено
router.use('/product-configs', productConfigRoutes) // product configurations
// ВРЕМЕННО ОТКЛЮЧЕНО - ошибки TypeScript
// router.use('/price-management', priceManagementRoutes) // price management and history
router.use('/notifications', notificationRoutes) // notifications and automation
router.use('/photo-orders', photoOrderRoutes) // photo orders and processing
router.use('/order-management', orderManagementRoutes) // order management and user reports

export default router
