import { getDb } from '../config/database'
import { config } from '../config/app'
import { FLYERS_SCHEMA, FLYERS_UP_ON_SRA3, FLYERS_SHEET_PRICE, LAM_SHEET_PRICE, getQtyDiscountK } from '../utils/calculators'

export class CalculatorService {
  static getFlyersSchema() {
    return FLYERS_SCHEMA
  }

  static async calculateFlyersPrice(params: {
    format: 'A6'|'A5'|'A4';
    qty: number;
    sides: 1|2;
    paperDensity: 130|150;
    lamination: 'none'|'matte'|'glossy';
    priceType?: 'rush'|'online'|'promo';
  }) {
    const { format, qty, sides, paperDensity, lamination, priceType } = params
    
    if (!format || !qty || !sides) {
      throw new Error('format, qty, sides обязательны')
    }

    const up = FLYERS_UP_ON_SRA3[format] || 8
    const sra3PerItem = 1 / up
    const wasteRatio = 0.02
    const totalSheets = Math.ceil(qty * sra3PerItem * (1 + wasteRatio))

    // Sheet-based price
    const baseSheet = FLYERS_SHEET_PRICE[Number(paperDensity) || 130] ?? 0.4
    const sidesK = sides === 2 ? 1.6 : 1
    // Flyers: ламинацию для листовок не учитываем в стоимости
    const lamPS = 0
    const type = (priceType || 'rush') as 'rush'|'online'|'promo'
    
    // Pricing from tiers table
    const singleFromTier = await this.resolveSheetSinglePrice(format, type, Number(qty) || 0, Number(paperDensity) || 130)
    const sheetPrice = Math.round(((singleFromTier * sidesK) + lamPS) * 100) / 100
    const discountK = getQtyDiscountK(Number(qty) || 0)
    const totalPrice = Math.round((totalSheets * sheetPrice * discountK) * 100) / 100
    const pricePerItem = Math.round(((totalPrice / Math.max(1, qty))) * 100) / 100

    const paperId = await this.getMaterialIdByDensity(Number(paperDensity) || 130)
    // Flyers: не добавляем компонент ламинации
    const lamId = undefined
    const components: Array<{ materialId: number; qtyPerItem: number }> = []
    if (paperId) components.push({ materialId: paperId, qtyPerItem: sra3PerItem * (1 + wasteRatio) })
    if (lamId) components.push({ materialId: lamId, qtyPerItem: sra3PerItem * (1 + wasteRatio) })

    return { 
      pricePerItem, 
      totalPrice, 
      totalSheets, 
      components, 
      derived: { up, sra3PerItem, wasteRatio, discountK } 
    }
  }

  private static async resolveSheetSinglePrice(format: string, priceType: 'rush'|'online'|'promo', qty: number, paperDensity: number): Promise<number> {
    const db = await getDb()
    const row = await db.get<{ sheet_price_single: number }>(
      `SELECT sheet_price_single FROM pricing_flyers_tiers
        WHERE format = ? AND price_type = ? AND paper_density = ? AND min_qty <= ?
        ORDER BY min_qty DESC LIMIT 1`, format, priceType, paperDensity, qty
    )
    return Number((row as any)?.sheet_price_single || 0)
  }

  private static async getMaterialIdByDensity(d: number): Promise<number | undefined> {
    const db = await getDb()
    // Используем новые материалы SRA3 с реальными ценами
    let name: string
    if (d >= 150) {
      name = 'Бумага NEVIA SRA3 150г/м²'
    } else {
      name = 'Бумага NEVIA SRA3 128г/м²' // Используем 128г вместо 130г
    }
    const result = await db.get<{ id: number }>('SELECT id FROM materials WHERE name = ?', name)
    return (result as any)?.id
  }

  private static async getLaminationMatId(type: string): Promise<number | undefined> {
    const db = await getDb()
    const name = type === 'glossy' ? 'Плёнка ламинации глянцевая 35 мкм, SRA3' : 'Плёнка ламинации матовая 35 мкм, SRA3'
    const result = await db.get<{ id: number }>('SELECT id FROM materials WHERE name = ?', name)
    return (result as any)?.id
  }
}
