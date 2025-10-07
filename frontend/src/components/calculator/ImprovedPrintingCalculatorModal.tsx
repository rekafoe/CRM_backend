import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMaterials, createOrder, getPaperTypes, findPaperTypeByMaterial, getPrintingPrice } from '../../api';
import { productConfigs as defaultProductConfigs, urgencyMultipliers, vipDiscounts, volumeDiscounts } from '../../config/calculatorConfig';
import { AIService } from '../../services/aiService';
import { DynamicPricingService } from '../../services/dynamicPricingService';
import { 
  getPaperTypesFromWarehouse,
  getPaperDensitiesForType,
  checkMaterialAvailability,
  calculateMaterialCost,
  // 🆕 Новые функции для улучшенной интеграции
  getProductConfigsFromWarehouse,
  checkRealtimeAvailability,
  getMaterialAlternatives,
  updateMaterialPrices
} from '../../services/calculatorMaterialService';
import { useLogger } from '../../utils/logger';
import { useToastNotifications } from '../Toast';
import { DataStates, useDataStates } from '../DataStates';
import { ErrorDisplay } from '../ErrorStates';
import { LoadingSpinner } from '../LoadingSpinner';
import { EnhancedProductSelector } from './EnhancedProductSelector';
import { QuickTemplates } from './QuickTemplates';
import { ComparisonModal } from './ComparisonModal';
import { AIDashboard } from './AIDashboard';
import { DynamicPricingManager } from './DynamicPricingManager';
import '../../styles/improved-printing-calculator.css';

// 🆕 Плотности бумаги теперь загружаются динамически из складского сервиса

interface Material {
  id: number;
  name: string;
  category?: string;
  category_name?: string;
  category_color?: string;
}

interface ProductSpecs {
  productType: string;
  format: string;
  quantity: number;
  sides: 1 | 2;
  paperType: 'semi-matte' | 'glossy' | 'offset' | 'roll' | 'self-adhesive' | 'transparent' | 'magnetic' | 'kraft' | 'kraft_300g' | 'office' | 'coated' | 'designer';
  paperDensity: number;
  lamination: 'none' | 'matte' | 'glossy';
  priceType: 'standard' | 'urgent' | 'superUrgent' | 'online' | 'promo' | 'express';
  customerType: 'regular' | 'vip';
  pages?: number;
  magnetic?: boolean;
  cutting?: boolean;
  folding?: boolean;
  roundCorners?: boolean;
  // Новые поля для расширенных продуктов
  urgency?: 'standard' | 'urgent' | 'superUrgent';
  vipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  specialServices?: string[]; // перфорация, сверление, скругление углов
  materialType?: 'office' | 'coated' | 'designer' | 'selfAdhesive';
}

interface CalculationResult {
  productName: string;
  specifications: ProductSpecs;
  materials: Array<{
    material: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }>;
  services: Array<{
    service: string;
    price: number;
    total: number;
  }>;
  totalCost: number;
  pricePerItem: number;
  productionTime: string;
}

interface ImprovedPrintingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (item: any) => void;
  initialProductType?: string;
}

