import React, { useState, useEffect, useCallback } from 'react';
import { ProductConfig } from '../../types/shared';
import { ProductSelector } from './ProductSelector';
import { SpecificationsForm } from './SpecificationsForm';
import { PriceCalculator } from './PriceCalculator';
import { useCalculator } from '../../../hooks/useCalculator';
import { useCalculatorStore } from '../../../stores/calculatorStore';
import { useLogger } from '../../../utils/logger';
import { useToastNotifications } from '../../Toast';
import '../../styles/improved-printing-calculator.css';

interface RefactoredCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (order: any) => void;
  initialProductType?: string;
}

export const RefactoredCalculatorModal: React.FC<RefactoredCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddToOrder,
  initialProductType
}) => {
  const logger = useLogger('RefactoredCalculatorModal');
  const toast = useToastNotifications();
  
  // Stores
  const { 
    showProductSelection, 
    setShowProductSelection,
    savedPresets,
    loadPresets,
    savePreset,
    deletePreset
  } = useCalculatorStore();
  
  // Локальное состояние
  const [productConfigs, setProductConfigs] = useState<Record<string, ProductConfig>>({});
  const [customFormat, setCustomFormat] = useState({ width: '', height: '' });
  const [isCustomFormat, setIsCustomFormat] = useState(false);
  const [formatValidation, setFormatValidation] = useState<{isValid: boolean, message: string}>({isValid: true, message: ''});
  
  // Хук калькулятора
  const {
    specs,
    result,
    isCalculating,
    error,
    validationErrors,
    isValid,
    updateSpecs,
    calculateCost,
    handleAddToOrder,
    setError
  } = useCalculator();

  // Загрузка конфигурации продуктов
  const loadProductConfigs = useCallback(() => {
    try {
      const saved = localStorage.getItem('calculator-product-configs');
      let parsedConfigs = {};
      
      if (saved) {
        parsedConfigs = JSON.parse(saved);
      }
      
      // Импортируем конфигурацию по умолчанию
      import('../../../config/calculatorConfig').then(({ productConfigs: defaultConfigs }) => {
        const mergedConfigs = {
          ...defaultConfigs,
          ...parsedConfigs
        };
        
        setProductConfigs(mergedConfigs);
        localStorage.setItem('calculator-product-configs', JSON.stringify(mergedConfigs));
        
        logger.info('Конфигурация продуктов загружена', { 
          count: Object.keys(mergedConfigs).length
        });
      });
    } catch (error) {
      logger.error('Ошибка загрузки конфигурации продуктов', error);
      toast.error('Ошибка загрузки конфигурации продуктов');
    }
  }, [logger, toast]);

  // Инициализация
  useEffect(() => {
    if (isOpen) {
      loadProductConfigs();
      loadPresets();
      setShowProductSelection(!initialProductType);
    }
  }, [isOpen, initialProductType, loadProductConfigs, loadPresets, setShowProductSelection]);

  // Обработчики
  const handleProductSelect = useCallback((productType: string) => {
    updateSpecs({ productType });
    setShowProductSelection(false);
    logger.info('Продукт выбран', { productType });
  }, [updateSpecs, setShowProductSelection, logger]);

  const handleCustomFormatChange = useCallback((format: { width: string; height: string }) => {
    setCustomFormat(format);
    
    // Валидация произвольного формата
    const width = parseFloat(format.width);
    const height = parseFloat(format.height);
    
    if (width > 0 && height > 0) {
      const isValid = width <= 1000 && height <= 1000;
      setFormatValidation({
        isValid,
        message: isValid ? '' : 'Размеры не могут превышать 1000мм'
      });
      
      if (isValid) {
        updateSpecs({ format: `${width}x${height}` });
      }
    } else {
      setFormatValidation({ isValid: true, message: '' });
    }
  }, [updateSpecs]);

  const handleCustomFormatToggle = useCallback((isCustom: boolean) => {
    setIsCustomFormat(isCustom);
    if (!isCustom) {
      setCustomFormat({ width: '', height: '' });
      setFormatValidation({ isValid: true, message: '' });
    }
  }, []);

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

    onAddToOrder(newOrder);
    toast.success('Товар добавлен в заказ!');
    onClose();
  }, [result, onAddToOrder, onClose, toast]);

  if (!isOpen) return null;

  const currentConfig = productConfigs[specs.productType];

  return (
    <div className="improved-printing-calculator-overlay">
      {/* Модальное окно выбора продукта */}
      {showProductSelection && (
        <ProductSelector
          productConfigs={productConfigs}
          selectedProductType={specs.productType}
          onProductSelect={handleProductSelect}
          onClose={onClose}
        />
      )}

      {/* Основной калькулятор */}
      <div className="improved-printing-calculator">
        {/* Заголовок */}
        <div className="calculator-header">
          <div className="header-content">
            <h2>🖨️ Калькулятор печати</h2>
            <div className="header-actions">
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setShowProductSelection(true)}
                title="Изменить тип продукта"
              >
                🔄
              </button>
              <button 
                className="btn btn-sm btn-outline"
                onClick={onClose}
                title="Закрыть калькулятор"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Информация о выбранном продукте */}
        <div className="form-section compact">
          <div className="product-info">
            <div className="product-icon">📄</div>
            <div className="product-details">
              <div className="product-type">{currentConfig?.name || specs.productType}</div>
            </div>
          </div>
        </div>

        {/* Форма параметров */}
        <SpecificationsForm
          specs={specs}
          onSpecsChange={updateSpecs}
          productConfig={currentConfig}
          validationErrors={validationErrors}
          isCustomFormat={isCustomFormat}
          customFormat={customFormat}
          onCustomFormatChange={handleCustomFormatChange}
          onCustomFormatToggle={handleCustomFormatToggle}
          formatValidation={formatValidation}
        />

        {/* Результат расчета */}
        <PriceCalculator
          result={result}
          isCalculating={isCalculating}
          onAddToOrder={handleAddToOrder}
          isValid={isValid}
        />

        {/* Ошибки */}
        {error && (
          <div className="error-section">
            <div className="error-message">
              <span>❌ {error}</span>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Пресеты */}
        {savedPresets.length > 0 && (
          <div className="presets-section">
            <h3>💾 Сохраненные пресеты</h3>
            <div className="presets-list">
              {savedPresets.map((preset, index) => (
                <div key={index} className="preset-item">
                  <span>{preset.productType} - {preset.format}</span>
                  <div className="preset-actions">
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => updateSpecs(preset)}
                    >
                      Загрузить
                    </button>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => deletePreset(index)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
