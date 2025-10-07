import { Request, Response, NextFunction } from 'express'
import { getDb } from '../config/database'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 Auth middleware: ${req.method} ${req.path}`);
  
  const openPaths = [
    // public widget needs these
    /^\/api\/presets/,
    /^\/api\/orders\/[0-9]+\/items$/,
    /^\/api\/orders\/[0-9]+\/prepay$/,
    /^\/api\/webhooks\/bepaid$/,
    // auth endpoints
    /^\/api\/auth\/login$/,
    /^\/api\/auth\/me$/,
    // temporary for testing calculator
    /^\/api\/universal-calculator/,
    /^\/api\/materials\/test-calculator$/,
    /^\/api\/debug-routes$/,
    // pricing policy endpoints
    /^\/api\/pricing/,
    // enhanced calculator endpoints
    /^\/api\/enhanced-calculator/,
    // 🆕 Calculator material endpoints (for public access)
    /^\/api\/paper-types$/,
    /^\/api\/materials$/,
    /^\/api\/product-configs$/,
    // 🆕 Notifications endpoints (temporary for testing)
    /^\/api\/notifications/,
    // 🆕 Photo orders endpoints (temporary for testing)
    /^\/api\/photo-orders/
  ]
  
  const isOpenPath = openPaths.some(r => r.test(req.path));
  console.log(`🔍 Is open path: ${isOpenPath}`);
  
  if (isOpenPath) {
    console.log(`✅ Allowing access to ${req.path}`);
    return next();
  }
  
  const auth = req.headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
  
  if (!token) { 
    res.status(401).json({ message: 'Unauthorized' })
    return 
  }
  
  const db = await getDb()
  const user = await db.get<{ id: number; role: string }>('SELECT id, role FROM users WHERE api_token = ?', token)
  
  if (!user) { 
    res.status(401).json({ message: 'Unauthorized' })
    return 
  }
  
  ;(req as AuthenticatedRequest).user = user
  next()
}

// Экспорт для обратной совместимости
export const authMiddleware = authenticate
