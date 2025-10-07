import { useCallback, useEffect, useMemo } from 'react';
import { useCalculatorStore } from '../stores/calculatorStore';
import { useOrderStore } from '../stores/orderStore';
import { useUIStore } from '../stores/uiStore';
import { DynamicPricingService } from '../services/dynamicPricingService';
import { useLogger } from '../utils/logger';
import { useToastNotifications } from '../components/Toast';

export const useCalculator = () => {
  const logger = useLogger('useCalculator');
  const toast = useToastNotifications();
  
  // Stores
  const {
    specs,
    result,
    isCalculating,
    error,
    validationErrors,
    isValid,
    updateSpecs,
    setResult,
    setCalculating,
    setError,
    setValidationErrors,
    addToHistory
  } = useCalculatorStore();
  
  const { addOrder } = useOrderStore();
  const { addNotification } = useUIStore();

  // Валидация параметров
  const validateSpecs = useCallback((specs: any) => {
    const errors: Record<string, string> = {};
    
    if (!specs.format || specs.format.trim() === '') {
      errors.format = 'Выберите формат';
    }
    
    if (!specs.quantity || specs.quantity <= 0) {
      errors.quantity = 'Количество должно быть больше 0';
    }
    
    if (specs.quantity > 100000) {
      errors.quantity = 'Количество не может превышать 100,000';
    }
    
    return errors;
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

    setCalculating(true);
    setError(null);

    try {
      const pricingResult = await DynamicPricingService.calculateDynamicPrice({
        productType: specs.productType,
        format: specs.format,
        quantity: specs.quantity,
        urgency: specs.priceType,
        paperType: specs.paperType,
        lamination: specs.lamination,
        sides: specs.sides
      });

      const calculationResult = {
        productName: `${specs.productType} ${specs.format}`,
        specifications: { ...specs },
        materials: [{
          name: 'Печать',
          quantity: specs.quantity,
          price: pricingResult.finalPrice
        }],
        totalCost: pricingResult.total,
        pricePerItem: pricingResult.finalPrice,
        productionTime: getProductionTime(specs.priceType)
      };

      setResult(calculationResult);
      
      if (showToast) {
        toast.success('Расчет выполнен успешно!');
      }
      
      logger.info('Расчет выполнен', { 
        productType: specs.productType,
        quantity: specs.quantity,
        total: pricingResult.total
      });

    } catch (error: any) {
      const errorMessage = error.message || 'Ошибка при расчете стоимости';
      setError(errorMessage);
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      logger.error('Ошибка расчета', error);
    } finally {
      setCalculating(false);
    }
  }, [isValid, specs, validationErrors, setCalculating, setError, setResult, toast, logger]);

  // Получение времени производства
  const getProductionTime = useCallback((priceType: string) => {
    const baseDays = {
      standard: 3,
      urgent: 1,
      superUrgent: 0.5,
      online: 2,
      promo: 5,
      express: 0.5
    };
    
    const days = baseDays[priceType as keyof typeof baseDays] || 3;
    return days === 0.5 ? '4 часа' : `${days} дн.`;
  }, []);

  // Добавление в заказ
  const handleAddToOrder = useCallback(() => {
    if (!result) return;

    const newOrder = {
      id: Date.now(),
      customer_name: 'Новый заказ',
      customer_phone: '+375291234567',
      status: 'pending',
      items: [{
        id: Date.now(),
        order_id: 0,
        product_name: result.productName,
        quantity: result.specifications.quantity,
        price: result.pricePerItem,
        specifications: result.specifications,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    addOrder(newOrder);
    addToHistory(result);
    addNotification({
      type: 'success',
      message: 'Товар добавлен в заказ!'
    });

    logger.info('Товар добавлен в заказ', { 
      productName: result.productName,
      quantity: result.specifications.quantity
    });
  }, [result, addOrder, addToHistory, addNotification, logger]);

  // Обновление параметров с валидацией
  const updateSpecsWithValidation = useCallback((updates: any) => {
    const newSpecs = { ...specs, ...updates };
    const errors = validateSpecs(newSpecs);
    
    updateSpecs(updates);
    setValidationErrors(errors);
  }, [specs, updateSpecs, validateSpecs, setValidationErrors]);

  // Автоматический расчет при изменении параметров
  useEffect(() => {
    if (isValid && specs.quantity > 0 && Object.keys(validationErrors).length === 0) {
      const timeoutId = setTimeout(() => {
        calculateCost(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isValid, specs, validationErrors, calculateCost]);

  return {
    // Состояние
    specs,
    result,
    isCalculating,
    error,
    validationErrors,
    isValid,
    
    // Действия
    updateSpecs: updateSpecsWithValidation,
    calculateCost,
    handleAddToOrder,
    setError,
    setValidationErrors
  };
};
