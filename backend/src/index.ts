import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { initDB } from './config/database'
import { config } from './config/app'
import { uploadsDir } from './config/upload'
import { authMiddleware, errorHandler } from './middleware'
import { performanceMiddleware, performanceLoggingMiddleware } from './middleware/performance'
import { compressionMiddleware } from './middleware/compression'
import { cachePresets } from './middleware/httpCache'
import routes from './routes'
import { TelegramService } from './services/telegramService'
import { StockMonitoringService } from './services/stockMonitoringService'
import { AutoOrderService } from './services/autoOrderService'
import { UserNotificationService } from './services/userNotificationService'

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(cors({ origin: config.corsOrigin }))
app.use(compressionMiddleware) // Сжатие ответов
app.use(performanceMiddleware) // Мониторинг производительности
app.use(performanceLoggingMiddleware) // Логирование производительности
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Static files
app.use('/uploads', express.static(uploadsDir))

// Health check (before auth middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Authentication middleware
app.use(authMiddleware)

// Routes
app.use('/api', routes)

// Error handling
app.use(errorHandler)

// Initialize database and start server
async function startServer() {
  try {
    await initDB()
    console.log('✅ Database initialized')
    
    // Инициализация сервисов уведомлений
    const telegramConfig = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: process.env.TELEGRAM_ENABLED === 'true'
    }
    
    TelegramService.initialize(telegramConfig)
    
    const stockMonitoringConfig = {
      enabled: process.env.STOCK_MONITORING_ENABLED !== 'false',
      checkInterval: parseInt(process.env.STOCK_CHECK_INTERVAL || '30'),
      lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '120'),
      criticalStockThreshold: parseInt(process.env.CRITICAL_STOCK_THRESHOLD || '100'),
      autoOrderEnabled: process.env.AUTO_ORDER_ENABLED === 'true',
      autoOrderThreshold: parseInt(process.env.AUTO_ORDER_THRESHOLD || '80')
    }
    
    StockMonitoringService.initialize(stockMonitoringConfig)
    
    const autoOrderConfig = {
      enabled: process.env.AUTO_ORDER_ENABLED === 'true',
      minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT || '100'),
      maxOrderAmount: parseFloat(process.env.MAX_ORDER_AMOUNT || '10000'),
      orderFrequency: (process.env.ORDER_FREQUENCY as 'daily' | 'weekly' | 'monthly') || 'weekly',
      preferredDeliveryDays: process.env.PREFERRED_DELIVERY_DAYS?.split(',').map(Number) || [1, 2, 3, 4, 5],
      autoApproveOrders: process.env.AUTO_APPROVE_ORDERS === 'true',
      notificationEnabled: process.env.ORDER_NOTIFICATIONS_ENABLED !== 'false'
    }
    
    AutoOrderService.initialize(autoOrderConfig)
    
    // Инициализация сервиса пользовательских уведомлений
    await UserNotificationService.initialize()
    
    const port = process.env.PORT || 3001
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`)
      console.log(`📁 Uploads directory: ${uploadsDir}`)
      console.log(`🤖 Telegram notifications: ${telegramConfig.enabled ? 'enabled' : 'disabled'}`)
      console.log(`📊 Stock monitoring: ${process.env.STOCK_MONITORING_ENABLED !== 'false' ? 'enabled' : 'disabled'}`)
      console.log(`🛒 Auto ordering: ${process.env.AUTO_ORDER_ENABLED === 'true' ? 'enabled' : 'disabled'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()