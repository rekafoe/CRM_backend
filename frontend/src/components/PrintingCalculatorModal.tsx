import React, { useState, useEffect } from 'react';
import { getMaterials, createOrder, getPaperTypes, findPaperTypeByMaterial, getPrintingPrice } from '../api';
import { productConfigs as defaultProductConfigs, printingPrices, urgencyMultipliers, vipDiscounts } from '../config/calculatorConfig';
import { DynamicPricingService } from '../services/dynamicPricingService';
import { useLogger } from '../utils/logger';
import { DataStates, useDataStates } from './DataStates';
import { ErrorDisplay } from './ErrorStates';
import '../styles/printing-calculator.css';

// Константы плотности бумаги для разных типов
const PAPER_DENSITIES = {
  'glossy': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 170, label: '170 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' }
  ],
  'semi-matte': [
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
    { value: 120, label: '120 г/м²' },
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
    { value: 170, label: '170 г/м²' }
  ],
  'kraft_300g': [
    { value: 300, label: '300 г/м²' }
  ]
};

// Утилиты для работы с плотностью бумаги
const getPaperDensities = (paperType: string) => {
  return PAPER_DENSITIES[paperType as keyof typeof PAPER_DENSITIES] || PAPER_DENSITIES['semi-matte'];
};

const getDefaultPaperDensity = (paperType: string) => {
  const densities = getPaperDensities(paperType);
  return densities[0]?.value || 130;
};

interface PrintingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (item: any) => void;
}

interface Material {
  id: number;
  name: string;
  unit: string;
  sheet_price_single: number;
  quantity: number;
  category_name: string;
  category_color: string;
}

interface ProductSpecs {
  productType: string; // Теперь поддерживает любые типы продуктов
  format: string; // Формат определяется автоматически по типу продукта
  quantity: number;
  sides: 1 | 2;
  paperType: 'glossy' | 'semi-matte' | 'offset' | 'roll' | 'self-adhesive' | 'transparent' | 'magnetic' | 'kraft' | 'kraft_300g';
  paperDensity: number;
  lamination: 'none' | 'matte' | 'glossy';
  priceType: 'standard' | 'urgent' | 'superUrgent' | 'online' | 'promo' | 'express';
  customerType: 'regular' | 'bronze' | 'silver' | 'gold' | 'platinum';
  // Дополнительные параметры
  pages?: number; // для буклетов
  magnetic?: boolean; // для визиток
  cutting?: boolean; // для постеров
  folding?: boolean; // для буклетов
  roundCorners?: boolean; // для наклеек и этикеток
}

interface CalculationResult {
  productName: string;
  specifications: ProductSpecs;
  materials: Array<{
    material: Material;
    quantity: number;
    cost: number;
  }>;
  services: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  pricePerItem: number;
  productionTime: string;
}

