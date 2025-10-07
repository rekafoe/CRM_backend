import { Request, Response } from 'express'
import { CalculatorService } from '../services'

export class CalculatorController {
  static async getFlyersSchema(req: Request, res: Response) {
    try {
      const schema = CalculatorService.getFlyersSchema()
      res.json(schema)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async calculateFlyersPrice(req: Request, res: Response) {
    try {
      const params = req.body as {
        format: 'A6'|'A5'|'A4';
        qty: number;
        sides: 1|2;
        paperDensity: 130|150;
        lamination: 'none'|'matte'|'glossy';
        priceType?: 'rush'|'online'|'promo';
      }
      
      const result = await CalculatorService.calculateFlyersPrice(params)
      res.json(result)
    } catch (error: any) {
      const status = error.message === 'format, qty, sides обязательны' ? 400 : 500
      res.status(status).json({ message: error.message })
    }
  }
}
