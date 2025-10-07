import { Request, Response } from 'express'
import { OrderService } from '../services'
import { AuthenticatedRequest } from '../middleware'

export class OrderController {
  static async getAllOrders(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!authUser?.id) { 
        res.status(401).json({ message: 'Unauthorized' })
        return 
      }
      
      const orders = await OrderService.getAllOrders(authUser.id)
      res.json(orders)
    } catch (error: any) {
      console.error('Error in /api/orders:', error)
      res.status(500).json({ 
        error: 'Failed to load orders', 
        details: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  static async createOrder(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number } | undefined
      const { customerName, customerPhone, customerEmail, prepaymentAmount, date } = req.body || {}
      
      const order = await OrderService.createOrder(
        customerName,
        customerPhone,
        customerEmail,
        prepaymentAmount,
        authUser?.id,
        date
      )
      
      res.status(201).json(order)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async createOrderWithAutoDeduction(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number } | undefined
      const { customerName, customerPhone, customerEmail, prepaymentAmount, items } = req.body || {}
      
      if (!items || !Array.isArray(items)) {
        res.status(400).json({ 
          error: 'Необходимо указать массив товаров (items)' 
        })
        return
      }
      
      const result = await OrderService.createOrderWithAutoDeduction({
        customerName,
        customerPhone,
        customerEmail,
        prepaymentAmount,
        userId: authUser?.id,
        items
      })
      
      res.status(201).json({
        order: result.order,
        deductionResult: result.deductionResult,
        message: 'Заказ создан с автоматическим списанием материалов'
      })
    } catch (error: any) {
      res.status(500).json({ 
        error: error.message,
        details: 'Ошибка создания заказа с автоматическим списанием'
      })
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const { status } = req.body as { status: number }
      
      const updated = await OrderService.updateOrderStatus(id, status)
      res.json(updated)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async deleteOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const authUser = (req as AuthenticatedRequest).user as { id: number } | undefined
      
      await OrderService.deleteOrder(id, authUser?.id)
      res.status(204).end()
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async duplicateOrder(req: Request, res: Response) {
    try {
      const originalOrderId = Number(req.params.id)
      const newOrder = await OrderService.duplicateOrder(originalOrderId)
      res.status(201).json(newOrder)
    } catch (error: any) {
      const status = error.message === 'Заказ не найден' ? 404 : 500
      res.status(status).json({ message: error.message })
    }
  }

  static async addOrderItem(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.id)
      const itemData = req.body
      
      const item = await OrderService.addOrderItem(orderId, itemData)
      res.status(201).json(item)
    } catch (error: any) {
      console.error('Error adding order item:', error)
      res.status(500).json({ 
        error: 'Failed to add item to order', 
        details: error.message 
      })
    }
  }

  // Новые методы для расширенного управления заказами

  static async searchOrders(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!authUser?.id) { 
        res.status(401).json({ message: 'Unauthorized' })
        return 
      }
      
      const searchParams = req.query
      const orders = await OrderService.searchOrders(authUser.id, searchParams)
      res.json(orders)
    } catch (error: any) {
      console.error('Error searching orders:', error)
      res.status(500).json({ 
        error: 'Failed to search orders', 
        details: error.message 
      })
    }
  }

  static async getOrdersStats(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!authUser?.id) { 
        res.status(401).json({ message: 'Unauthorized' })
        return 
      }
      
      const { dateFrom, dateTo } = req.query
      const stats = await OrderService.getOrdersStats(authUser.id, dateFrom as string, dateTo as string)
      res.json(stats)
    } catch (error: any) {
      console.error('Error getting orders stats:', error)
      res.status(500).json({ 
        error: 'Failed to get orders stats', 
        details: error.message 
      })
    }
  }

  static async bulkUpdateStatus(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!authUser?.id) { 
        res.status(401).json({ message: 'Unauthorized' })
        return 
      }
      
      const { orderIds, newStatus } = req.body
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        res.status(400).json({ error: 'orderIds must be a non-empty array' })
        return
      }
      
      const result = await OrderService.bulkUpdateOrderStatus(orderIds, newStatus, authUser.id)
      res.json(result)
    } catch (error: any) {
      console.error('Error bulk updating order status:', error)
      res.status(500).json({ 
        error: 'Failed to bulk update order status', 
        details: error.message 
      })
    }
  }

  static async bulkDeleteOrders(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!authUser?.id) { 
        res.status(401).json({ message: 'Unauthorized' })
        return 
      }
      
      const { orderIds } = req.body
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        res.status(400).json({ error: 'orderIds must be a non-empty array' })
        return
      }
      
      const result = await OrderService.bulkDeleteOrders(orderIds, authUser.id)
      res.json(result)
    } catch (error: any) {
      console.error('Error bulk deleting orders:', error)
      res.status(500).json({ 
        error: 'Failed to bulk delete orders', 
        details: error.message 
      })
    }
  }

  static async exportOrders(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!authUser?.id) { 
        res.status(401).json({ message: 'Unauthorized' })
        return 
      }
      
      const { format = 'csv', ...searchParams } = req.query
      const data = await OrderService.exportOrders(authUser.id, format as 'csv' | 'json', searchParams)
      
      const filename = `orders_export_${new Date().toISOString().split('T')[0]}.${format}`
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json'
      
      res.setHeader('Content-Type', mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(data)
    } catch (error: any) {
      console.error('Error exporting orders:', error)
      res.status(500).json({ 
        error: 'Failed to export orders', 
        details: error.message 
      })
    }
  }
}
