import React, { useState, useEffect } from 'react';
import { productConfigs as defaultProductConfigs, printingPrices, addProduct, updatePrintingPrices, addPaperDensity, ProductConfig, updateProductConfig, deleteProductConfig } from '../config/calculatorConfig';
import { EditProductModal } from './EditProductModal';
import '../styles/calculator-config.css';

interface CalculatorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdate: () => void;
}

export const CalculatorConfigModal: React.FC<CalculatorConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'create' | 'prices' | 'presets'>('products');
  const [newProduct, setNewProduct] = useState<Partial<ProductConfig>>({
    name: '',
    formats: [],
    paperDensities: [],
    laminations: ['none', 'matte', 'glossy'],
    sides: [1, 2]
  });
  const [newPrice, setNewPrice] = useState({ paperType: 'semi-matte', density: 0, price: 0 });
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  const [editingProductKey, setEditingProductKey] = useState<string | null>(null);
  const [editingProductConfig, setEditingProductConfig] = useState<ProductConfig | null>(null);
  const [productConfigs, setProductConfigs] = useState<Record<string, ProductConfig>>(defaultProductConfigs);

  // Загрузка конфигурации и пресетов при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadProductConfigs();
      loadPresets();
    }
  }, [isOpen]);

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

  const loadPresets = () => {
    try {
      const saved = localStorage.getItem('printing-calculator-presets');
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Ошибка загрузки пресетов:', error);
    }
  };

  const deletePreset = (index: number) => {
    if (confirm('Вы уверены, что хотите удалить этот пресет?')) {
      const newPresets = savedPresets.filter((_, i) => i !== index);
      setSavedPresets(newPresets);
      localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
    }
  };

  const duplicatePreset = (index: number) => {
    const presetToDuplicate = savedPresets[index];
    const originalName = presetToDuplicate.name || `${productConfigs[presetToDuplicate.productType]?.name || 'Продукт'} ${presetToDuplicate.format}`;
    
    const presetName = prompt(`Введите название для копии пресета "${originalName}":`, `${originalName} (копия)`);
    if (!presetName) return;

    const duplicatedPreset = { ...presetToDuplicate, name: presetName };
    const newPresets = [...savedPresets, duplicatedPreset];
    setSavedPresets(newPresets);
    localStorage.setItem('printing-calculator-presets', JSON.stringify(newPresets));
    
    alert('Пресет успешно скопирован!');
  };

  const startEditingProduct = (productKey: string) => {
    const product = productConfigs[productKey];
    setEditingProductKey(productKey);
    setEditingProductConfig(product);
  };

  const closeEditModal = () => {
    setEditingProductKey(null);
    setEditingProductConfig(null);
  };

  const handleProductUpdated = () => {
    loadProductConfigs(); // Перезагружаем конфигурацию
    onConfigUpdate();
    closeEditModal();
  };

  const deleteProduct = (productKey: string) => {
    if (confirm(`Вы уверены, что хотите удалить продукт "${productConfigs[productKey].name}"?`)) {
      deleteProductConfig(productKey);
      loadProductConfigs(); // Перезагружаем конфигурацию
      onConfigUpdate();
      alert('Продукт успешно удален!');
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.formats && newProduct.formats.length > 0) {
      const productKey = newProduct.name.toLowerCase().replace(/\s+/g, '_');
      addProduct(productKey, newProduct as ProductConfig);
      setNewProduct({
        name: '',
        formats: [],
        paperDensities: [],
        laminations: ['none', 'matte', 'glossy'],
        sides: [1, 2]
      });
      loadProductConfigs(); // Перезагружаем конфигурацию
      onConfigUpdate();
    }
  };

  const handleAddPrice = () => {
    if (newPrice.density > 0 && newPrice.price > 0) {
      addPaperDensity(newPrice.paperType, newPrice.density, newPrice.price);
      setNewPrice({ paperType: 'semi-matte', density: 0, price: 0 });
      onConfigUpdate();
    }
  };

  const handleFormatChange = (format: string, checked: boolean) => {
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
  };

  const handleDensityChange = (density: number, checked: boolean) => {
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
  };

  const handleSideChange = (side: number, checked: boolean) => {
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
  };

  if (!isOpen) return null;

  return (
    <div className="config-modal-overlay">
      <div className="config-modal">
        <div className="config-header">
          <h2>Настройка калькулятора</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="config-tabs">
          <button 
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Продукты
          </button>
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Создать продукт
          </button>
          <button 
            className={`tab-btn ${activeTab === 'prices' ? 'active' : ''}`}
            onClick={() => setActiveTab('prices')}
          >
            Цены
          </button>
          <button 
            className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Пресеты
          </button>
        </div>

        <div className="config-content">
          {activeTab === 'products' && (
            <div className="products-tab">
              <h3>Текущие продукты</h3>
              <div className="products-list">
                {Object.entries(productConfigs).map(([key, config]) => (
                  <div key={key} className="product-item">
                    <div className="product-info">
                      <h4>{config.name}</h4>
                      <p>Форматы: {config.formats.join(', ')}</p>
                      <p>Плотности: {config.paperDensities.join(', ')}г/м²</p>
                      <p>Стороны: {config.sides.join(', ')}</p>
                      {config.laminations && <p>Ламинация: {config.laminations.join(', ')}</p>}
                      {config.magnetic !== undefined && <p>Магнитные: {config.magnetic ? 'Да' : 'Нет'}</p>}
                    </div>
                    <div className="product-actions">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => startEditingProduct(key)}
                        title="Редактировать продукт"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteProduct(key)}
                        title="Удалить продукт"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="create-product-tab">
              <h3>Создать новый продукт</h3>
              <div className="new-product-form">
                <div className="form-group">
                  <label>Название продукта:</label>
                  <input
                    type="text"
                    value={newProduct.name || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Например: Наклейки"
                  />
                </div>

                <div className="form-group">
                  <label>Форматы:</label>
                  <div className="checkbox-group">
                    {['A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'стандартные', 'произвольный'].map(format => (
                      <label key={format} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.formats?.includes(format) || false}
                          onChange={(e) => handleFormatChange(format, e.target.checked)}
                        />
                        {format}
                      </label>
                    ))}
                  </div>
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

                <button className="btn btn-primary" onClick={handleAddProduct}>
                  Добавить продукт
                </button>
              </div>
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="prices-tab">
              <h3>Текущие цены печати</h3>
              {Object.entries(printingPrices).map(([paperType, prices]) => (
                <div key={paperType} className="price-group">
                  <h4>{paperType === 'semi-matte' ? 'Полуматовая (Color Copy)' : 
                       paperType === 'glossy' ? 'Глянцевая (NEVIA)' : 
                       paperType === 'offset' ? 'Офсетная' :
                       paperType === 'roll' ? 'Рулонная' :
                       paperType === 'self-adhesive' ? 'Самоклеющаяся' :
                       paperType === 'transparent' ? 'Прозрачная' :
                       paperType === 'magnetic' ? 'Магнитная' : paperType}</h4>
                  <div className="price-list">
                    {Object.entries(prices).map(([density, price]) => (
                      <div key={density} className="price-item">
                        <span>{density}г/м²</span>
                        <span>{price} BYN/лист</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <h3>Добавить новую цену</h3>
              <div className="new-price-form">
                <div className="form-group">
                  <label>Тип бумаги:</label>
                  <select
                    value={newPrice.paperType}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, paperType: e.target.value }))}
                  >
                    <option value="semi-matte">Полуматовая (Color Copy)</option>
                    <option value="glossy">Глянцевая (NEVIA)</option>
                    <option value="offset">Офсетная</option>
                    <option value="roll">Рулонная</option>
                    <option value="self-adhesive">Самоклеющаяся</option>
                    <option value="transparent">Прозрачная</option>
                    <option value="magnetic">Магнитная</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Плотность (г/м²):</label>
                  <input
                    type="number"
                    value={newPrice.density}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, density: Number(e.target.value) }))}
                    min="50"
                    max="500"
                  />
                </div>

                <div className="form-group">
                  <label>Цена (BYN/лист):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice.price}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, price: Number(e.target.value) }))}
                    min="0"
                  />
                </div>

                <button className="btn btn-primary" onClick={handleAddPrice}>
                  Добавить цену
                </button>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="presets-tab">
              <h3>Управление пресетами</h3>
              
              {savedPresets.length === 0 ? (
                <div className="no-presets">
                  <p>Сохраненных пресетов пока нет.</p>
                  <p>Создайте пресеты в калькуляторе, чтобы управлять ими здесь.</p>
                </div>
              ) : (
                <div className="presets-list">
                  {savedPresets.map((preset, index) => (
                    <div key={index} className="preset-item">
                      <div className="preset-info">
                        <h4>{preset.name || `${productConfigs[preset.productType]?.name || 'Продукт'} ${preset.format}`}</h4>
                        <p className="preset-details">
                          {preset.quantity?.toLocaleString()} шт. • {preset.paperType} {preset.paperDensity}г/м² • {preset.priceType}
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
                          className="btn btn-sm btn-info"
                          onClick={() => duplicatePreset(index)}
                          title="Создать копию пресета"
                        >
                          📋
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => deletePreset(index)}
                          title="Удалить пресет"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="config-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>

      {editingProductKey && editingProductConfig && (
        <EditProductModal
          isOpen={!!editingProductKey}
          onClose={closeEditModal}
          productKey={editingProductKey}
          productConfig={editingProductConfig}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
};
