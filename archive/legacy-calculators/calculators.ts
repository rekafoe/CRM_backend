// Flyers calculator constants and utilities
export const FLYERS_SCHEMA = {
  slug: 'flyers-color',
  name: 'Листовки цветные',
  options: {
    format: ['A6', 'A5', 'A4'],
    sides: [1, 2],
    qtySteps: [50, 100, 200, 300, 500, 1000, 2000, 5000],
    paperDensity: [130, 170],
    lamination: ['none', 'matte', 'glossy'],
    priceType: ['rush', 'online', 'promo']
  }
}

export const FLYERS_UP_ON_SRA3: Record<string, number> = {
  A6: 8,
  A5: 4,
  A4: 2
}

export const FLYERS_SHEET_PRICE: Record<number, number> = { 
  130: 0.4, 
  150: 0.5 
}

export const LAM_SHEET_PRICE: Record<string, number> = { 
  matte: 0.2, 
  glossy: 0.2 
}

export const getQtyDiscountK = (_qty: number): number => { 
  return 1 
}
