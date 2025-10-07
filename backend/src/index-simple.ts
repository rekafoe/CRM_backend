import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB } from './config/database'
import { config } from './config/app'
import { authMiddleware, errorHandler } from './middleware'
import routes from './routes'

// Load environment variables
dotenv.config()

const app = express()

// Basic middleware
app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

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
    console.log('🔄 Initializing database...')
    await initDB()
    console.log('✅ Database initialized')
    
    const port = process.env.PORT || 3001
    console.log(`🔄 Starting server on port ${port}...`)
    
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`)
      console.log(`🌐 API available at http://localhost:${port}/api`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