export const ImprovedPrintingCalculatorModal: React.FC<ImprovedPrintingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddToOrder,
  initialProductType
}) => {
  const logger = useLogger('ImprovedPrintingCalculatorModal');
  const toast = useToastNotifications();
  
  // Состояния данных
  const materialsState = useDataStates<Material>([]);
  const paperTypesState = useDataStates<any>([]);
  
  // Локальные состояния
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
  const [specs, setSpecs] = useState<ProductSpecs>({
    productType: initialProductType || 'flyers',
    format: 'A6',
    quantity: 100,
    sides: 1,
    paperType: 'semi-matte' as any, // Будет установлен динамически из складского сервиса
    paperDensity: 0, // Будет установлен динамически из складского сервиса
    lamination: 'none',
    priceType: 'standard',
    customerType: 'regular',
    pages: 4,
    magnetic: false,
    cutting: false,
    folding: false,
    roundCorners: false,
    // Новые поля для расширенных продуктов
    urgency: 'standard',
    vipLevel: 'bronze',
    specialServices: [],
    materialType: 'coated'
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState<CalculationResult[]>([]);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(!initialProductType);
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showAIDashboard, setShowAIDashboard] = useState(false);
  const [showDynamicPricingManager, setShowDynamicPricingManager] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<Array<{
    id: string;
    name: string;
    specs: ProductSpecs;
    result: CalculationResult;
    isSelected: boolean;
  }>>([]);
  
  // 🆕 Состояния для интеграции со складом
  const [warehousePaperTypes, setWarehousePaperTypes] = useState<any[]>([]);
  const [dynamicDensities, setDynamicDensities] = useState<Array<{value: number, label: string, price: number, material_id: number, available_quantity: number}>>([]);
  
  // 🆕 Новые состояния для улучшенной интеграции
  const [warehouseProductConfigs, setWarehouseProductConfigs] = useState<Record<string, any>>({});
  const [materialAlternatives, setMaterialAlternatives] = useState<any[]>([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>('');
  
  const [materialAvailability, setMaterialAvailability] = useState<{
    available: boolean;
    message?: string;
    available_quantity?: number;
  }>({ available: true });
  const [loadingPaperTypes, setLoadingPaperTypes] = useState(false);

  // Мемоизированные значения
  const currentConfig = useMemo(() => {
    const config = productConfigs[specs.productType];
    if (!config) {
      console.warn(`Product config not found for type: ${specs.productType}`);
      return { name: 'Товар из калькулятора', formats: [], paperDensities: [], laminations: [], sides: [] };
    }
    return config;
  }, [productConfigs, specs.productType]);
  const availableFormats = useMemo(() => {
    if (!currentConfig?.formats) return ['A4'];
    return currentConfig.formats;
  }, [currentConfig]);
  
  const availableDensities = useMemo(() => {
    return dynamicDensities;
  }, [dynamicDensities]);

  // Функции для работы с конфигурацией
  const getDefaultFormat = useCallback((productType: string): string => {
    const config = productConfigs[productType];
    if (config && config.formats && config.formats.length > 0) {
      return config.formats[0];
    }
    return 'A4';
  }, [productConfigs]);

  const getMaxQuantity = useCallback((productType: string): number => {
    const maxQuantityMap = {
      'flyers': 50000,
      'business_cards': 100000,
      'booklets': 10000,
      'posters': 5000,
      'brochures': 20000,
      'stickers': 100000,
      'envelopes': 50000,
      'labels': 200000
    };
    return maxQuantityMap[productType as keyof typeof maxQuantityMap] || 10000;
  }, []);

  const getDefaultPaperDensity = useCallback((paperType: string): number => {
    // Сначала пытаемся найти плотности для текущего типа бумаги
    if (dynamicDensities.length > 0) {
      return dynamicDensities[0].value;
    }
    
    // Если плотности еще не загружены, ищем в warehousePaperTypes
    const paperTypeData = warehousePaperTypes.find(pt => pt.name === paperType);
    if (paperTypeData && paperTypeData.densities && paperTypeData.densities.length > 0) {
      return paperTypeData.densities[0].value;
    }
    
    // Fallback значение
    return 130;
  }, [dynamicDensities, warehousePaperTypes]);

  const loadProductConfigs = useCallback(() => {
    try {
      const saved = localStorage.getItem('calculator-product-configs');
      let parsedConfigs = {};
      
      if (saved) {
        parsedConfigs = JSON.parse(saved);
        logger.info('Конфигурация продуктов загружена из localStorage', { count: Object.keys(parsedConfigs).length });
      }
      
      // Объединяем сохраненную конфигурацию с конфигурацией по умолчанию
      // Это гарантирует, что новые продукты всегда будут доступны
      const mergedConfigs = {
        ...defaultProductConfigs,
        ...parsedConfigs
      };
      
      setProductConfigs(mergedConfigs);
      logger.info('Конфигурация продуктов объединена', { 
        default: Object.keys(defaultProductConfigs).length,
        saved: Object.keys(parsedConfigs).length,
        total: Object.keys(mergedConfigs).length
      });
      
      // Сохраняем обновленную конфигурацию обратно в localStorage
      localStorage.setItem('calculator-product-configs', JSON.stringify(mergedConfigs));
      
    } catch (error) {
      logger.error('Ошибка загрузки конфигурации продуктов', error);
      toast.error('Ошибка загрузки конфигурации продуктов');
      setProductConfigs(defaultProductConfigs);
    }
  }, [logger, toast]);

  const loadMaterials = useCallback(async () => {
    try {
      const response = await getMaterials();
      const materials = Array.isArray(response) ? response : (response.data || []);
      materialsState.setData(materials);
      logger.info('Материалы загружены', { count: materials.length });
    } catch (error) {
      logger.error('Ошибка загрузки материалов', error);
      materialsState.setError('Ошибка загрузки материалов');
    }
  }, [logger, materialsState]);

  // 🆕 Загрузка типов бумаги из складского сервиса
  const loadPaperTypesFromWarehouse = useCallback(async () => {
    setLoadingPaperTypes(true);
    try {
      const paperTypes = await getPaperTypesFromWarehouse();
      setWarehousePaperTypes(paperTypes);
      logger.info('✅ Типы бумаги загружены из склада', { count: paperTypes.length });
    } catch (error) {
      logger.error('❌ Ошибка загрузки типов бумаги из склада', error);
      toast.error('Ошибка загрузки типов бумаги. Используются данные по умолчанию.');
    } finally {
      setLoadingPaperTypes(false);
    }
  }, [logger, toast]);

  // 🆕 Загрузка конфигурации продуктов из склада
  const loadProductConfigsFromWarehouse = useCallback(async () => {
    try {
      const configs = await getProductConfigsFromWarehouse();
      setWarehouseProductConfigs(configs);
      logger.info('✅ Конфигурация продуктов загружена из склада', { count: Object.keys(configs).length });
    } catch (error) {
      logger.error('❌ Ошибка загрузки конфигурации продуктов из склада', error);
    }
  }, [logger]);

  // 🆕 Проверка доступности материалов в реальном времени
  const checkRealtimeMaterialAvailability = useCallback(async (paperType: string, paperDensity: number, quantity: number) => {
    try {
      const availability = await checkRealtimeAvailability(paperType, paperDensity, quantity);
      setMaterialAvailability(availability);
      
      if (availability.alternatives && availability.alternatives.length > 0) {
        setMaterialAlternatives(availability.alternatives);
        logger.info('🔄 Найдены альтернативные материалы', { count: availability.alternatives.length });
      }
      
      return availability;
    } catch (error) {
      logger.error('❌ Ошибка проверки доступности материалов', error);
      return null;
    }
  }, [logger]);

  // 🆕 Обновление цен материалов
  const updatePrices = useCallback(async () => {
    try {
      const result = await updateMaterialPrices();
      setLastPriceUpdate(new Date().toISOString());
      logger.info('✅ Цены материалов обновлены', { updated: result.updated, errors: result.errors.length });
      
      if (result.errors.length > 0) {
        toast.warning(`Обновлено ${result.updated} цен, ошибок: ${result.errors.length}`);
      } else {
        toast.success(`Успешно обновлено ${result.updated} цен`);
      }
    } catch (error) {
      logger.error('❌ Ошибка обновления цен', error);
      toast.error('Ошибка обновления цен материалов');
    }
  }, [logger, toast]);

  // 🆕 Загрузка плотностей для выбранного типа бумаги
  const loadDensitiesForPaperType = useCallback(async (paperType: string) => {
    try {
      const densities = await getPaperDensitiesForType(paperType);
      setDynamicDensities(densities);
      logger.info('✅ Плотности загружены для типа бумаги', { paperType, count: densities.length });
      
      // Если текущая плотность не доступна, выбираем первую доступную
      if (densities.length > 0 && !densities.find(d => d.value === specs.paperDensity)) {
        setSpecs(prev => ({ ...prev, paperDensity: densities[0].value }));
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки плотностей', error);
      setDynamicDensities([]);
    }
  }, [specs.paperDensity, logger]);

  const loadPaperTypes = useCallback(async () => {
    try {
      const response = await getPaperTypes();
      const paperTypes = Array.isArray(response) ? response : (response.data || []);
      paperTypesState.setData(paperTypes);
      logger.info('Типы бумаги загружены', { count: paperTypes.length });
    } catch (error) {
      logger.error('Ошибка загрузки типов бумаги', error);
      paperTypesState.setError('Ошибка загрузки типов бумаги');
    }
  }, [logger, paperTypesState]);


  // 🆕 useEffect для загрузки плотностей при изменении типа бумаги
  useEffect(() => {
    if (specs.paperType && warehousePaperTypes.length > 0) {
      loadDensitiesForPaperType(specs.paperType);
    }
  }, [specs.paperType, warehousePaperTypes.length]);

  // 🆕 useEffect для проверки доступности материалов в реальном времени
  useEffect(() => {
    if (specs.paperType && specs.paperDensity && specs.quantity > 0) {
      checkRealtimeMaterialAvailability(specs.paperType, specs.paperDensity, specs.quantity);
    }
  }, [specs.paperType, specs.paperDensity, specs.quantity]);

  // 🆕 useEffect для автоматического переключения на тип с плотностями
  useEffect(() => {
    if (warehousePaperTypes.length > 0 && availableDensities.length === 0 && specs.paperType) {
      // Ищем первый тип бумаги с плотностями
      const typeWithDensities = warehousePaperTypes.find(type => type.densities && type.densities.length > 0);
      if (typeWithDensities && typeWithDensities.name !== specs.paperType) {
        setSpecs(prev => ({ ...prev, paperType: typeWithDensities.name }));
      }
    }
  }, [warehousePaperTypes, availableDensities.length, specs.paperType]);

  // 🆕 useEffect для установки начального типа бумаги
  useEffect(() => {
    if (warehousePaperTypes.length > 0 && !specs.paperType) {
      // Ищем первый тип бумаги с плотностями
      const typeWithDensities = warehousePaperTypes.find(type => type.densities && type.densities.length > 0);
      const selectedType = typeWithDensities || warehousePaperTypes[0];
      
      setSpecs(prev => ({ 
        ...prev, 
        paperType: selectedType.name,
        paperDensity: selectedType.densities && selectedType.densities.length > 0 ? selectedType.densities[0].value : 0
      }));
    }
  }, [warehousePaperTypes, specs.paperType]);

  const loadPresets = useCallback(() => {
    try {
      const saved = localStorage.getItem('printing-calculator-presets');
      if (saved) {
        setSavedPresets(JSON.parse(saved));
        logger.info('Пресеты загружены', { count: JSON.parse(saved).length });
      }
    } catch (error) {
      logger.error('Ошибка загрузки пресетов', error);
      toast.error('Ошибка загрузки пресетов');
    }
  }, [logger, toast]);

  const loadCalculationHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('printing-calculator-history');
      if (saved) {
        setCalculationHistory(JSON.parse(saved));
        logger.info('История расчетов загружена', { count: JSON.parse(saved).length });
      }
    } catch (error) {
      logger.error('Ошибка загрузки истории расчетов', error);
    }
  }, [logger]);

  const saveCalculationHistory = useCallback((calculation: CalculationResult) => {
    try {
      const newHistory = [calculation, ...calculationHistory.slice(0, 9)]; // Храним только последние 10
      setCalculationHistory(newHistory);
      localStorage.setItem('printing-calculator-history', JSON.stringify(newHistory));
      logger.info('Расчет сохранен в историю');
    } catch (error) {
      logger.error('Ошибка сохранения в историю', error);
    }
  }, [calculationHistory, logger]);

  // Валидация
  const validateSpecs = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!specs.quantity || specs.quantity < 1) {
      errors.quantity = 'Количество должно быть больше 0';
    }

    const maxQuantity = getMaxQuantity(specs.productType);
    if (specs.quantity > maxQuantity) {
      errors.quantity = `Количество не может превышать ${maxQuantity.toLocaleString()}`;
    }

    const needsPages = currentConfig?.pages && currentConfig.pages.length > 0;
    if (needsPages && (!specs.pages || specs.pages < 4)) {
      errors.pages = 'Количество страниц должно быть не менее 4';
    }

    if (needsPages && specs.pages && specs.pages % 4 !== 0) {
      errors.pages = 'Количество страниц должно быть кратно 4';
    }

    if (isCustomFormat) {
      const width = parseFloat(customFormat.width);
      const height = parseFloat(customFormat.height);
      if (!width || !height || width <= 0 || height <= 0) {
        errors.format = 'Введите корректные размеры формата';
      }
    }

    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0);
  }, [specs, currentConfig, customFormat, isCustomFormat, getMaxQuantity]);

  // 🆕 useEffect для загрузки данных при открытии
  useEffect(() => {
    if (isOpen) {
      if (materialsState.data.length === 0) {
        loadMaterials();
      }
      if (paperTypesState.data.length === 0) {
        loadPaperTypes();
      }
      // Загружаем типы бумаги из складского сервиса (только если не загружаются и нет данных)
      if (!loadingPaperTypes && warehousePaperTypes.length === 0) {
        loadPaperTypesFromWarehouse();
      }
      // 🆕 Загружаем конфигурацию продуктов из склада
      loadProductConfigsFromWarehouse();
      // 🆕 Обновляем цены при открытии
      updatePrices();
      
      loadPresets();
      loadProductConfigs();
      loadCalculationHistory();
      setUserInteracted(false);
    }
  }, [isOpen, loadingPaperTypes, warehousePaperTypes.length, materialsState.data.length, paperTypesState.data.length]);

  useEffect(() => {
    validateSpecs();
  }, [specs, currentConfig, customFormat, isCustomFormat]);

  // 🆕 Проверка доступности материалов при изменении параметров
  useEffect(() => {
    const checkAvailability = async () => {
      if (!specs.paperType || !specs.paperDensity || !specs.quantity) {
        return;
      }

      try {
        const availability = await checkMaterialAvailability(
          specs.paperType,
          specs.paperDensity,
          specs.quantity
        );

        setMaterialAvailability(availability);

        if (!availability.available && availability.message) {
          logger.warn('⚠️ Материал недоступен', { 
            paperType: specs.paperType, 
            density: specs.paperDensity,
            message: availability.message 
          });
        }
      } catch (error) {
        logger.error('Ошибка проверки доступности материалов', error);
      }
    };

    // Задержка для предотвращения частых запросов
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [specs.paperType, specs.paperDensity, specs.quantity, logger]);

  // Выбор типа продукта
  const selectProductType = useCallback((productType: string) => {
    setSpecs(prev => ({ 
      ...prev, 
      productType,
      format: getDefaultFormat(productType),
      paperDensity: getDefaultPaperDensity(prev.paperType)
    }));
    setShowProductSelection(false);
    setUserInteracted(true);
    logger.info('Выбран тип продукта', { productType });
  }, [getDefaultFormat, getDefaultPaperDensity, logger]);

  // Обновление спецификаций
  const updateSpecs = useCallback((updates: Partial<ProductSpecs>) => {
    setSpecs(prev => ({ ...prev, ...updates }));
    setUserInteracted(true); // Отмечаем, что пользователь взаимодействовал с калькулятором
  }, []);

  // Расчет стоимости
  const calculateCost = useCallback(async (showToast: boolean = false) => {
    if (!isValid || Object.keys(validationErrors).length > 0) {
      if (showToast) {
        toast.error('Проверьте правильность заполнения полей');
      }
      return;
    }

    if (specs.quantity <= 0) {
      if (showToast) {
        toast.error('Количество должно быть больше 0');
      }
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Убираем вызов findPaperTypeByMaterial, так как он не нужен для расчета
      // const paper = await findPaperTypeByMaterial(specs.paperType);
      // if (!paper) {
      //   throw new Error('Материал не найден');
      // }

      // Проверяем, что currentConfig существует
      if (!currentConfig) {
        throw new Error('Конфигурация продукта не найдена');
      }

      // Используем новую динамическую систему ценообразования
      const pricingResult = await DynamicPricingService.calculateDynamicPrice({
        productType: specs.productType,
        format: specs.format,
        quantity: specs.quantity,
        urgency: specs.priceType,
        paperType: specs.paperType,
        lamination: specs.lamination,
        sides: specs.sides
      });

      // Проверяем, что результат расчета корректен
      if (!pricingResult || typeof pricingResult.total !== 'number' || pricingResult.total < 0) {
        throw new Error('Некорректный результат расчета цены');
      }

      // Рассчитываем материалы на основе спецификаций
      const materials = [];
      
      // Основная бумага
      const paperTypeName = specs.paperType; // Используем напрямую, так как функция не определена
      materials.push({
        material: `${paperTypeName} ${specs.paperDensity}г/м²`,
        quantity: Math.ceil(specs.quantity / 2), // Примерный расчет листов
        unit: 'лист',
        price: 0.15, // Базовая цена за лист
        total: Math.ceil(specs.quantity / 2) * 0.15
      });
      
      // Ламинация
      if (specs.lamination && specs.lamination !== 'none') {
        const laminationName = specs.lamination; // Используем напрямую
        materials.push({
          material: `Пленка для ламинации ${laminationName}`,
          quantity: Math.ceil(specs.quantity / 2),
          unit: 'лист',
          price: 0.05,
          total: Math.ceil(specs.quantity / 2) * 0.05
        });
      }
      
      // Дополнительные материалы для специальных продуктов
      if (specs.productType === 'business-cards' && specs.magnetic) {
        materials.push({
          material: 'Магнитная основа',
          quantity: specs.quantity,
          unit: 'шт',
          price: 0.20,
          total: specs.quantity * 0.20
        });
      }
      
      if (specs.productType === 'stickers' && specs.cutting) {
        materials.push({
          material: 'Клеящаяся пленка',
          quantity: Math.ceil(specs.quantity / 10),
          unit: 'лист',
          price: 0.25,
          total: Math.ceil(specs.quantity / 10) * 0.25
        });
      }

      const calculationResult: CalculationResult = {
        productName: `${currentConfig?.name || 'Товар из калькулятора'} ${specs.format} (${specs.paperType} ${specs.paperDensity}г/м², ${specs.sides === 2 ? 'двусторонние' : 'односторонние'})`,
        specifications: { ...specs },
        materials: materials,
        services: [],
        totalCost: pricingResult.total,
        pricePerItem: pricingResult.finalPrice,
        productionTime: getProductionTime()
      };

      setResult(calculationResult);
      saveCalculationHistory(calculationResult);
      logger.info('Расчет выполнен успешно', { totalCost: pricingResult.total });
      
      // Показываем уведомление только при ручном расчете
      if (showToast) {
        toast.success('Расчет выполнен успешно!');
      }
    } catch (error) {
      logger.error('Ошибка расчета', error);
      setError('Ошибка при расчете стоимости');
      
      // Показываем уведомление об ошибке только при ручном расчете
      if (showToast) {
        toast.error('Ошибка при расчете стоимости');
      }
    } finally {
      setIsCalculating(false);
    }
  }, [isValid, specs, currentConfig, materialsState.data, logger, toast, saveCalculationHistory]);

  // Автоматический расчет при изменении параметров (только после взаимодействия пользователя)
  useEffect(() => {
    if (userInteracted && isValid && specs.quantity > 0 && Object.keys(validationErrors).length === 0) {
      const timeoutId = setTimeout(() => {
        calculateCost(false); // Передаем false, чтобы не показывать уведомления
      }, 1000); // Увеличиваем задержку до 1 секунды для предотвращения частых вызовов

      return () => clearTimeout(timeoutId);
    }
  }, [userInteracted, specs, isValid, validationErrors]);

  // Вспомогательные функции
  const getProductionTime = useCallback(() => {
    const baseDays = {
      standard: 3,
      urgent: 1,
      superUrgent: 1,
      online: 3,
      promo: 7,
      express: 1
    };
    return `${baseDays[specs.priceType]} ${baseDays[specs.priceType] === 1 ? 'день' : 'дня'}`;
  }, [specs.priceType]);

  const getProductionDays = useCallback(() => {
    const baseDays = {
      standard: 3,
      urgent: 1,
      superUrgent: 1,
      online: 3,
      promo: 7,
      express: 1
    };
    return baseDays[specs.priceType];
  }, [specs.priceType]);

  // Сохранение пресета
  const savePreset = useCallback(() => {
    try {
      const presetName = prompt('Введите название пресета:', `${currentConfig.name} ${specs.format}`);
      if (!presetName) return;

      const newPreset = { ...specs, name: presetName };
      const newPresets = [...savedPresets, newPreset];
      setSavedPresets(newPresets);
      localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
      
      logger.info('Пресет сохранен', { name: presetName });
      toast.success('Пресет сохранен!');
    } catch (error) {
      logger.error('Ошибка сохранения пресета', error);
      toast.error('Ошибка сохранения пресета');
    }
  }, [specs, currentConfig, savedPresets, logger, toast]);

  // Загрузка пресета
  const loadPreset = useCallback((preset: ProductSpecs & { name?: string }) => {
    setSpecs(preset);
    setResult(null);
    setUserInteracted(true); // Отмечаем взаимодействие при загрузке пресета
    logger.info('Пресет загружен', { name: preset.name || 'Без названия' });
    toast.success('Пресет загружен!');
  }, [logger, toast]);

  // Обучение ИИ на данных заказа
  const trainAIOnOrder = useCallback((orderData: any) => {
    try {
      AIService.addTrainingData({
        productType: orderData.productType,
        format: orderData.format,
        quantity: orderData.quantity,
        paperType: orderData.paperType,
        paperDensity: orderData.paperDensity,
        lamination: orderData.lamination,
        urgency: orderData.urgency || 'standard',
        customerType: orderData.customerType || 'regular',
        finalPrice: orderData.finalPrice,
        timestamp: new Date(),
        marketConditions: {
          demandLevel: 0.5, // Базовое значение, можно улучшить
          competitionLevel: 0.5,
          seasonality: 0.5
        }
      });
      logger.info('ИИ обучен на данных заказа', { orderData });
    } catch (error) {
      logger.error('Ошибка обучения ИИ на заказе', error);
    }
  }, [logger]);

  // Добавление в заказ
  const handleAddToOrder = useCallback((customDescription?: string) => {
    if (!result) return;

    const apiItem = {
      type: result.productName,
      params: {
        description: customDescription || `${result.productName} | Количество: ${result.specifications.quantity} шт${result.specifications.lamination !== 'none' ? ` | Ламинация: ${result.specifications.lamination}` : ''}`,
        specifications: result.specifications,
        materials: result.materials,
        services: result.services,
        productionTime: result.productionTime,
        productType: result.specifications.productType,
        urgency: result.specifications.priceType,
        customerType: result.specifications.customerType,
        estimatedDelivery: new Date(Date.now() + getProductionDays() * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      price: result.pricePerItem,
      quantity: result.specifications.quantity,
      sides: result.specifications.sides,
      sheets: 1,
      waste: 0,
      clicks: 1,
      components: result.materials
    };

    // Обучаем ИИ на данных заказа
    trainAIOnOrder({
      productType: result.specifications.productType,
      format: result.specifications.format,
      quantity: result.specifications.quantity,
      paperType: result.specifications.paperType,
      paperDensity: result.specifications.paperDensity,
      lamination: result.specifications.lamination,
      urgency: result.specifications.priceType,
      customerType: result.specifications.customerType,
      finalPrice: result.pricePerItem
    });

    onAddToOrder(apiItem);
    logger.info('Товар добавлен в заказ', { productName: result.productName });
    toast.success('Товар добавлен в заказ!');
    onClose();
  }, [result, getProductionDays, onAddToOrder, logger, toast, onClose, trainAIOnOrder]);

  // Обработка применения шаблона
  const handleApplyTemplate = useCallback((templateSpecs: Partial<ProductSpecs>) => {
    setSpecs(prev => ({ ...prev, ...templateSpecs }));
    setUserInteracted(true);
    logger.info('Применен шаблон', { templateSpecs });
  }, [logger]);

  // Добавление в сравнение
  const handleAddToComparison = useCallback(() => {
    if (!result) return;

    const comparisonItem = {
      id: `comparison_${Date.now()}`,
      name: `${currentConfig?.name} ${specs.format}`,
      specs: { ...specs },
      result: { ...result },
      isSelected: false
    };

    setComparisonItems(prev => [...prev, comparisonItem]);
    logger.info('Элемент добавлен в сравнение', { itemName: comparisonItem.name });
    toast.success('Элемент добавлен в сравнение!');
  }, [result, currentConfig, specs, logger, toast]);

  // Обработка выбора варианта из сравнения
  const handleSelectVariant = useCallback((variantSpecs: ProductSpecs) => {
    setSpecs(variantSpecs);
    setUserInteracted(true);
    logger.info('Выбран вариант из сравнения', { variantSpecs });
  }, [logger]);

  // Обработка обновления цен
  const handlePriceUpdate = useCallback(() => {
    // Очищаем результат для пересчета с новыми ценами
    setResult(null);
    setUserInteracted(true);
    logger.info('Цены обновлены, пересчитываем результат');
  }, [logger]);

  // Обработка применения рекомендации ИИ
  const handleApplyAIRecommendation = useCallback((recommendation: any) => {
    setSpecs(prev => ({
      ...prev,
      productType: recommendation.productType,
      format: recommendation.format,
      quantity: recommendation.quantity
    }));
    setResult(null); // Clear result to trigger recalculation
    setUserInteracted(true);
    logger.info('Применена рекомендация ИИ', { recommendation });
    toast.success('Рекомендация ИИ применена!');
  }, [logger, toast]);

  if (!isOpen) return null;

  return (
    <div className="improved-printing-calculator-overlay">

      {/* Основной калькулятор */}
      <div className="improved-printing-calculator">
        {/* Заголовок */}
        <div className="calculator-header">
          <div className="header-content">
            <h2>🖨️ Калькулятор печати</h2>
            <p>Рассчитайте стоимость печатной продукции</p>
          </div>
               <div className="header-actions">
                 <button
                   className="btn btn-sm btn-outline"
                   onClick={() => setShowQuickTemplates(true)}
                   title="Быстрые шаблоны"
                 >
                   ⚡ Шаблоны
                 </button>
                 <button
                   className="btn btn-sm btn-outline"
                   onClick={() => setShowPresets(!showPresets)}
                   title="Пресеты"
                 >
                   ⭐ Пресеты
                 </button>
                 <button
                   className="btn btn-sm btn-outline"
                   onClick={() => setShowComparison(true)}
                   title="Сравнение вариантов"
                 >
                   ⚖️ Сравнить
                 </button>
                 <button
                   className="btn btn-sm btn-outline"
                   onClick={() => setShowAIDashboard(true)}
                   title="ИИ Дашборд"
                 >
                   🤖 ИИ
                 </button>
                 <button
                   className="btn btn-sm btn-outline"
                   onClick={() => setShowDynamicPricingManager(true)}
                   title="Динамическое ценообразование"
                 >
                   ⚙️ Настройки
                 </button>
                 <button className="close-btn" onClick={onClose}>×</button>
               </div>
        </div>

        {/* Основной контент */}
        <div className="calculator-content">
          {/* Основная форма */}
          <div className="calculator-main">
            {/* Результат расчета - всегда видимый */}
            {result && (
              <div className="form-section result-section compact">
                <h3>💰 Стоимость: {result.totalCost.toLocaleString()} BYN</h3>
                <div className="result-details">
                  <div className="result-item">
                    <span>За штуку:</span>
                    <span>{result.pricePerItem.toLocaleString()} BYN</span>
                  </div>
                  <div className="result-item">
                    <span>Количество:</span>
                    <span>{result.specifications.quantity.toLocaleString()} шт.</span>
                  </div>
                  <div className="result-item">
                    <span>Срок:</span>
                    <span>{result.productionTime}</span>
                  </div>
                </div>
                <div className="result-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleAddToOrder()}
                    disabled={!isValid}
                  >
                    ➕ Добавить в заказ
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={handleAddToComparison}
                    disabled={!isValid}
                  >
                    ⚖️ Сравнить
                  </button>
                </div>
              </div>
            )}

            {/* Информация о выбранном продукте */}
            <div className="form-section compact">
              <h3>📦 {currentConfig?.name}</h3>
              <div className="selected-product-info">
                <div className="selected-product-card">
                  <div className="product-icon">{getProductIcon(specs.productType)}</div>
                  <div className="product-details">
                    <div className="product-type">{specs.productType}</div>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => setShowProductSelection(true)}
                    title="Изменить тип продукта"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>

            {/* Параметры продукта */}
            <div className="form-section compact">
              <h3>⚙️ Параметры</h3>
              <div className="params-grid compact">
                {/* Формат */}
                <div className="param-group">
                  <label>Формат:</label>
                  <select
                    value={isCustomFormat ? 'custom' : specs.format}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomFormat(true);
                      } else {
                        setIsCustomFormat(false);
                        updateSpecs({ format: e.target.value });
                      }
                    }}
                    className="form-control"
                  >
                    {availableFormats.map((format: string) => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                    <option value="custom">Произвольный размер</option>
                  </select>
                  {isCustomFormat && (
                    <div className="custom-format-inputs">
                      <input
                        type="number"
                        placeholder="Ширина (мм)"
                        value={customFormat.width}
                        onChange={(e) => setCustomFormat(prev => ({ ...prev, width: e.target.value }))}
                        className="form-control"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        placeholder="Высота (мм)"
                        value={customFormat.height}
                        onChange={(e) => setCustomFormat(prev => ({ ...prev, height: e.target.value }))}
                        className="form-control"
                      />
                    </div>
                  )}
                </div>

                {/* Количество */}
                <div className="param-group">
                  <label>Количество:</label>
                  <div className="quantity-controls">
                    <button 
                      type="button"
                      className="quantity-btn quantity-btn-minus"
                      onClick={() => updateSpecs({ quantity: Math.max(1, specs.quantity - 1) })}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={specs.quantity}
                      onChange={(e) => updateSpecs({ quantity: parseInt(e.target.value) || 1 })}
                      min="1"
                      max={getMaxQuantity(specs.productType)}
                      className={`quantity-input ${validationErrors.quantity ? 'error' : ''}`}
                    />
                    <button 
                      type="button"
                      className="quantity-btn quantity-btn-plus"
                      onClick={() => updateSpecs({ quantity: Math.min(getMaxQuantity(specs.productType), specs.quantity + 1) })}
                    >
                      +
                    </button>
                  </div>
                  <div className="quantity-hint">
                    Максимум: {getMaxQuantity(specs.productType).toLocaleString()} штук
                  </div>
                </div>

                {/* Стороны печати */}
                <div className="param-group">
                  <label>Стороны:</label>
                  <select
                    value={specs.sides}
                    onChange={(e) => updateSpecs({ sides: parseInt(e.target.value) as 1 | 2 })}
                    className="form-control"
                  >
                    <option value={1}>Односторонние</option>
                    <option value={2}>Двусторонние</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Материалы */}
            <div className="form-section compact">
              <h3>📄 Материалы</h3>
              <div className="materials-grid compact">
                {/* Тип бумаги */}
                <div className="param-group">
                  <label>Тип бумаги:</label>
                  {loadingPaperTypes ? (
                    <div className="form-control" style={{ color: '#666' }}>
                      Загрузка типов бумаги...
                    </div>
                  ) : (
                    <select
                      value={specs.paperType}
                      onChange={(e) => updateSpecs({ 
                        paperType: e.target.value as any,
                        paperDensity: getDefaultPaperDensity(e.target.value)
                      })}
                      className="form-control"
                    >
                      {warehousePaperTypes.map(paperType => (
                        <option key={paperType.name} value={paperType.name}>
                          {paperType.display_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Плотность бумаги */}
                <div className="param-group">
                  <label>Плотность:</label>
                  {availableDensities.length > 0 ? (
                    <select
                      value={specs.paperDensity}
                      onChange={(e) => updateSpecs({ paperDensity: parseInt(e.target.value) })}
                      className="form-control"
                    >
                      {availableDensities.map(density => (
                        <option key={density.value} value={density.value}>
                          {density.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="alert alert-warning">
                      <small>
                        ⚠️ Для выбранного типа бумаги нет доступных плотностей в базе данных.
                        <br />
                        Выберите другой тип бумаги или обратитесь к администратору.
                      </small>
                    </div>
                  )}
                </div>

                {/* Ламинация */}
                <div className="param-group">
                  <label>Ламинация:</label>
                  <select
                    value={specs.lamination}
                    onChange={(e) => updateSpecs({ lamination: e.target.value as any })}
                    className="form-control"
                  >
                    <option value="none">Без ламинации</option>
                    <option value="matte">Матовая</option>
                    <option value="glossy">Глянцевая</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Расширенные настройки */}
            <div className="form-section advanced-settings compact">
              <h3>🔧 Настройки</h3>
              <div className="advanced-grid compact">
                {/* Тип цены */}
                <div className="param-group">
                  <label>Тип цены:</label>
                  <select
                    value={specs.priceType}
                    onChange={(e) => updateSpecs({ priceType: e.target.value as any })}
                    className="form-control"
                  >
                    <option value="online">Онлайн (стандарт)</option>
                    <option value="rush">Срочно (+50%)</option>
                    <option value="promo">Промо (-30%)</option>
                  </select>
                </div>

                {/* Тип клиента */}
                <div className="param-group">
                  <label>Тип клиента:</label>
                  <select
                    value={specs.customerType}
                    onChange={(e) => updateSpecs({ customerType: e.target.value as any })}
                    className="form-control"
                  >
                    <option value="regular">Обычный</option>
                    <option value="vip">VIP (-10%)</option>
                  </select>
                </div>

                {/* Дополнительные опции */}
                {currentConfig?.pages && (
                  <div className="param-group">
                    <label>Страниц:</label>
                    <select
                      value={specs.pages || 4}
                      onChange={(e) => updateSpecs({ pages: parseInt(e.target.value) })}
                      className="form-control"
                    >
                      {currentConfig.pages.map((pages: number) => (
                        <option key={pages} value={pages}>{pages} стр.</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Дополнительные услуги */}
                <div className="param-group checkbox-group">
                  {currentConfig?.magnetic && (
                    <label>
                      <input
                        type="checkbox"
                        checked={specs.magnetic || false}
                        onChange={(e) => updateSpecs({ magnetic: e.target.checked })}
                      />
                      Магнитные
                    </label>
                  )}
                  {currentConfig?.cutting && (
                    <label>
                      <input
                        type="checkbox"
                        checked={specs.cutting || false}
                        onChange={(e) => updateSpecs({ cutting: e.target.checked })}
                      />
                      Резка
                    </label>
                  )}
                  {currentConfig?.folding && (
                    <label>
                      <input
                        type="checkbox"
                        checked={specs.folding || false}
                        onChange={(e) => updateSpecs({ folding: e.target.checked })}
                      />
                      Фальцовка
                    </label>
                  )}
                  {currentConfig?.roundCorners && (
                    <label>
                      <input
                        type="checkbox"
                        checked={specs.roundCorners || false}
                        onChange={(e) => updateSpecs({ roundCorners: e.target.checked })}
                      />
                      Скругление углов
                    </label>
                  )}
                </div>
              </div>
            </div>


            {/* Ошибки валидации */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="validation-errors">
                {Object.entries(validationErrors).map(([key, message]) => (
                  <div key={key} className="validation-error">
                    {message}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Модальное окно пресетов */}
        {showPresets && (
          <div className="presets-modal-overlay" onClick={() => setShowPresets(false)}>
            <div className="presets-modal" onClick={(e) => e.stopPropagation()}>
              <div className="presets-header">
                <h3>⭐ Пресеты</h3>
                <button className="close-btn" onClick={() => setShowPresets(false)}>×</button>
              </div>
              <div className="presets-content">
                {savedPresets.length === 0 ? (
                  <div className="no-presets">
                    <div className="no-presets-icon">⭐</div>
                    <h4>Сохраненных пресетов нет</h4>
                    <p>Создайте пресет, чтобы быстро загружать настройки</p>
                  </div>
                ) : (
                  <div className="presets-grid">
                    {savedPresets.map((preset, index) => (
                      <div key={index} className="preset-card" onClick={() => {
                        loadPreset(preset);
                        setShowPresets(false);
                      }}>
                        <div className="preset-header">
                          <h4>{(preset as any).name || `${productConfigs[preset.productType]?.name} ${preset.format}`}</h4>
                          <div className="preset-actions">
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Удалить пресет?')) {
                                  const newPresets = savedPresets.filter((_, i) => i !== index);
                                  setSavedPresets(newPresets);
                                  localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
                                  toast.success('Пресет удален');
                                }
                              }}
                              title="Удалить пресет"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="preset-details">
                          <div className="preset-detail">
                            <span>Количество:</span>
                            <span>{preset.quantity.toLocaleString()} шт</span>
                          </div>
                          <div className="preset-detail">
                            <span>Материал:</span>
                            <span>{preset.paperType} {preset.paperDensity}г/м²</span>
                          </div>
                          <div className="preset-detail">
                            <span>Стороны:</span>
                            <span>{preset.sides === 1 ? 'Односторонние' : 'Двусторонние'}</span>
                          </div>
                          {preset.lamination !== 'none' && (
                            <div className="preset-detail">
                              <span>Ламинация:</span>
                              <span>{preset.lamination}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно выбора продукта */}
      {showProductSelection && (
        <EnhancedProductSelector
          productConfigs={productConfigs}
          onSelectProduct={selectProductType}
          onClose={() => setShowProductSelection(false)}
        />
      )}

      {/* Модальное окно быстрых шаблонов */}
      {showQuickTemplates && (
        <QuickTemplates
          onApplyTemplate={handleApplyTemplate}
          onClose={() => setShowQuickTemplates(false)}
        />
      )}

           {/* Модальное окно сравнения */}
           {showComparison && (
             <ComparisonModal
               isOpen={showComparison}
               onClose={() => setShowComparison(false)}
               onSelectVariant={handleSelectVariant}
               initialItems={comparisonItems}
             />
           )}


           {/* ИИ Дашборд */}
           {showAIDashboard && (
             <AIDashboard
               isOpen={showAIDashboard}
               onClose={() => setShowAIDashboard(false)}
               onApplyRecommendation={handleApplyAIRecommendation}
             />
           )}

           {/* Динамическое ценообразование */}
           {showDynamicPricingManager && (
             <DynamicPricingManager
               isOpen={showDynamicPricingManager}
               onClose={() => setShowDynamicPricingManager(false)}
             />
           )}
         </div>
       );
     };

// Вспомогательная функция для иконок продуктов
const getProductIcon = (productType: string): string => {
  const icons: Record<string, string> = {
    // Основные полиграфические продукты
    'flyers': '📄',
    'business_cards': '💳',
    'booklets': '📖',
    'posters': '🖼️',
    'brochures': '📚',
    'stickers': '🏷️',
    'envelopes': '✉️',
    'labels': '🏷️',
    'blanks': '📋',
    'calendars': '📅',
    'badges': '🎫',
    'business_forms': '📝',
    
    // Новые продукты из Karandash
    'forms': '📋',
    'magnetic_cards': '🧲',
    'posters_large': '🖼️',
    'perforated_cards': '✂️',
    'wall_calendars': '📅',
    'table_calendars': '📅',
    
    // Специализированные продукты
    'notebooks': '📓',
    'folders': '📁',
    'menus': '🍽️',
    'invitations': '💌',
    'certificates': '🏆',
    'banners': '🚩',
    'stands': '🖼️',
    
    // Сувенирная продукция
    't_shirts': '👕',
    'bags': '👜',
    'pens': '✏️',
    'mugs': '☕',
    'keychains': '🔑',
    'coasters': '🍽️',
    'mouse_pads': '🖱️',
    'puzzles': '🧩',
    'photo_albums': '📸',
    'photo_cards': '🖼️',
    'photo_wallpaper': '🖼️',
    'flags': '🏳️',
    
    // Продукты для мероприятий
    'table_tents': '🏷️',
    'placemats': '🍽️',
    'table_numbers': '🔢',
    'seating_cards': '💺',
    
    // Свадебная продукция
    'wedding_invitations': '💒',
    'wedding_place_cards': '💒',
    'wedding_labels': '💒',
    'wedding_scrolls': '📜',
    'wedding_boxes': '📦',
    'wedding_disc_labels': '💿',
    'wedding_disc_boxes': '💿'
  };
  return icons[productType] || '📄';
};