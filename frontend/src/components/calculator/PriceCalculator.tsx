import React, { useState } from 'react';
import { CalculationResult } from '../../types/shared';

interface PriceCalculatorProps {
  result: CalculationResult | null;
  isCalculating: boolean;
  onAddToOrder: (customDescription?: string) => void;
  isValid: boolean;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  result,
  isCalculating,
  onAddToOrder,
  isValid
}) => {
  const [customDescription, setCustomDescription] = useState('');
  if (isCalculating) {
    return (
      <div className="result-section">
        <div className="calculating">
          <div className="spinner"></div>
          <p>Выполняется расчет...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-section">
        <div className="no-result">
          <p>Заполните параметры для расчета стоимости</p>
        </div>
      </div>
    );
  }

  return (
    <div className="result-section">
      <h3>💰 Результат расчета</h3>
      <div className="result-content">
        <div className="result-summary">
          <div className="result-item">
            <span>Продукт:</span>
            <span>{result.productName}</span>
          </div>
          <div className="result-item">
            <span>Количество:</span>
            <span>{result.specifications.quantity} шт</span>
          </div>
          <div className="result-item">
            <span>Цена за штуку:</span>
            <span>{result.pricePerItem.toFixed(2)} BYN</span>
          </div>
          <div className="result-item total">
            <span>Общая стоимость:</span>
            <span>{result.totalCost.toFixed(2)} BYN</span>
          </div>
          <div className="result-item">
            <span>Срок:</span>
            <span>{result.productionTime}</span>
          </div>
        </div>
        
        {/* Материалы и расходники */}
        {result.materials && result.materials.length > 0 && (
          <div className="materials-section">
            <h4>📦 Материалы и расходники</h4>
            <div className="materials-list">
              {result.materials.map((material: any, index: number) => (
                <div key={index} className="material-item">
                  <div className="material-info">
                    <span className="material-name">{material.material}</span>
                    <span className="material-quantity">{material.quantity} {material.unit}</span>
                  </div>
                  <div className="material-cost">
                    <span className="material-price">{material.price.toFixed(2)} BYN за {material.unit}</span>
                    <span className="material-total">= {material.total.toFixed(2)} BYN</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Услуги */}
        {(result as any).services && (result as any).services.length > 0 && (
          <div className="services-section">
            <h4>🔧 Дополнительные услуги</h4>
            <div className="services-list">
              {(result as any).services.map((service: any, index: number) => (
                <div key={index} className="service-item">
                  <span className="service-name">{service.service}</span>
                  <span className="service-cost">{service.total.toFixed(2)} BYN</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Поле для редактирования описания */}
        <div className="description-section">
          <h4>📝 Описание товара</h4>
          <div className="description-field">
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Введите описание товара для оператора (например: 'Рекламные листовки для акции', 'Визитки VIP-клиентов')"
              className="description-input"
              rows={3}
            />
            <div className="description-hint">
              💡 Это описание поможет оператору понять, какие материалы использовать при изготовлении
            </div>
          </div>
        </div>
        
        <div className="result-actions">
          <button 
            className="btn btn-primary"
            onClick={() => onAddToOrder(customDescription)}
            disabled={!isValid}
          >
            ➕ Добавить в заказ
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS стили для материалов и услуг
const styles = `
  .materials-section, .services-section {
    margin-top: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .materials-section h4, .services-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #495057;
  }
  
  .materials-list, .services-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .material-item, .service-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #dee2e6;
  }
  
  .material-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .material-name, .service-name {
    font-weight: 500;
    color: #212529;
    font-size: 13px;
  }
  
  .material-quantity {
    font-size: 11px;
    color: #6c757d;
  }
  
  .material-cost {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  
  .material-price {
    font-size: 11px;
    color: #6c757d;
  }
  
  .material-total, .service-cost {
    font-weight: 600;
    color: #28a745;
    font-size: 13px;
  }
  
  .service-item {
    justify-content: space-between;
  }
  
  .service-name {
    font-weight: 500;
    color: #212529;
  }
  
  .service-cost {
    font-weight: 600;
    color: #28a745;
  }
  
  .description-section {
    margin-top: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .description-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #495057;
  }
  
  .description-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .description-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
  }
  
  .description-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .description-hint {
    font-size: 11px;
    color: #6c757d;
    font-style: italic;
  }
`;

// Добавляем стили в head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
