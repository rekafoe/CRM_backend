import { Router } from 'express'
import { OrderController, OrderItemController } from '../controllers'
import { asyncHandler } from '../middleware'
import { upload } from '../config/upload'
import { getDb } from '../config/database'

const router = Router()

// Order routes
router.get('/', asyncHandler(OrderController.getAllOrders))
router.get('/search', asyncHandler(OrderController.searchOrders))
router.get('/stats', asyncHandler(OrderController.getOrdersStats))
router.post('/', asyncHandler(OrderController.createOrder))
router.post('/with-auto-deduction', asyncHandler(OrderController.createOrderWithAutoDeduction))
router.put('/:id/status', asyncHandler(OrderController.updateOrderStatus))
router.delete('/:id', asyncHandler(OrderController.deleteOrder))
router.post('/:id/duplicate', asyncHandler(OrderController.duplicateOrder))

// Bulk operations
router.post('/bulk/update-status', asyncHandler(OrderController.bulkUpdateStatus))
router.post('/bulk/delete', asyncHandler(OrderController.bulkDeleteOrders))

// Export
router.get('/export', asyncHandler(OrderController.exportOrders))

// Order items routes
router.post('/:id/items', asyncHandler(OrderItemController.addItem))
router.delete('/:orderId/items/:itemId', asyncHandler(OrderItemController.deleteItem))
router.patch('/:orderId/items/:itemId', asyncHandler(OrderItemController.updateItem))

// Order files routes
router.get('/:id/files', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const db = await getDb()
  const rows = await db.all<any>(
    'SELECT id, orderId, filename, originalName, mime, size, uploadedAt, approved, approvedAt, approvedBy FROM order_files WHERE orderId = ? ORDER BY id DESC',
    id
  )
  res.json(rows)
}))

router.post('/:id/files', upload.single('file'), asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id)
  const f = (req as any).file as { filename: string; originalname?: string; mimetype?: string; size?: number } | undefined
  if (!f) { res.status(400).json({ message: 'Файл не получен' }); return }
  const db = await getDb()
  await db.run(
    'INSERT INTO order_files (orderId, filename, originalName, mime, size) VALUES (?, ?, ?, ?, ?)',
    orderId,
    f.filename,
    f.originalname || null,
    f.mimetype || null,
    f.size || null
  )
  const row = await db.get<any>(
    'SELECT id, orderId, filename, originalName, mime, size, uploadedAt, approved, approvedAt, approvedBy FROM order_files WHERE orderId = ? ORDER BY id DESC LIMIT 1',
    orderId
  )
  res.status(201).json(row)
}))

router.delete('/:orderId/files/:fileId', asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId)
  const fileId = Number(req.params.fileId)
  const { uploadsDir } = await import('../config/upload')
  const path = await import('path')
  const fs = await import('fs')
  const db = await getDb()
  const row = await db.get<any>('SELECT filename FROM order_files WHERE id = ? AND orderId = ?', fileId, orderId)
  if (row && row.filename) {
    const p = path.join(uploadsDir, String(row.filename))
    try { fs.unlinkSync(p) } catch {}
  }
  await db.run('DELETE FROM order_files WHERE id = ? AND orderId = ?', fileId, orderId)
  res.status(204).end()
}))

router.post('/:orderId/files/:fileId/approve', asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId)
  const fileId = Number(req.params.fileId)
  const user = (req as any).user as { id: number } | undefined
  const db = await getDb()
  await db.run(
    "UPDATE order_files SET approved = 1, approvedAt = datetime('now'), approvedBy = ? WHERE id = ? AND orderId = ?",
    user?.id ?? null,
    fileId,
    orderId
  )
  const row = await db.get<any>(
    'SELECT id, orderId, filename, originalName, mime, size, uploadedAt, approved, approvedAt, approvedBy FROM order_files WHERE id = ? AND orderId = ?',
    fileId,
    orderId
  )
  res.json(row)
}))

// Prepayment routes
router.post('/:id/prepay', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const db = await getDb()
  const order = await db.get<any>('SELECT * FROM orders WHERE id = ?', id)
  if (!order) { res.status(404).json({ message: 'Заказ не найден' }); return }
  const amount = Number((req.body as any)?.amount ?? order.prepaymentAmount ?? 0)
  const paymentMethod = (req.body as any)?.paymentMethod ?? 'online'
  if (!amount || amount <= 0) { res.status(400).json({ message: 'Сумма предоплаты не задана' }); return }
  
  // BePaid integration stub: normally create payment via API and get redirect url
  const paymentId = `BEP-${Date.now()}-${id}`
  const paymentUrl = paymentMethod === 'online' ? `https://checkout.bepaid.by/redirect/${paymentId}` : null
  const prepaymentStatus = paymentMethod === 'offline' ? 'paid' : 'pending'
  
  await db.run('UPDATE orders SET prepaymentAmount = ?, prepaymentStatus = ?, paymentUrl = ?, paymentId = ?, paymentMethod = ? WHERE id = ?', 
    amount, prepaymentStatus, paymentUrl, paymentId, paymentMethod, id)
  const updated = await db.get<any>('SELECT * FROM orders WHERE id = ?', id)
  res.json(updated)
}))

// Admin utility: normalize item prices
router.post('/:id/normalize-prices', asyncHandler(async (req, res) => {
  const user = (req as any).user as { id: number; role: string } | undefined
  if (!user || user.role !== 'admin') { res.status(403).json({ message: 'Forbidden' }); return }
  const orderId = Number(req.params.id)
  const db = await getDb()
  const items = await db.all<any>('SELECT id, price, quantity FROM items WHERE orderId = ?', orderId)
  let updated = 0
  for (const it of items) {
    const qty = Math.max(1, Number(it.quantity) || 1)
    const price = Number(it.price) || 0
    // Heuristic: if qty>1 and price likely contains total (per-item > 10 BYN or qty>=50 and per-item > 3 BYN)
    const perItem = price / qty
    const shouldFix = qty > 1 && (perItem === 0 ? false : (perItem > 10 || (qty >= 50 && perItem > 3)))
    if (shouldFix) {
      await db.run('UPDATE items SET price = ? WHERE id = ? AND orderId = ?', perItem, it.id, orderId)
      updated++
    }
  }
  res.json({ orderId, updated })
}))

export default router
