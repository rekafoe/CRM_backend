import React, { useState } from 'react';
import { Item } from '../types';
import { updateOrderItem, deleteOrderItem } from '../api';

// Функция для получения названия типа продукта
const getProductTypeName = (productType: string): string => {
  const typeNames: Record<string, string> = {
    'flyers': 'Листовки',
    'business_cards': 'Визитки',
    'booklets': 'Буклеты',
    'posters': 'Плакаты',
    'brochures': 'Брошюры'
  }
  return typeNames[productType] || productType
}

// Функция для генерации детального описания товара
const generateItemDescription = (item: Item): string => {
  // ПРИОРИТЕТ 1: Используем item.type как основное название (содержит новое информативное название)
  if (item.type && item.type !== 'Товар из калькулятора' && !item.type.includes('Товар из калькулятора')) {
    return item.type;
  }
  
  // ПРИОРИТЕТ 2: Если есть готовое описание и оно не стандартное, используем его
  if (item.params.description && 
      item.params.description !== 'Описание товара' && 
      item.params.description !== 'Товар из калькулятора') {
    return item.params.description;
  }
  
  // ПРИОРИТЕТ 3: Если есть спецификации, генерируем описание
  if (item.params.specifications) {
    const specs = item.params.specifications as any;
    const parts = [];
    
    // Тип продукта
    if (specs.productType) {
      parts.push(getProductTypeName(specs.productType));
    }
    
    // Формат
    if (specs.format) {
      parts.push(specs.format);
    }
    
    // Стороны
    if (specs.sides) {
      parts.push(specs.sides === 2 ? 'двусторонние' : 'односторонние');
    }
    
    // Бумага
    if (specs.paperType && specs.paperDensity) {
      parts.push(`${specs.paperType} ${specs.paperDensity}г/м²`);
    }
    
    // Ламинация
    if (specs.lamination && specs.lamination !== 'none') {
      parts.push(`ламинация ${specs.lamination}`);
    }
    
    return parts.join(', ');
  }
  
  // Fallback на название или тип
  return (item as any).name || item.type || 'Товар из калькулятора';
}

interface OrderItemProps {
  item: Item;
  orderId: number;
  onUpdate: () => void;
}

