import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { productConfigs as defaultProductConfigs, addProduct, ProductConfig, updateProductConfig, deleteProductConfig } from '../config/calculatorConfig';
import { EditProductModal } from '../components/EditProductModal';
import { CalculatorSettingsTab } from '../components/calculator/CalculatorSettingsTab';
import { CalculatorBackupTab } from '../components/calculator/CalculatorBackupTab';
import { getPaperTypesFromWarehouse } from '../services/calculatorMaterialService';
import { useLogger } from '../utils/logger';
import { useToastNotifications } from '../components/Toast';
import { DataStates } from '../components/LoadingSpinner';
import '../styles/calculator-config.css';
import '../styles/improved-calculator-config.css';
import '../styles/calculator-settings-page.css';

interface CalculatorSettingsPageProps {
  onBack: () => void;
}

type ConfigTab = 'products' | 'create' | 'presets' | 'settings' | 'backup';

export const CalculatorSettingsPage: React.FC<CalculatorSettingsPageProps> = ({
  onBack
}) => {
  const logger = useLogger('CalculatorSettingsPage');
  const toast = useToastNotifications();
  
  const [activeTab, setActiveTab] = useState<ConfigTab>('products');
  const [newProduct, setNewProduct] = useState<Partial<ProductConfig>>({
    name: '',
    formats: [],
    paperDensities: [],
    laminations: ['none', 'matte', 'glossy'],
    sides: [1, 2]
  });
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  const [editingProductKey, setEditingProductKey] = useState<string | null>(null);
  const [editingProductConfig, setEditingProductConfig] = useState<ProductConfig | null>(null);
  const [productConfigs, setProductConfigs] = useState<Record<string, ProductConfig>>(defaultProductConfigs);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'products' | 'presets'>('all');
  const [warehousePaperTypes, setWarehousePaperTypes] = useState<any[]>([]);
  const [loadingPaperTypes, setLoadingPaperTypes] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    products: false,
    presets: false,
    settings: false,
    paperTypes: false,
    saving: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Состояния для новых функций
  const [settings, setSettings] = useState({
    autoSave: true,
    showAdvancedOptions: false,
    defaultCurrency: 'BYN',
    roundingPrecision: 2,
    enableNotifications: true
  });

  // Загрузка данных
  useEffect(() => {
    loadProductConfigs();
    loadPresets();
    loadSettings();
    loadPaperTypes();
  }, []);

  const loadProductConfigs = async () => {
    setLoadingStates(prev => ({ ...prev, products: true }));
    try {
      // Имитируем небольшую задержку для лучшего UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const saved = localStorage.getItem('calculator-product-configs');
      if (saved) {
        const parsedConfigs = JSON.parse(saved);
        setProductConfigs(parsedConfigs);
        logger.info('Конфигурация продуктов загружена', { count: Object.keys(parsedConfigs).length });
      } else {
        setProductConfigs(defaultProductConfigs);
        logger.info('Использована конфигурация по умолчанию');
      }
    } catch (error) {
      logger.error('Ошибка загрузки конфигурации продуктов', error);
      toast.error('Ошибка загрузки конфигурации продуктов');
      setProductConfigs(defaultProductConfigs);
    } finally {
      setLoadingStates(prev => ({ ...prev, products: false }));
    }
  };

  const loadPresets = () => {
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
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('calculator-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
        logger.info('Настройки загружены');
      }
    } catch (error) {
      logger.error('Ошибка загрузки настроек', error);
    }
  };

  const loadPaperTypes = async () => {
    setLoadingStates(prev => ({ ...prev, paperTypes: true }));
    setLoadingPaperTypes(true);
    try {
      const paperTypes = await getPaperTypesFromWarehouse();
      setWarehousePaperTypes(paperTypes);
      logger.info('Типы бумаги загружены из складского сервиса', { count: paperTypes.length });
    } catch (error) {
      logger.error('Ошибка загрузки типов бумаги', error);
      toast.error('Ошибка загрузки типов бумаги из складского сервиса');
    } finally {
      setLoadingPaperTypes(false);
      setLoadingStates(prev => ({ ...prev, paperTypes: false }));
    }
  };

  const validateProduct = (product: Partial<ProductConfig>): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!product.name || product.name.trim().length === 0) {
      newErrors.name = 'Название продукта обязательно';
    } else if (product.name.length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    }
    
    if (!product.formats || product.formats.length === 0) {
      newErrors.formats = 'Выберите хотя бы один формат';
    }
    
    if (!product.paperDensities || product.paperDensities.length === 0) {
      newErrors.paperDensities = 'Выберите хотя бы одну плотность бумаги';
    }
    
    if (!product.sides || product.sides.length === 0) {
      newErrors.sides = 'Выберите количество сторон печати';
    }
    
    return newErrors;
  };

  const saveSettings = (newSettings: typeof settings) => {
    try {
      localStorage.setItem('calculator-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      logger.info('Настройки сохранены', newSettings);
      toast.success('Настройки сохранены');
    } catch (error) {
      logger.error('Ошибка сохранения настроек', error);
      toast.error('Ошибка сохранения настроек');
    }
  };

  const deletePreset = (index: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пресет?')) {
      const newPresets = savedPresets.filter((_, i) => i !== index);
      setSavedPresets(newPresets);
      localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
      logger.info('Пресет удален', { index });
      toast.success('Пресет удален');
    }
  };

  const duplicatePreset = (index: number) => {
    const presetToDuplicate = savedPresets[index];
    const originalName = presetToDuplicate.name || `${productConfigs[presetToDuplicate.productType]?.name || 'Продукт'} ${presetToDuplicate.format}`;
    
    const presetName = prompt(`Введите название для копии пресета "${originalName}":`, `${originalName} (копия)`);
    if (!presetName) return;
    
    const newPreset = {
      ...presetToDuplicate,
      name: presetName,
      id: Date.now()
    };
    
    const newPresets = [...savedPresets, newPreset];
    setSavedPresets(newPresets);
    localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
    logger.info('Пресет скопирован', { originalName, newName: presetName });
    toast.success('Пресет успешно скопирован!');
  };

  const startEditingProduct = (productKey: string) => {
    const product = productConfigs[productKey];
    setEditingProductKey(productKey);
    setEditingProductConfig(product);
    logger.debug('Начато редактирование продукта', { productKey });
  };

  const closeEditModal = () => {
    setEditingProductKey(null);
    setEditingProductConfig(null);
  };

  const handleProductUpdated = () => {
    loadProductConfigs();
    closeEditModal();
    logger.info('Продукт обновлен');
    toast.success('Продукт обновлен');
  };

  const deleteProduct = (productKey: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить продукт "${productConfigs[productKey].name}"?`)) {
      deleteProductConfig(productKey);
      loadProductConfigs();
      logger.info('Продукт удален', { productKey });
      toast.success('Продукт успешно удален!');
    }
  };

  const handleAddProduct = () => {
    const validationErrors = validateProduct(newProduct);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    // Проверяем, не существует ли уже продукт с таким именем
    const productKey = newProduct.name!.toLowerCase().replace(/\s+/g, '_');
    if (productConfigs[productKey]) {
      setErrors({ name: 'Продукт с таким названием уже существует' });
      toast.error('Продукт с таким названием уже существует');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, saving: true }));
    
    try {
      addProduct(productKey, newProduct as ProductConfig);
      setNewProduct({
        name: '',
        formats: [],
        paperDensities: [],
        laminations: ['none', 'matte', 'glossy'],
        sides: [1, 2]
      });
      setErrors({});
      loadProductConfigs();
      logger.info('Новый продукт добавлен', { productKey, name: newProduct.name });
      toast.success('Новый продукт добавлен!');
    } catch (error) {
      logger.error('Ошибка добавления продукта', error);
      toast.error('Ошибка при добавлении продукта');
    } finally {
      setLoadingStates(prev => ({ ...prev, saving: false }));
    }
  };


  const handleFormatChange = useCallback((format: string, checked: boolean) => {
    if (checked) {
      setNewProduct(prev => ({
        ...prev,
        formats: [...(prev.formats || []), format]
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        formats: prev.formats?.filter(f => f !== format) || []
      }));
    }
  }, []);

  const handleDensityChange = useCallback((density: number, checked: boolean) => {
    if (checked) {
      setNewProduct(prev => ({
        ...prev,
        paperDensities: [...(prev.paperDensities || []), density]
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        paperDensities: prev.paperDensities?.filter(d => d !== density) || []
      }));
    }
  }, []);

  const handleSideChange = useCallback((side: number, checked: boolean) => {
    if (checked) {
      setNewProduct(prev => ({
        ...prev,
        sides: [...(prev.sides || []), side]
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        sides: prev.sides?.filter(s => s !== side) || []
      }));
    }
  }, []);

  // Функции для экспорта/импорта
  const exportSettings = () => {
    try {
      const exportData = {
        productConfigs,
        savedPresets,
        settings,
        timestamp: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calculator-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      logger.info('Настройки экспортированы');
      toast.success('Настройки успешно экспортированы!');
    } catch (error) {
      logger.error('Ошибка экспорта настроек', error);
      toast.error('Ошибка экспорта настроек');
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.productConfigs) {
          setProductConfigs(data.productConfigs);
          localStorage.setItem('calculator-product-configs', JSON.stringify(data.productConfigs));
        }
        
        if (data.savedPresets) {
          setSavedPresets(data.savedPresets);
          localStorage.setItem('printing-calculator-presets', JSON.stringify(data.savedPresets));
        }
        
        if (data.settings) {
          setSettings(data.settings);
          localStorage.setItem('calculator-settings', JSON.stringify(data.settings));
        }
        
        logger.info('Настройки импортированы', { timestamp: data.timestamp });
        toast.success('Настройки успешно импортированы!');
      } catch (error) {
        logger.error('Ошибка импорта настроек', error);
        toast.error('Ошибка импорта настроек');
      }
    };
    reader.readAsText(file);
  };

  // Мемоизированная фильтрация данных
  const filteredProducts = useMemo(() => {
    return Object.entries(productConfigs).filter(([key, config]) =>
      searchQuery === '' || 
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [productConfigs, searchQuery]);

  const filteredPresets = useMemo(() => {
    return savedPresets.filter(preset =>
      searchQuery === '' ||
      (preset.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.productType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savedPresets, searchQuery]);

  return (
    <div className="calculator-settings-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← Назад</button>
        <h1>⚙️ Настройки калькулятора</h1>
        <div className="header-actions">
          <button 
            className="btn btn-sm btn-outline"
            onClick={exportSettings}
            title="Экспорт настроек"
          >
            📤 Экспорт
          </button>
          <label className="btn btn-sm btn-outline" title="Импорт настроек">
            📥 Импорт
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="page-content">
        <div className="config-tabs">
          {[
            { key: 'products', label: '📦 Продукты', icon: '📦' },
            { key: 'create', label: '➕ Создать', icon: '➕' },
            { key: 'presets', label: '⭐ Пресеты', icon: '⭐' },
            { key: 'settings', label: '⚙️ Настройки', icon: '⚙️' },
            { key: 'backup', label: '💾 Резерв', icon: '💾' }
          ].map(tab => (
            <button 
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as ConfigTab)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="config-content">
          {/* Поиск и фильтры */}
          <div className="search-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-buttons">
              {[
                { key: 'all', label: 'Все' },
                { key: 'products', label: 'Продукты' },
                { key: 'presets', label: 'Пресеты' }
              ].map(filter => (
                <button
                  key={filter.key}
                  className={`filter-btn ${filterType === filter.key ? 'active' : ''}`}
                  onClick={() => setFilterType(filter.key as any)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Вкладка продуктов */}
          {activeTab === 'products' && (
            <div className="products-tab">
              <div className="tab-header">
                <h3>📦 Управление продуктами</h3>
                <div className="stats">
                  <span className="stat">Всего: {Object.keys(productConfigs).length}</span>
                  <span className="stat">Показано: {filteredProducts.length}</span>
                  {loadingStates.products && <span className="loading-indicator">⏳ Загрузка...</span>}
                </div>
              </div>
              
              {loadingStates.products ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Загрузка конфигурации продуктов...</p>
                </div>
              ) : (
                <div className="products-list">
                  {filteredProducts.map(([key, config]) => {
                    // Создаем краткое описание продукта
                    const summary = [
                      `${config.formats.length} форматов`,
                      `${config.paperDensities.length} плотностей`,
                      `${config.sides.length === 1 ? 'односторонние' : 'двусторонние'}`
                    ].join(' • ');
                    
                    return (
                      <div key={key} className="product-item">
                        <div className="product-icon">
                          {key === 'flyers' && '📄'}
                          {key === 'business_cards' && '💳'}
                          {key === 'posters' && '🖼️'}
                          {key === 'brochures' && '📋'}
                          {key === 'booklets' && '📚'}
                          {key === 'calendars' && '📅'}
                          {key === 'stickers' && '🏷️'}
                          {key === 'labels' && '🏷️'}
                          {key === 'banners' && '🎯'}
                          {key === 'roll_up' && '📜'}
                          {key === 'x_banner' && '❌'}
                          {key === 'table_tent' && '📋'}
                          {key === 'menu' && '🍽️'}
                          {!['flyers', 'business_cards', 'posters', 'brochures', 'booklets', 'calendars', 'stickers', 'labels', 'banners', 'roll_up', 'x_banner', 'table_tent', 'menu'].includes(key) && '📦'}
                        </div>
                        
                        <div className="product-info">
                          <div className="product-name">{config.name}</div>
                          <div className="product-summary">{summary}</div>
                        </div>
                        
                        <div className="product-actions">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => startEditingProduct(key)}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteProduct(key)}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Вкладка создания продукта */}
          {activeTab === 'create' && (
            <div className="create-product-tab">
              <h3>➕ Создать новый продукт</h3>
              <div className="new-product-form">
                <div className="form-group">
                  <label>Название продукта:</label>
                  <input
                    type="text"
                    value={newProduct.name || ''}
                    onChange={(e) => {
                      setNewProduct(prev => ({ ...prev, name: e.target.value }));
                      // Очищаем ошибку при изменении
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Например: Наклейки"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label>Форматы:</label>
                  <div className="checkbox-group">
                    {['A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'стандартные', 'произвольный'].map(format => (
                      <label key={format} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.formats?.includes(format) || false}
                          onChange={(e) => {
                            handleFormatChange(format, e.target.checked);
                            // Очищаем ошибку при изменении
                            if (errors.formats) {
                              setErrors(prev => ({ ...prev, formats: '' }));
                            }
                          }}
                        />
                        {format}
                      </label>
                    ))}
                  </div>
                  {errors.formats && <div className="error-message">{errors.formats}</div>}
                </div>

                <div className="form-group">
                  <label>Типы бумаги (из складского сервиса):</label>
                  {loadingPaperTypes ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Загрузка типов бумаги из складского сервиса...</p>
                    </div>
                  ) : warehousePaperTypes.length > 0 ? (
                    <div className="checkbox-group">
                      {warehousePaperTypes.map(paperType => (
                        <label key={paperType.name} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newProduct.paperTypes?.includes(paperType.name) || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewProduct(prev => ({
                                ...prev,
                                paperTypes: checked 
                                  ? [...(prev.paperTypes || []), paperType.name]
                                  : (prev.paperTypes || []).filter(pt => pt !== paperType.name)
                              }));
                              // Очищаем ошибку при изменении
                              if (errors.paperTypes) {
                                setErrors(prev => ({ ...prev, paperTypes: '' }));
                              }
                            }}
                          />
                          {paperType.display_name} 
                          {paperType.densities && paperType.densities.length > 0 && 
                            ` (${paperType.densities.length} плотностей)`
                          }
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="warning-message">
                      ⚠️ Не удалось загрузить типы бумаги из складского сервиса. 
                      Используются статические плотности.
                    </div>
                  )}
                  {errors.paperTypes && <div className="error-message">{errors.paperTypes}</div>}
                </div>

                <div className="form-group">
                  <label>Плотности бумаги (г/м²):</label>
                  <div className="checkbox-group">
                    {[80, 90, 100, 120, 130, 150, 160, 170, 200, 250, 300, 350].map(density => (
                      <label key={density} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.paperDensities?.includes(density) || false}
                          onChange={(e) => handleDensityChange(density, e.target.checked)}
                        />
                        {density}
                      </label>
                    ))}
                  </div>
                  <small className="form-text text-muted">
                    💡 Эти плотности будут заменены на динамические из складского сервиса при выборе типов бумаги
                  </small>
                  {errors.paperDensities && <div className="error-message">{errors.paperDensities}</div>}
                </div>

                <div className="form-group">
                  <label>Стороны печати:</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newProduct.sides?.includes(1) || false}
                        onChange={(e) => handleSideChange(1, e.target.checked)}
                      />
                      Односторонние
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newProduct.sides?.includes(2) || false}
                        onChange={(e) => handleSideChange(2, e.target.checked)}
                      />
                      Двусторонние
                    </label>
                  </div>
                  {errors.sides && <div className="error-message">{errors.sides}</div>}
                </div>

                <div className="form-group">
                  <label>Типы ламинации:</label>
                  <div className="checkbox-group">
                    {['none', 'matte', 'glossy'].map(lamination => (
                      <label key={lamination} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.laminations?.includes(lamination) || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setNewProduct(prev => ({
                              ...prev,
                              laminations: checked 
                                ? [...(prev.laminations || []), lamination]
                                : (prev.laminations || []).filter(l => l !== lamination)
                            }));
                          }}
                        />
                        {lamination === 'none' ? 'Без ламинации' : 
                         lamination === 'matte' ? 'Матовая' : 'Глянцевая'}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Дополнительные опции:</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newProduct.magnetic || false}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, magnetic: e.target.checked }))}
                      />
                      Магнитные
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newProduct.cutting || false}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, cutting: e.target.checked }))}
                      />
                      Резка
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newProduct.folding || false}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, folding: e.target.checked }))}
                      />
                      Сгибка
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newProduct.roundCorners || false}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, roundCorners: e.target.checked }))}
                      />
                      Скругление углов
                    </label>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleAddProduct}
                  disabled={loadingStates.saving}
                >
                  {loadingStates.saving ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Сохранение...
                    </>
                  ) : (
                    'Добавить продукт'
                  )}
                </button>
              </div>
            </div>
          )}


          {/* Вкладка пресетов */}
          {activeTab === 'presets' && (
            <div className="presets-tab">
              <h3>⭐ Управление пресетами</h3>
              <div className="presets-grid">
                {filteredPresets.map((preset, index) => (
                  <div key={preset.id || index} className="preset-card">
                    <div className="preset-header">
                      <h4>{preset.name || `${productConfigs[preset.productType]?.name || 'Продукт'} ${preset.format}`}</h4>
                      <div className="preset-actions">
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => duplicatePreset(index)}
                          title="Копировать"
                        >
                          📋
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => deletePreset(index)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="preset-details">
                      <div className="detail-item">
                        <strong>Продукт:</strong> {productConfigs[preset.productType]?.name || preset.productType}
                      </div>
                      <div className="detail-item">
                        <strong>Формат:</strong> {preset.format}
                      </div>
                      <div className="detail-item">
                        <strong>Количество:</strong> {preset.quantity}
                      </div>
                      <div className="detail-item">
                        <strong>Цена:</strong> {preset.totalPrice} BYN
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Вкладка настроек */}
          {activeTab === 'settings' && (
            <CalculatorSettingsTab
              settings={settings}
              onSettingsChange={saveSettings}
            />
          )}

          {/* Вкладка резервного копирования */}
          {activeTab === 'backup' && (
            <CalculatorBackupTab
              productConfigs={productConfigs}
              presets={savedPresets}
              settings={settings}
            />
          )}
        </div>
      </div>

      {/* Модальное окно редактирования продукта */}
      {editingProductKey && editingProductConfig && (
        <EditProductModal
          isOpen={true}
          onClose={closeEditModal}
          productKey={editingProductKey}
          productConfig={editingProductConfig}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
};
