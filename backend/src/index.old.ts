import express from 'express'
import cors from 'cors'
import path from 'path'
import { config, uploadsDir } from './config'
import { authMiddleware, errorHandler } from './middleware'
import apiRoutes from './routes'

// Optional: Sentry setup
if (config.sentryDsn) {
  try {
    // Lazy import to avoid dependency if not configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node')
    Sentry.init({ dsn: config.sentryDsn })
    console.log(JSON.stringify({ level: 'info', msg: 'Sentry initialized' }))
  } catch {}
}

async function main() {
  const app = express()

  // CORS
  app.use(cors({ origin: config.corsOrigin }))
  
  // Body parsing
  app.use(express.json())
  
  // Static files
  app.use('/uploads', express.static(uploadsDir))
  app.use('/api/uploads', express.static(uploadsDir))
  
  // Auth middleware
  app.use(authMiddleware)
  
  // API routes
  app.use('/api', apiRoutes)
  
  // Error handling
  app.use(errorHandler)

  // Start server
  app.listen(config.port, '0.0.0.0', () => {
    try { 
      console.log(JSON.stringify({ level: 'info', msg: 'API started', port: config.port })) 
    } catch { 
      console.log(`🚀 API running at http://localhost:${config.port}`) 
    }
  })
}

main().catch(err => {
  console.error('⛔ Fatal startup error:', err)
  process.exit(1)
})
