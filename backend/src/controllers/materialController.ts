import { Request, Response } from 'express'
import { MaterialService } from '../services'
import { AuthenticatedRequest } from '../middleware'

export class MaterialController {
  static async getAllMaterials(req: Request, res: Response) {
    try {
      const materials = await MaterialService.getAllMaterials()
      res.json(materials)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async createOrUpdateMaterial(req: Request, res: Response) {
    try {
      console.log('=== КОНТРОЛЛЕР СОЗДАНИЯ МАТЕРИАЛА ===');
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      const user = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!user || user.role !== 'admin') { 
        console.log('❌ Доступ запрещен - пользователь не админ');
        res.status(403).json({ message: 'Forbidden' })
        return 
      }
      
      console.log('✅ Пользователь авторизован:', user);
      
      const material = req.body
      const result = await MaterialService.createOrUpdateMaterial(material)
      console.log('✅ Материал создан/обновлен успешно');
      res.json(result)
    } catch (error: any) {
      console.error('❌ Ошибка в контроллере создания материала:', error);
      const status = error.status || 500
      res.status(status).json({ error: error.message })
    }
  }

  static async updateMaterial(req: Request, res: Response) {
    try {
      console.log('=== PUT /api/materials/:id ===');
      console.log('Params:', req.params);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      const user = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!user || user.role !== 'admin') { 
        res.status(403).json({ message: 'Forbidden' })
        return 
      }
      
      const id = Number(req.params.id)
      const material = req.body
      const result = await MaterialService.updateMaterial(id, material)
      res.json(result)
    } catch (error: any) {
      console.error('Ошибка в updateMaterial контроллере:', error);
      const status = error.status || 500
      res.status(status).json({ error: error.message })
    }
  }

  static async deleteMaterial(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!user || user.role !== 'admin') { 
        res.status(403).json({ message: 'Forbidden' })
        return 
      }
      
      const id = Number(req.params.id)
      await MaterialService.deleteMaterial(id)
      res.status(204).end()
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async getLowStockMaterials(req: Request, res: Response) {
    try {
      const materials = await MaterialService.getLowStockMaterials()
      res.json(materials)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async getMaterialMoves(req: Request, res: Response) {
    try {
      const { 
        materialId, user_id, orderId, from, to, categoryId, supplierId, reason, 
        limit, offset 
      } = req.query as any
      
      const moves = await MaterialService.getMaterialMoves({
        materialId: materialId ? Number(materialId) : undefined,
        user_id: user_id ? Number(user_id) : undefined,
        orderId: orderId ? Number(orderId) : undefined,
        from: from as string,
        to: to as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
        reason: reason as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      })
      res.json(moves)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async getMaterialMovesStats(req: Request, res: Response) {
    try {
      const { 
        materialId, user_id, orderId, from, to, categoryId, supplierId 
      } = req.query as any
      
      const stats = await MaterialService.getMaterialMovesStats({
        materialId: materialId ? Number(materialId) : undefined,
        user_id: user_id ? Number(user_id) : undefined,
        orderId: orderId ? Number(orderId) : undefined,
        from: from as string,
        to: to as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined
      })
      res.json(stats)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async spendMaterial(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user as { id: number; role: string } | undefined
      if (!user || user.role !== 'admin') { 
        res.status(403).json({ message: 'Forbidden' })
        return 
      }
      
      const { materialId, delta, reason, orderId } = req.body as { 
        materialId: number; 
        delta: number; 
        reason?: string; 
        orderId?: number 
      }
      
      const result = await MaterialService.spendMaterial(materialId, delta, reason, orderId, user.id)
      res.json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