export const PrintingCalculatorModal: React.FC<PrintingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddToOrder
}) => {
  const logger = useLogger('PrintingCalculatorModal');
  
  // Используем новые хуки для управления состояниями
  const materialsState = useDataStates<Material>([]);
  const paperTypesState = useDataStates<any>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedPresets, setSavedPresets] = useState<ProductSpecs[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [productConfigs, setProductConfigs] = useState<Record<string, any>>(defaultProductConfigs);
  const [customFormat, setCustomFormat] = useState({ width: '', height: '' });
  const [isCustomFormat, setIsCustomFormat] = useState(false);
  const [formatValidation, setFormatValidation] = useState<{isValid: boolean, message: string}>({isValid: true, message: ''});
  
  // Состояние калькулятора
  // Функция для определения формата по типу продукта
  const getDefaultFormat = (productType: string): string => {
    const currentConfig = productConfigs[productType];
    if (currentConfig && currentConfig.formats && currentConfig.formats.length > 0) {
      return currentConfig.formats[0];
    }
    return 'A4';
  };

  const getAvailableFormats = (productType: string): string[] => {
    const currentConfig = productConfigs[productType];
    if (currentConfig && currentConfig.formats) {
      return currentConfig.formats;
    }
    return ['A4'];
  };

  // Функция для проверки помещается ли формат на SRA3
  const validateCustomFormat = (width: number, height: number, paperType: string): {isValid: boolean, message: string} => {
    // SRA3 размеры: 320x450 мм
    // Техническое поле принтера: 7 мм с каждой стороны
    // Рабочая область: 306x436 мм
    const SRA3_WORKING_WIDTH = 306; // мм
    const SRA3_WORKING_HEIGHT = 436; // мм
    
    // Для рулонных материалов проверка не нужна
    if (paperType === 'roll') {
      return {isValid: true, message: 'Рулонный материал - проверка не требуется'};
    }
    
    if (width <= 0 || height <= 0) {
      return {isValid: false, message: 'Размеры должны быть больше 0'};
    }
    
    // Проверяем помещается ли в рабочую область SRA3
    const fitsWidth = width <= SRA3_WORKING_WIDTH;
    const fitsHeight = height <= SRA3_WORKING_HEIGHT;
    
    if (fitsWidth && fitsHeight) {
      return {isValid: true, message: `✓ Формат ${width}×${height} мм помещается на SRA3`};
    } else {
      const maxWidth = Math.min(width, SRA3_WORKING_WIDTH);
      const maxHeight = Math.min(height, SRA3_WORKING_HEIGHT);
      return {
        isValid: false, 
        message: `✗ Формат ${width}×${height} мм не помещается на SRA3 (макс. ${maxWidth}×${maxHeight} мм)`
      };
    }
  };

  // Функция для парсинга размеров из строки
  const parseDimensions = (input: string): {width: number, height: number} | null => {
    // Поддерживаем форматы: "100x150", "100 x 150", "100×150", "100 × 150"
    const match = input.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
    if (match) {
      return {
        width: parseFloat(match[1]),
        height: parseFloat(match[2])
      };
    }
    return null;
  };

  // Функция для определения максимального количества по типу продукта
  const getMaxQuantity = (productType: string): number => {
    const maxQuantityMap = {
      'flyers': 50000,        // Флаеры - до 50,000
      'business_cards': 100000, // Визитки - до 100,000 (популярный заказ)
      'booklets': 10000,      // Буклеты - до 10,000
      'posters': 5000,        // Постеры - до 5,000
      'brochures': 20000,     // Брошюры - до 20,000
      'stickers': 100000,     // Наклейки - до 100,000
      'envelopes': 50000,     // Конверты - до 50,000
      'labels': 200000        // Этикетки - до 200,000
    };
    return maxQuantityMap[productType as keyof typeof maxQuantityMap] || 10000;
  };

  const [specs, setSpecs] = useState<ProductSpecs>({
    productType: 'flyers',
    format: 'A6', // Будет обновляться автоматически
    quantity: 100,
    sides: 1,
    paperType: 'office',
    paperDensity: 120,
    lamination: 'none',
    priceType: 'standard',
    customerType: 'regular',
    pages: 4,
    magnetic: false,
    cutting: false,
    folding: false
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);


  useEffect(() => {
    if (isOpen) {
      // Загружаем данные только если они еще не загружены
      if (materialsState.data.length === 0) {
        loadMaterials();
      }
      if (paperTypesState.data.length === 0) {
        loadPaperTypes();
      }
      loadPresets();
      loadProductConfigs();
    }
  }, [isOpen, materialsState.data.length, paperTypesState.data.length]);

  const loadProductConfigs = () => {
    try {
      const saved = localStorage.getItem('calculator-product-configs');
      if (saved) {
        const parsedConfigs = JSON.parse(saved);
        setProductConfigs(parsedConfigs);
      } else {
        setProductConfigs(defaultProductConfigs);
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации продуктов:', error);
      setProductConfigs(defaultProductConfigs);
    }
  };

  // Автоматически обновляем формат при смене типа продукта
  useEffect(() => {
    const newFormat = getDefaultFormat(specs.productType);
    if (specs.format !== newFormat) {
      setSpecs(prev => ({ ...prev, format: newFormat }));
    }
    // Сбрасываем произвольный формат при смене продукта
    setIsCustomFormat(false);
    setCustomFormat({ width: '', height: '' });
    setFormatValidation({isValid: true, message: ''});
  }, [specs.productType]);

  // Автоматически обновляем плотность при смене типа бумаги
  useEffect(() => {
    const newDensity = getDefaultPaperDensity(specs.paperType);
    if (specs.paperDensity !== newDensity) {
      setSpecs(prev => ({ ...prev, paperDensity: newDensity }));
    }
  }, [specs.paperType]);

  // Валидация произвольного формата
  useEffect(() => {
    if (isCustomFormat && customFormat.width && customFormat.height) {
      const dimensions = parseDimensions(`${customFormat.width}x${customFormat.height}`);
      if (dimensions) {
        const validation = validateCustomFormat(dimensions.width, dimensions.height, specs.paperType);
        setFormatValidation(validation);
      } else {
        setFormatValidation({isValid: false, message: 'Неверный формат. Используйте: ширина x высота (например: 100x150)'});
      }
    } else if (isCustomFormat) {
      setFormatValidation({isValid: true, message: 'Введите размеры в формате: ширина x высота'});
    }
  }, [customFormat, isCustomFormat, specs.paperType]);

  // Валидация при изменении specs
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (!specs.quantity || specs.quantity < 1) {
      errors.quantity = 'Количество должно быть больше 0';
    }

    // Валидация произвольного формата
    if (isCustomFormat) {
      if (!customFormat.width || !customFormat.height) {
        errors.format = 'Введите размеры произвольного формата';
      } else if (!formatValidation.isValid) {
        errors.format = formatValidation.message;
      }
    }

    const maxQuantity = getMaxQuantity(specs.productType);
    if (specs.quantity > maxQuantity) {
      errors.quantity = `Количество не может превышать ${maxQuantity.toLocaleString()}`;
    }

    // Проверяем, нужны ли страницы для данного типа продукта
    const currentConfig = productConfigs[specs.productType];
    const needsPages = currentConfig?.pages && currentConfig.pages.length > 0;
    
    if (needsPages && (!specs.pages || specs.pages < 4)) {
      errors.pages = 'Количество страниц должно быть не менее 4';
    }

    if (needsPages && specs.pages && specs.pages % 4 !== 0) {
      errors.pages = 'Количество страниц должно быть кратно 4';
    }

    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0);
  }, [specs]);

  const loadPresets = () => {
    try {
      const saved = localStorage.getItem('printing-calculator-presets');
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Failed to load presets', err);
    }
  };

  const loadMaterials = async () => {
    await materialsState.execute(async () => {
      logger.info('Loading materials...');
      const response = await getMaterials();
      const materialsData = response.data || response;
      logger.debug('Materials loaded successfully', { count: materialsData.length });
      
      // Преобразуем данные в нужный формат
      const formattedMaterials = materialsData
        .filter((m: any) => m.sheet_price_single > 0)
        .map((material: any) => ({
          ...material,
          category_name: material.category_name || 'Бумага',
          category_color: material.category_color || '#007bff'
        }));
      
      logger.debug('Materials formatted successfully', { count: formattedMaterials.length });
      return formattedMaterials;
    }, {
      updateData: (formattedMaterials) => formattedMaterials
    });
  };

  const loadPaperTypes = async () => {
    await paperTypesState.execute(async () => {
      logger.info('Loading paper types...');
      const response = await getPaperTypes();
      logger.debug('Paper types loaded successfully', { count: (response.data || response).length });
      return response.data || response;
    }, {
      updateData: (paperTypes) => paperTypes,
      onError: () => {
        logger.warn('Failed to load paper types, using fallback');
        // Fallback: используем статичные типы бумаги
        const fallbackPaperTypes = [
          { id: 1, name: 'semi-matte', display_name: 'Полуматовая', weight_grams: 130, price_multiplier: 1.0, search_keywords: 'полуматовая,мелованная,130г' },
          { id: 2, name: 'glossy', display_name: 'Глянцевая', weight_grams: 130, price_multiplier: 1.1, search_keywords: 'глянцевая,мелованная,130г' },
          { id: 3, name: 'offset', display_name: 'Офсетная', weight_grams: 80, price_multiplier: 0.8, search_keywords: 'офсетная,80г,обычная' },
          { id: 4, name: 'roll', display_name: 'Рулонная', weight_grams: 130, price_multiplier: 0.9, search_keywords: 'рулонная,пленка,самоклейка' },
          { id: 5, name: 'self-adhesive', display_name: 'Самоклеящаяся', weight_grams: 130, price_multiplier: 1.3, search_keywords: 'самоклейка,наклейка,130г' },
          { id: 6, name: 'transparent', display_name: 'Прозрачная', weight_grams: 130, price_multiplier: 1.5, search_keywords: 'прозрачная,пленка,130г' },
          { id: 7, name: 'magnetic', display_name: 'Магнитная', weight_grams: 300, price_multiplier: 2.0, search_keywords: 'магнитная,визитка,300г' },
          { id: 8, name: 'kraft', display_name: 'Крафт', weight_grams: 130, price_multiplier: 0.9, search_keywords: 'крафт,коричневая,130г' }
        ];
        paperTypesState.setData(fallbackPaperTypes);
        logger.info('Fallback paper types set', { count: fallbackPaperTypes.length });
      }
    });
  };

  const validateSpecs = (): boolean => {
    return isValid;
  };

  const savePreset = () => {
    if (!isValid) return;
    
    const presetName = prompt('Введите название пресета:');
    if (!presetName) return;

    const newPreset = { ...specs, name: presetName };
    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('printing-calculator-presets', JSON.stringify(updatedPresets));
  };

  const loadPreset = (preset: ProductSpecs) => {
    setSpecs(preset);
    setValidationErrors({});
  };

  const deletePreset = (index: number) => {
    const newPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(newPresets);
    localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
  };


  const calculatePrice = async () => {
    if (!isValid) {
      setError('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      // Находим подходящую бумагу
      const paper = findMatchingPaper();
      if (!paper) {
        setError('Не найдена подходящая бумага');
        return;
      }

      // Расчет количества листов
      const sheetsNeeded = calculateSheetsNeeded();
      
      // Расчет стоимости материалов
      const materialCost = sheetsNeeded * paper.sheet_price_single;
      
      // Расчет стоимости печати
      const printingPricePerSheet = printingPrices[specs.paperType][specs.paperDensity as keyof typeof printingPrices[typeof specs.paperType]] || 0;
      const printingCost = sheetsNeeded * printingPricePerSheet * specs.sides;
      
      // Расчет стоимости ламинации
      const laminationCost = specs.lamination !== 'none' ? sheetsNeeded * 0.5 : 0;
      
      // Расчет дополнительных услуг
      const servicesCost = calculateServicesCost();
      
      // Базовая стоимость производства
      const productionCost = materialCost + printingCost + laminationCost + servicesCost;
      
      // Используем DynamicPricingService для расчета цены за штуку
      const pricingResult = await DynamicPricingService.calculateDynamicPrice({
        productType: specs.productType,
        format: specs.format,
        quantity: specs.quantity,
        urgency: specs.priceType,
        paperType: specs.paperType,
        lamination: specs.lamination,
        sides: specs.sides
      });
      
      // Время производства
      const productionTime = getProductionTime();
      
      const calculationResult: CalculationResult = {
        productName: `${productConfigs[specs.productType].name} ${specs.format}`,
        specifications: { ...specs },
        materials: [{
          material: paper,
          quantity: sheetsNeeded,
          cost: materialCost
        }],
        services: [
          {
            name: 'Печать',
            quantity: sheetsNeeded * specs.sides,
            cost: printingCost
          },
          ...(specs.lamination !== 'none' ? [{
            name: `Ламинация ${specs.lamination}`,
            quantity: sheetsNeeded,
            cost: laminationCost
          }] : []),
          ...getServicesList()
        ],
        subtotal: productionCost,
        discount: pricingResult.volumeDiscount * pricingResult.urgencyMultiplier * specs.quantity,
        total: pricingResult.total,
        pricePerItem: pricingResult.finalPrice,
        productionTime
      };
      
      setResult(calculationResult);
    } catch (err) {
      console.error('Ошибка расчета:', err);
      setError('Ошибка при расчете стоимости');
    } finally {
      setIsCalculating(false);
    }
  };

  const findMatchingPaper = (): Material | null => {
    logger.debug('Поиск бумаги для:', { paperType: specs.paperType, paperDensity: specs.paperDensity });
    
    // Находим тип бумаги по названию
    const paperType = paperTypesState.data.find(pt => pt.name === specs.paperType);
    if (!paperType) {
      logger.warn('Тип бумаги не найден:', specs.paperType);
      return null;
    }
    
    logger.debug('Найден тип бумаги:', paperType);
    
    // Ищем материал по ключевым словам
    const keywords = paperType.search_keywords ? 
      paperType.search_keywords.split(',').map((k: string) => k.trim().toLowerCase()) : 
      [paperType.name.toLowerCase()];
    logger.debug('Ключевые слова:', keywords);
    
    for (const keyword of keywords) {
      logger.debug('Ищем по ключевому слову:', keyword);
      
      const material = materialsState.data.find(m => {
        const nameLower = m.name.toLowerCase();
        const hasKeyword = nameLower.includes(keyword);
        const hasDensity = nameLower.includes(`${specs.paperDensity}г`) || 
                          nameLower.includes(`${specs.paperDensity}г/м²`) ||
                          nameLower.includes(`${specs.paperDensity}г/м2`);
        const hasSRA3 = nameLower.includes('sra3'); // Все материалы теперь SRA3
        
        console.log(`Материал: ${m.name}, keyword: ${hasKeyword}, density: ${hasDensity}, sra3: ${hasSRA3}`);
        
        return hasKeyword && hasDensity && hasSRA3;
      });
      
      if (material) {
        console.log('Найден материал:', material);
        return material;
      }
    }
    
    console.log('Материал не найден');
    return null;
  };

  const calculateSheetsNeeded = (): number => {
    // SRA3 размеры: 320x450 мм, рабочая область: 306x436 мм (минус 7 мм с каждой стороны)
    const SRA3_WORKING_WIDTH = 306; // мм
    const SRA3_WORKING_HEIGHT = 436; // мм
    
    let up = 1; // количество штук на листе SRA3
    
    // Проверяем, является ли формат произвольным
    if (isCustomFormat && customFormat.width && customFormat.height) {
      const dimensions = parseDimensions(`${customFormat.width}x${customFormat.height}`);
      if (dimensions) {
        // Рассчитываем количество штук на листе SRA3
        const piecesWidth = Math.floor(SRA3_WORKING_WIDTH / dimensions.width);
        const piecesHeight = Math.floor(SRA3_WORKING_HEIGHT / dimensions.height);
        up = piecesWidth * piecesHeight;
      }
    } else {
      // Стандартные форматы
      const upOnSRA3 = {
        'A6': 8, 'A5': 4, 'A4': 2, 'A3': 1, 'A2': 0.5, 'A1': 0.25, 'A0': 0.125,
        'стандартные': 24 // визитки 9×5 см на SRA3
      };
      up = upOnSRA3[specs.format as keyof typeof upOnSRA3] || 1;
    }
    
    const wasteRatio = 0.05; // 5% отходов
    return Math.ceil(specs.quantity / up * (1 + wasteRatio));
  };

  const calculateServicesCost = (): number => {
    let cost = 0;
    
    // Резка
    if (specs.cutting) {
      cost += specs.quantity * 0.1; // 10 коп за резку
    }
    
    // Фальцовка
    if (specs.folding) {
      cost += specs.quantity * 0.2; // 20 коп за фальцовку
    }
    
    // Магнитные визитки
    if (specs.magnetic) {
      cost += specs.quantity * 0.5; // 50 коп за магнит
    }
    
    return cost;
  };

  const getServicesList = () => {
    const services = [];
    
    if (specs.cutting) {
      services.push({
        name: 'Резка',
        quantity: specs.quantity,
        cost: specs.quantity * 0.1
      });
    }
    
    if (specs.folding) {
      services.push({
        name: 'Фальцовка',
        quantity: specs.quantity,
        cost: specs.quantity * 0.2
      });
    }
    
    if (specs.magnetic) {
      services.push({
        name: 'Магнитная основа',
        quantity: specs.quantity,
        cost: specs.quantity * 0.5
      });
    }
    
    return services;
  };

  const getProductionTime = (): string => {
    const baseTime = {
      standard: 3,
      urgent: 1,
      superUrgent: 1,
      online: 3,
      promo: 7,
      express: 1
    };
    
    const days = baseTime[specs.priceType];
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
  };

  const handleAddToOrder = async () => {
    if (!result) return;
    
    try {
      // Рассчитываем количество листов SRA3
      const sheetsNeeded = calculateSheetsNeeded();
      
      // Рассчитываем количество штук на листе
      let piecesPerSheet = 1;
      if (isCustomFormat && customFormat.width && customFormat.height) {
        const dimensions = parseDimensions(`${customFormat.width}x${customFormat.height}`);
        if (dimensions) {
          const piecesWidth = Math.floor(306 / dimensions.width);
          const piecesHeight = Math.floor(436 / dimensions.height);
          piecesPerSheet = piecesWidth * piecesHeight;
        }
      } else {
        const upOnSRA3 = {
          'A6': 8, 'A5': 4, 'A4': 2, 'A3': 1, 'A2': 0.5, 'A1': 0.25, 'A0': 0.125,
          'стандартные': 24
        };
        piecesPerSheet = upOnSRA3[specs.format as keyof typeof upOnSRA3] || 1;
      }

      const orderItem = {
        name: result.productName,
        description: `${result.productName} - ${specs.format}, ${specs.sides === 2 ? 'двусторонние' : 'односторонние'}, ${specs.paperType} ${specs.paperDensity}г/м²${specs.lamination !== 'none' ? `, ламинация ${specs.lamination}` : ''}`,
        quantity: specs.quantity,
        price: result.pricePerItem,
        total: result.total,
        specifications: specs,
        materials: result.materials,
        services: result.services,
        productionTime: result.productionTime,
        // Дополнительная информация для заказа
        productType: specs.productType,
        urgency: specs.priceType,
        customerType: specs.customerType,
        estimatedDelivery: new Date(Date.now() + getProductionDays() * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Информация о листах SRA3
        sheetsNeeded: sheetsNeeded,
        piecesPerSheet: piecesPerSheet,
        formatInfo: isCustomFormat ? 
          `Произвольный формат ${customFormat.width}×${customFormat.height} мм` : 
          specs.format === 'стандартные' ? 'Стандартные визитки 9×5 см' : specs.format
      };
      
      onAddToOrder(orderItem);
      onClose();
    } catch (err) {
      logger.error('Failed to add item to order', err);
      setError('Не удалось добавить товар в заказ');
    }
  };

  const getProductionDays = (): number => {
    const baseDays = {
      rush: 1,
      online: 3,
      promo: 7
    };
    return baseDays[specs.priceType];
  };

  const updateSpecs = (updates: Partial<ProductSpecs>) => {
    setSpecs(prev => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  const currentConfig = productConfigs[specs.productType];

  return (
    <div className="printing-calculator-overlay">
      {/* Показываем ошибки загрузки данных */}
      {materialsState.error && (
        <div className="mb-4">
          <ErrorDisplay
            error={materialsState.error}
            onRetry={materialsState.retry}
            onDismiss={materialsState.clearError}
          />
        </div>
      )}
      
      {paperTypesState.error && (
        <div className="mb-4">
          <ErrorDisplay
            error={paperTypesState.error}
            onRetry={paperTypesState.retry}
            onDismiss={paperTypesState.clearError}
          />
        </div>
      )}
      <div className="printing-calculator">
        <div className="calculator-header">
          <h2>Калькулятор типографии</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="calculator-content">
          {(materialsState.loading || paperTypesState.loading) && <div className="loading">Загрузка...</div>}
          {error && <div className="error">{error}</div>}

          {/* Пресеты */}
          {savedPresets.length > 0 && (
            <div className="form-section">
              <h3>Сохраненные пресеты</h3>
              <div className="presets-grid">
                {savedPresets.map((preset, index) => (
                  <div key={index} className="preset-item">
                    <div className="preset-info">
                      <h4>{(preset as any).name || `${productConfigs[preset.productType].name} ${preset.format}`}</h4>
                      <p className="preset-details">
                        {preset.quantity.toLocaleString()} шт. • {preset.paperType} {preset.paperDensity}г/м² • {preset.priceType}
                      </p>
                      <p className="preset-extra">
                        {preset.sides === 2 ? 'Двусторонние' : 'Односторонние'} • 
                        {preset.lamination !== 'none' ? ` ${preset.lamination} ламинация` : ' без ламинации'}
                        {preset.magnetic && ' • Магнитные'}
                        {preset.cutting && ' • Резка'}
                        {preset.folding && ' • Фальцовка'}
                      </p>
                    </div>
                    <div className="preset-actions">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => loadPreset(preset)}
                        title="Загрузить пресет"
                      >
                        📥 Загрузить
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => deletePreset(index)}
                        title="Удалить пресет"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Выбор типа продукта */}
          <div className="form-section">
            <h3>Тип продукта</h3>
            <div className="product-type-grid">
              {Object.entries(productConfigs).map(([key, config]) => (
                <button
                  key={key}
                  className={`product-type-btn ${specs.productType === key ? 'active' : ''}`}
                  onClick={() => updateSpecs({ productType: key })}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>

          {/* Параметры продукта */}
          <div className="form-section">
            <h3>Параметры</h3>
            <div className="params-grid">
              <div className="param-group">
                <label>Формат:</label>
                <div className="format-selection">
                  <div className="format-options">
                    {getAvailableFormats(specs.productType).map(format => (
                      <label key={format} className="format-option">
                        <input
                          type="radio"
                          name="format"
                          value={format}
                          checked={!isCustomFormat && specs.format === format}
                          onChange={() => {
                            setSpecs(prev => ({ ...prev, format }));
                            setIsCustomFormat(false);
                          }}
                        />
                        <span className="format-label">
                          {format === 'стандартные' ? '9×5 см (стандартные визитки)' : format}
                        </span>
                      </label>
                    ))}
                    <label className="format-option custom-format-option">
                      <input
                        type="radio"
                        name="format"
                        checked={isCustomFormat}
                        onChange={() => setIsCustomFormat(true)}
                      />
                      <span className="format-label">Произвольный формат</span>
                    </label>
                  </div>
                  
                  {isCustomFormat && (
                    <div className="custom-format-input">
                      <div className="dimensions-inputs">
                        <div className="dimension-input">
                          <label>Ширина (мм):</label>
                          <input
                            type="number"
                            value={customFormat.width}
                            onChange={(e) => {
                              const width = e.target.value;
                              setCustomFormat(prev => ({ ...prev, width }));
                              if (width && customFormat.height) {
                                setSpecs(prev => ({ ...prev, format: `${width}x${customFormat.height}` }));
                              }
                            }}
                            placeholder="100"
                            className="form-control"
                            min="1"
                            step="0.1"
                          />
                        </div>
                        <div className="dimension-separator">×</div>
                        <div className="dimension-input">
                          <label>Высота (мм):</label>
                          <input
                            type="number"
                            value={customFormat.height}
                            onChange={(e) => {
                              const height = e.target.value;
                              setCustomFormat(prev => ({ ...prev, height }));
                              if (customFormat.width && height) {
                                setSpecs(prev => ({ ...prev, format: `${customFormat.width}x${height}` }));
                              }
                            }}
                            placeholder="150"
                            className="form-control"
                            min="1"
                            step="0.1"
                          />
                        </div>
                      </div>
                      <div className={`format-validation ${formatValidation.isValid ? 'valid' : 'invalid'}`}>
                        {formatValidation.message}
                      </div>
                      {validationErrors.format && (
                        <div className="validation-error">
                          {validationErrors.format}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!isCustomFormat && specs.format === 'стандартные' && (
                    <div className="format-note">
                      24 штуки на листе SRA3
                    </div>
                  )}
                  
                  {isCustomFormat && customFormat.width && customFormat.height && (
                    <div className="format-note">
                      {(() => {
                        const dimensions = parseDimensions(`${customFormat.width}x${customFormat.height}`);
                        if (dimensions) {
                          const piecesWidth = Math.floor(306 / dimensions.width);
                          const piecesHeight = Math.floor(436 / dimensions.height);
                          const totalPieces = piecesWidth * piecesHeight;
                          return `${totalPieces} штук на листе SRA3 (${piecesWidth}×${piecesHeight})`;
                        }
                        return '';
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="param-group">
                <label>Количество:</label>
                <div className="quantity-input-group">
                  <button 
                    type="button"
                    className="quantity-btn quantity-btn-minus"
                    onClick={() => {
                      const currentQuantity = specs.quantity || 1;
                      const newQuantity = Math.max(1, currentQuantity - 1);
                      updateSpecs({ quantity: newQuantity });
                    }}
                    disabled={(specs.quantity || 1) <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={specs.quantity || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        // Разрешаем пустое значение для удобства ввода
                        updateSpecs({ quantity: 0 });
                      } else {
                        const numValue = Number(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          updateSpecs({ quantity: numValue });
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const step = e.ctrlKey ? 100 : 1;
                        const newQuantity = Math.min(getMaxQuantity(specs.productType), (specs.quantity || 1) + step);
                        updateSpecs({ quantity: newQuantity });
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const step = e.ctrlKey ? 100 : 1;
                        const newQuantity = Math.max(1, (specs.quantity || 1) - step);
                        updateSpecs({ quantity: newQuantity });
                      } else if (e.key === 'PageUp') {
                        e.preventDefault();
                        const newQuantity = Math.min(getMaxQuantity(specs.productType), (specs.quantity || 1) + 10);
                        updateSpecs({ quantity: newQuantity });
                      } else if (e.key === 'PageDown') {
                        e.preventDefault();
                        const newQuantity = Math.max(1, (specs.quantity || 1) - 10);
                        updateSpecs({ quantity: newQuantity });
                      } else if (e.key === 'Delete' || e.key === 'Backspace') {
                        // Разрешаем удаление содержимого
                        const target = e.target as HTMLInputElement;
                        if (target.selectionStart === 0 && target.selectionEnd === target.value.length) {
                          updateSpecs({ quantity: 0 });
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // При фокусе выделяем весь текст для удобства замены
                      (e.target as HTMLInputElement).select();
                    }}
                    onBlur={(e) => {
                      // При потере фокуса устанавливаем минимальное значение если поле пустое
                      const target = e.target as HTMLInputElement;
                      if (target.value === '' || Number(target.value) < 1) {
                        updateSpecs({ quantity: 1 });
                      }
                    }}
                    min="1"
                    max={getMaxQuantity(specs.productType)}
                    className={`form-control quantity-input ${validationErrors.quantity ? 'error' : ''}`}
                    placeholder={`1 - ${getMaxQuantity(specs.productType).toLocaleString()}`}
                  />
                  <button 
                    type="button"
                    className="quantity-btn quantity-btn-plus"
                    onClick={() => {
                      const currentQuantity = specs.quantity || 1;
                      const newQuantity = Math.min(getMaxQuantity(specs.productType), currentQuantity + 1);
                      updateSpecs({ quantity: newQuantity });
                    }}
                    disabled={(specs.quantity || 1) >= getMaxQuantity(specs.productType)}
                  >
                    +
                  </button>
                </div>
                <div className="quantity-hint">
                  Максимум: {getMaxQuantity(specs.productType).toLocaleString()} штук
                  <br />
                  <span className="keyboard-hint">
                    ↑↓ для ±1, Ctrl+↑↓ для ±100, Page Up/Down для ±10
                  </span>
                </div>
                {validationErrors.quantity && (
                  <span className="validation-error">{validationErrors.quantity}</span>
                )}
              </div>

              {currentConfig.sides && (
                <div className="param-group">
                  <label>Стороны:</label>
                  <select
                    value={specs.sides}
                    onChange={(e) => updateSpecs({ sides: Number(e.target.value) as 1 | 2 })}
                    className="form-control"
                  >
                    <option value={1}>Односторонние</option>
                    <option value={2}>Двусторонние</option>
                  </select>
                </div>
              )}

              <div className="param-group">
                <label>Тип бумаги:</label>
                <select
                  value={specs.paperType}
                  onChange={(e) => updateSpecs({ paperType: e.target.value as ProductSpecs['paperType'] })}
                  className="form-control"
                >
                  {paperTypesState.data.map(paperType => (
                    <option key={paperType.id} value={paperType.name}>
                      {paperType.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="param-group">
                <label>Плотность (г/м²):</label>
                <select
                  value={specs.paperDensity}
                  onChange={(e) => updateSpecs({ paperDensity: Number(e.target.value) })}
                  className="form-control"
                >
                  {getPaperDensities(specs.paperType).map((density) => (
                    <option key={density.value} value={density.value}>
                      {density.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="param-group">
                <label>Ламинация:</label>
                <select
                  value={specs.lamination}
                  onChange={(e) => updateSpecs({ lamination: e.target.value as ProductSpecs['lamination'] })}
                  className="form-control"
                >
                  <option value="none">Без ламинации</option>
                  <option value="matte">Матовая</option>
                  <option value="glossy">Глянцевая</option>
                </select>
              </div>

              <div className="param-group">
                <label>Срочность:</label>
                <select
                  value={specs.priceType}
                  onChange={(e) => updateSpecs({ priceType: e.target.value as ProductSpecs['priceType'] })}
                  className="form-control"
                >
                  <option value="rush">Срочно (1-2 дня)</option>
                  <option value="online">Онлайн (3-5 дней)</option>
                  <option value="promo">Промо (7-14 дней)</option>
                </select>
              </div>

              <div className="param-group">
                <label>Тип клиента:</label>
                <select
                  value={specs.customerType}
                  onChange={(e) => updateSpecs({ customerType: e.target.value as ProductSpecs['customerType'] })}
                  className="form-control"
                >
                  <option value="regular">Обычный</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              {/* Дополнительные параметры */}
              {currentConfig.pages && (
                <div className="param-group">
                  <label>Страниц:</label>
                  <div className="pages-input-group">
                    <button 
                      type="button"
                      className="pages-btn pages-btn-prev"
                      onClick={() => {
                        const currentIndex = currentConfig.pages!.indexOf(specs.pages || 4);
                        if (currentIndex > 0) {
                          updateSpecs({ pages: currentConfig.pages![currentIndex - 1] });
                        }
                      }}
                      disabled={currentConfig.pages!.indexOf(specs.pages || 4) <= 0}
                    >
                      ‹
                    </button>
                    <select
                      value={specs.pages || 4}
                      onChange={(e) => updateSpecs({ pages: Number(e.target.value) })}
                      className={`form-control pages-select ${validationErrors.pages ? 'error' : ''}`}
                    >
                      {currentConfig.pages.map((pages: number) => (
                        <option key={pages} value={pages}>{pages} стр.</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      className="pages-btn pages-btn-next"
                      onClick={() => {
                        const currentIndex = currentConfig.pages!.indexOf(specs.pages || 4);
                        if (currentIndex < currentConfig.pages!.length - 1) {
                          updateSpecs({ pages: currentConfig.pages![currentIndex + 1] });
                        }
                      }}
                      disabled={currentConfig.pages!.indexOf(specs.pages || 4) >= currentConfig.pages!.length - 1}
                    >
                      ›
                    </button>
                  </div>
                  {validationErrors.pages && (
                    <span className="validation-error">{validationErrors.pages}</span>
                  )}
                </div>
              )}

              {currentConfig.magnetic && (
                <div className="param-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={specs.magnetic || false}
                      onChange={(e) => updateSpecs({ magnetic: e.target.checked })}
                    />
                    Магнитные
                  </label>
                </div>
              )}

              {currentConfig.folding && (
                <div className="param-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={specs.folding || false}
                      onChange={(e) => updateSpecs({ folding: e.target.checked })}
                    />
                    Фальцовка
                  </label>
                </div>
              )}

              {currentConfig.cutting && (
                <div className="param-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={specs.cutting || false}
                      onChange={(e) => updateSpecs({ cutting: e.target.checked })}
                    />
                    Резка
                  </label>
                </div>
              )}

              {currentConfig.roundCorners && (
                <div className="param-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={specs.roundCorners || false}
                      onChange={(e) => updateSpecs({ roundCorners: e.target.checked })}
                    />
                    Скругление углов
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Результат расчета */}
          {result && (
            <div className="form-section">
              <h3>Расчет стоимости</h3>
              <div className="calculation-result">
                <div className="result-summary">
                  <div className="result-item">
                    <span>Стоимость за штуку:</span>
                    <span className="price">{result.pricePerItem.toFixed(2)} BYN</span>
                  </div>
                  <div className="result-item">
                    <span>Общая стоимость:</span>
                    <span className="price total">{result.total.toFixed(2)} BYN</span>
                  </div>
                  <div className="result-item">
                    <span>Время производства:</span>
                    <span className="time">{result.productionTime}</span>
                  </div>
                  <div className="result-item sheets-info">
                    <span>Листов SRA3:</span>
                    <span className="sheets-count">
                      {(() => {
                        const sheetsNeeded = calculateSheetsNeeded();
                        let piecesPerSheet = 1;
                        if (isCustomFormat && customFormat.width && customFormat.height) {
                          const dimensions = parseDimensions(`${customFormat.width}x${customFormat.height}`);
                          if (dimensions) {
                            const piecesWidth = Math.floor(306 / dimensions.width);
                            const piecesHeight = Math.floor(436 / dimensions.height);
                            piecesPerSheet = piecesWidth * piecesHeight;
                          }
                        } else {
                          const upOnSRA3 = {
                            'A6': 8, 'A5': 4, 'A4': 2, 'A3': 1, 'A2': 0.5, 'A1': 0.25, 'A0': 0.125,
                            'стандартные': 24
                          };
                          piecesPerSheet = upOnSRA3[specs.format as keyof typeof upOnSRA3] || 1;
                        }
                        return `${sheetsNeeded} листов (${piecesPerSheet} шт. на листе)`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="cost-breakdown">
                  <h4>Детализация:</h4>
                  {result.materials.map((item, index) => (
                    <div key={index} className="cost-item">
                      <span>{item.material.name} ({item.quantity} шт.):</span>
                      <span>{item.cost.toFixed(2)} BYN</span>
                    </div>
                  ))}
                  {result.services.map((service, index) => (
                    <div key={index} className="cost-item">
                      <span>{service.name} ({service.quantity} шт.):</span>
                      <span>{service.cost.toFixed(2)} BYN</span>
                    </div>
                  ))}
                  <div className="cost-item subtotal">
                    <span>Промежуточный итог:</span>
                    <span>{result.subtotal.toFixed(2)} BYN</span>
                  </div>
                  {result.discount > 0 && (
                    <div className="cost-item discount">
                      <span>VIP скидка:</span>
                      <span>-{result.discount.toFixed(2)} BYN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="calculator-actions">
            <div className="action-group">
              <button
                onClick={calculatePrice}
                className="btn btn-primary"
                disabled={materialsState.loading || paperTypesState.loading || isCalculating}
              >
                {isCalculating ? 'Расчет...' : 'Рассчитать'}
              </button>
              
              <button
                onClick={savePreset}
                className="btn btn-outline"
                disabled={!isValid}
              >
                Сохранить пресет
              </button>
            </div>
            
            {result && (
              <div className="action-group">
                <button
                  onClick={handleAddToOrder}
                  className="btn btn-success"
                >
                  Добавить в заказ
                </button>
              </div>
            )}
            
            <div className="action-group">
              <button
                onClick={onClose}
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