export const OrderItem: React.FC<OrderItemProps> = ({ item, orderId, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(item.quantity ?? 1);
  const [price, setPrice] = useState(item.price);
  const [sides, setSides] = useState(item.sides ?? 1);
  const [sheets, setSheets] = useState(item.sheets ?? 0);
  const [waste, setWaste] = useState(item.waste ?? 0);
  const [customDescription, setCustomDescription] = useState(
    item.params.description && item.params.description !== 'Описание товара' 
      ? item.params.description 
      : ''
  );
  
  // Вычисляем общую стоимость
  const total = qty * price;
  
  // Получаем название товара
  const name = (item as any).name || 'Товар без названия';

  const handleSave = async () => {
    try {
      await updateOrderItem(orderId, item.id, {
        quantity: qty,
        price,
        sides,
        sheets,
        waste,
        params: {
          ...item.params,
          description: customDescription
        }
      });
      setEditing(false);
      onUpdate();
    } catch (error) {
      alert('Ошибка при обновлении позиции');
    }
  };

  const handleDelete = async () => {
    if (confirm('Удалить позицию?')) {
      try {
        await deleteOrderItem(orderId, item.id);
        onUpdate();
      } catch (error) {
        alert('Ошибка при удалении позиции');
      }
    }
  };

  return (
    <div className="item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <strong>{item.type}</strong> — {customDescription || generateItemDescription(item)}
        {item.params.paperName && (
          <span style={{ marginLeft: 6, fontSize: 12, color: '#555' }}>({item.params.paperName}{item.params.lamination && item.params.lamination!=='none' ? `, ламинация: ${item.params.lamination==='matte'?'мат':'гл'}` : ''})</span>
        )}
        {" "}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 12, color: '#666' }}>Описание товара:</label>
                <button 
                  type="button"
                  onClick={() => setCustomDescription('')}
                  style={{ 
                    fontSize: 11, 
                    padding: '2px 6px', 
                    backgroundColor: '#f0f0f0', 
                    border: '1px solid #ccc', 
                    borderRadius: 3,
                    cursor: 'pointer'
                  }}
                  title="Сбросить к автоматическому описанию"
                >
                  Авто
                </button>
              </div>
              <input 
                type="text" 
                value={customDescription} 
                onChange={e => setCustomDescription(e.target.value)} 
                placeholder="Введите описание товара"
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} step="0.01" style={{ width: 100 }} /> BYN ×
              <input type="number" value={qty} min={1} onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} style={{ width: 60 }} />
              <select value={sides} onChange={e => setSides(Number(e.target.value))}>
                <option value={1}>1 стор.</option>
                <option value={2}>2 стор.</option>
              </select>
              <input type="number" value={sheets} min={0} onChange={e => setSheets(Math.max(0, Number(e.target.value) || 0))} style={{ width: 80 }} placeholder="листы" />
              <input type="number" value={waste} min={0} onChange={e => setWaste(Math.max(0, Number(e.target.value) || 0))} style={{ width: 80 }} placeholder="брак" />
            </div>
          </div>
        ) : (
          <div className="order-item-horizontal">
            {/* Название товара */}
            <span className="item-name">
              {generateItemDescription(item)}
            </span>
            
            {/* Разделитель */}
            <span className="separator">|</span>
            
            {/* Количество */}
            <span className="item-quantity">
              {qty.toLocaleString()} шт.
            </span>
            
            {/* Разделитель */}
            <span className="separator">|</span>
            
            {/* Цена за штуку */}
            <span className="item-price">
              {price.toFixed(2)} BYN
            </span>
            
            {/* Разделитель */}
            <span className="separator">|</span>
            
            {/* Общая стоимость */}
            <span className="item-total">
              = {total.toFixed(2)} BYN
            </span>
            
            {/* Стороны */}
            {typeof sides !== 'undefined' && (
              <>
                <span className="separator">|</span>
                <span className="detail-item">
                  {sides} стор.
                </span>
              </>
            )}
            
            {/* Брак */}
            {typeof waste !== 'undefined' && waste > 0 && (
              <>
                <span className="separator">|</span>
                <span className="detail-item">
                  брак: {waste} шт.
                </span>
              </>
            )}
            
            {/* Листы SRA3 */}
            {item.params.sheetsNeeded && (
              <>
                <span className="separator">|</span>
                <span className="detail-item">
                  📄 {item.params.sheetsNeeded} листов SRA3
                  {item.params.piecesPerSheet && ` (${item.params.piecesPerSheet} шт. на листе)`}
                </span>
              </>
            )}
            
            {/* Формат */}
            {item.params.formatInfo && (
              <>
                <span className="separator">|</span>
                <span className="detail-item">
                  📐 {item.params.formatInfo}
                </span>
              </>
            )}
            
            {/* Срочность */}
            {item.params.urgency && item.params.urgency !== 'standard' && (
              <>
                <span className="separator">|</span>
                <span className="detail-item urgency">
                  ⚡ {item.params.urgency === 'urgent' ? 'СРОЧНО' : 
                      item.params.urgency === 'online' ? 'ОНЛАЙН' : 
                      item.params.urgency === 'promo' ? 'ПРОМО' : item.params.urgency}
                </span>
              </>
            )}
            
            {/* Тип клиента */}
            {item.params.customerType && item.params.customerType !== 'regular' && (
              <>
                <span className="separator">|</span>
                <span className="detail-item customer">
                  👑 {item.params.customerType === 'vip' ? 'VIP' : 
                      item.params.customerType === 'wholesale' ? 'ОПТ' : item.params.customerType}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {editing ? (
        <>
          <button
            onClick={handleSave}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#4caf50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Сохранить
          </button>
          <button 
            className="btn-danger" 
            onClick={() => setEditing(false)}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Отмена
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={() => setEditing(true)}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#2196f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Редактировать
          </button>
          <button
            className="btn-danger"
            onClick={handleDelete}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Удалить
          </button>
        </>
      )}
    </div>
  );
};

// CSS стили для горизонтального интерфейса товаров
const styles = `
  .order-item-horizontal {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    margin: 2px 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .item-name {
    font-weight: 600;
    color: #2c3e50;
    flex-shrink: 0;
  }

  .separator {
    color: #adb5bd;
    margin: 0 4px;
    font-weight: 300;
    flex-shrink: 0;
  }

  .item-quantity {
    color: #495057;
    font-weight: 500;
    flex-shrink: 0;
  }

  .item-price {
    color: #6c757d;
    font-size: 12px;
    flex-shrink: 0;
  }

  .item-total {
    color: #28a745;
    font-weight: 600;
    flex-shrink: 0;
  }

  .detail-item {
    color: #6c757d;
    background: #e9ecef;
    padding: 1px 4px;
    border-radius: 2px;
    font-weight: 500;
    font-size: 11px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .detail-item.urgency {
    background: #fff3cd;
    color: #856404;
    font-weight: 600;
  }

  .detail-item.customer {
    background: #d1ecf1;
    color: #0c5460;
    font-weight: 600;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .order-item-horizontal {
      padding: 6px 8px;
      font-size: 12px;
      gap: 2px;
    }

    .separator {
      margin: 0 2px;
    }

    .detail-item {
      font-size: 10px;
      padding: 1px 3px;
    }

    .item-name {
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .order-item-horizontal {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .separator {
      display: none;
    }

    .detail-item {
      margin-right: 8px;
      margin-bottom: 2px;
    }
  }
`;

// Добавляем стили в head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
