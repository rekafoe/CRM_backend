/**
 * DEPRECATED: Используйте calculatorMaterialService.ts
 * 
 * Этот файл оставлен только для обратной совместимости.
 * Все данные о бумаге теперь берутся из складского сервиса.
 * 
 * @deprecated Use calculatorMaterialService.getPaperTypesFromWarehouse() instead
 */

export interface PaperDensityOption {
  value: number;
  label: string;
}

export interface PaperTypeConfig {
  id: string;
  name: string;
  display_name: string;
  densities: PaperDensityOption[];
  default_density: number;
  price_multiplier: number;
  description?: string;
}

/**
 * @deprecated Эти данные теперь берутся из складского сервиса
 * Используйте: getPaperTypesFromWarehouse() из calculatorMaterialService
 */

// Плотности бумаги для разных типов
export const PAPER_DENSITIES: Record<string, PaperDensityOption[]> = {
  'semi-matte': [
    { value: 80, label: '80 г/м²' },
    { value: 90, label: '90 г/м²' },
    { value: 130, label: '130 г/м²' },
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 160, label: '160 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' },
    { value: 350, label: '350 г/м²' }
  ],
  'glossy': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 170, label: '170 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' }
  ],
  'offset': [
    { value: 80, label: '80 г/м²' },
    { value: 90, label: '90 г/м²' },
    { value: 100, label: '100 г/м²' },
    { value: 130, label: '130 г/м²' },
    { value: 130, label: '130 г/м²' }
  ],
  'roll': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 170, label: '170 г/м²' }
  ],
  'self-adhesive': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 170, label: '170 г/м²' }
  ],
  'transparent': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' }
  ],
  'magnetic': [
    { value: 300, label: '300 г/м²' },
    { value: 400, label: '400 г/м²' },
    { value: 500, label: '500 г/м²' }
  ],
  'kraft': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' }
  ],
  'kraft_300g': [
    { value: 300, label: '300 г/м²' }
  ],
  'office': [
    { value: 80, label: '80 г/м²' },
    { value: 100, label: '100 г/м²' },
    { value: 130, label: '130 г/м²' }
  ],
  'coated': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' }
  ],
  'designer': [
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' },
    { value: 350, label: '350 г/м²' }
  ]
};

// Типы бумаги с полной конфигурацией
export const PAPER_TYPES: Record<string, PaperTypeConfig> = {
  'semi-matte': {
    id: 'semi-matte',
    name: 'Полуматовая',
    display_name: 'Мелованная полуматовая',
    densities: PAPER_DENSITIES['semi-matte'],
    default_density: 130,
    price_multiplier: 1.0,
    description: 'Стандартная мелованная бумага с полуматовой поверхностью'
  },
  'glossy': {
    id: 'glossy',
    name: 'Глянцевая',
    display_name: 'Мелованная глянцевая',
    densities: PAPER_DENSITIES['glossy'],
    default_density: 130,
    price_multiplier: 1.1,
    description: 'Мелованная бумага с глянцевой поверхностью'
  },
  'offset': {
    id: 'offset',
    name: 'Офсетная',
    display_name: 'Офсетная бумага',
    densities: PAPER_DENSITIES['offset'],
    default_density: 80,
    price_multiplier: 0.8,
    description: 'Обычная офсетная бумага для печати'
  },
  'kraft': {
    id: 'kraft',
    name: 'Крафт',
    display_name: 'Крафт-бумага',
    densities: PAPER_DENSITIES['kraft'],
    default_density: 130,
    price_multiplier: 0.9,
    description: 'Крафт-бумага коричневого цвета'
  },
  'magnetic': {
    id: 'magnetic',
    name: 'Магнитная',
    display_name: 'Магнитная основа',
    densities: PAPER_DENSITIES['magnetic'],
    default_density: 300,
    price_multiplier: 2.0,
    description: 'Магнитная основа для визиток и календарей'
  },
  'roll': {
    id: 'roll',
    name: 'Рулонная',
    display_name: 'Рулонный материал',
    densities: PAPER_DENSITIES['roll'],
    default_density: 130,
    price_multiplier: 0.9,
    description: 'Рулонная пленка для широкоформатной печати'
  },
  'self-adhesive': {
    id: 'self-adhesive',
    name: 'Самоклеящаяся',
    display_name: 'Самоклеящаяся пленка',
    densities: PAPER_DENSITIES['self-adhesive'],
    default_density: 130,
    price_multiplier: 1.3,
    description: 'Самоклеящаяся пленка для наклеек'
  },
  'transparent': {
    id: 'transparent',
    name: 'Прозрачная',
    display_name: 'Прозрачная пленка',
    densities: PAPER_DENSITIES['transparent'],
    default_density: 130,
    price_multiplier: 1.5,
    description: 'Прозрачная пленка'
  },
  'coated': {
    id: 'coated',
    name: 'Мелованная',
    display_name: 'Мелованная бумага',
    densities: PAPER_DENSITIES['coated'],
    default_density: 130,
    price_multiplier: 1.0,
    description: 'Мелованная бумага высокого качества'
  },
  'designer': {
    id: 'designer',
    name: 'Дизайнерская',
    display_name: 'Дизайнерская бумага',
    densities: PAPER_DENSITIES['designer'],
    default_density: 250,
    price_multiplier: 1.8,
    description: 'Дизайнерская бумага премиум класса'
  },
  'office': {
    id: 'office',
    name: 'Офисная',
    display_name: 'Офисная бумага',
    densities: PAPER_DENSITIES['office'],
    default_density: 80,
    price_multiplier: 0.7,
    description: 'Обычная офисная бумага'
  }
};

/**
 * Получить конфигурацию типа бумаги
 */
export const getPaperTypeConfig = (paperTypeId: string): PaperTypeConfig | null => {
  return PAPER_TYPES[paperTypeId] || null;
};

/**
 * Получить доступные плотности для типа бумаги
 */
export const getAvailableDensities = (paperTypeId: string): PaperDensityOption[] => {
  return PAPER_DENSITIES[paperTypeId] || [];
};

/**
 * Получить плотность по умолчанию для типа бумаги
 */
export const getDefaultDensity = (paperTypeId: string): number => {
  const config = PAPER_TYPES[paperTypeId];
  return config?.default_density || 130;
};

/**
 * Получить множитель цены для типа бумаги
 */
export const getPriceMultiplier = (paperTypeId: string): number => {
  const config = PAPER_TYPES[paperTypeId];
  return config?.price_multiplier || 1.0;
};

/**
 * Получить все типы бумаги для выпадающего списка
 */
export const getAllPaperTypes = (): Array<{ value: string; label: string }> => {
  return Object.values(PAPER_TYPES).map(type => ({
    value: type.id,
    label: type.display_name
  }));
};
