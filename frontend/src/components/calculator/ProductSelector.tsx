import React from 'react';
import { ProductConfig } from '../../types/shared';

interface ProductSelectorProps {
  productConfigs: Record<string, ProductConfig>;
  selectedProductType: string;
  onProductSelect: (productType: string) => void;
  onClose: () => void;
}

const getProductIcon = (productType: string): string => {
  const icons: Record<string, string> = {
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
    'forms': '📋',
    'magnetic_cards': '🧲',
    'posters_large': '🖼️',
    'perforated_cards': '✂️',
    'wall_calendars': '📅',
    'table_calendars': '📅',
    'notebooks': '📓',
    'folders': '📁',
  };
  return icons[productType] || '📦';
};

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  productConfigs,
  selectedProductType,
  onProductSelect,
  onClose
}) => {
  return (
    <div className="product-selection-modal">
      <div className="product-selection-content">
        <div className="product-selection-header">
          <h2>📦 Выберите тип продукта</h2>
          <p>Выберите тип печатной продукции для расчета</p>
        </div>
        
        <div className="product-selection-grid">
          {Object.entries(productConfigs).map(([key, config]) => (
            <button
              key={key}
              className={`product-selection-card ${key === selectedProductType ? 'selected' : ''}`}
              onClick={() => onProductSelect(key)}
            >
              <div className="product-icon">{getProductIcon(key)}</div>
              <div className="product-name">{config.name}</div>
              <div className="product-description">
                {config.description || 'Описание продукта'}
              </div>
            </button>
          ))}
        </div>
        
        <div className="product-selection-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
