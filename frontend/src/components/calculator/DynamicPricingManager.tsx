import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { APP_CONFIG } from '../../types';
import './DynamicPricingManager.css';

interface MinimumOrderCost {
  id: number;
  format: string;
  product_type: string;
  minimum_cost: number;
  max_quantity: number;
  is_active: boolean;
}

interface ProductBasePrice {
  id: number;
  product_type: string;
  format: string;
  paper_type?: string;
  paper_density?: number;
  lamination?: string;
  base_price: number;
  urgency: string;
  is_active: boolean;
}

interface MaterialPrice {
  id: number;
  material_name: string;
  material_type: string;
  unit: string;
  price_per_unit: number;
  supplier?: string;
  is_active: boolean;
}

interface ServicePrice {
  id: number;
  service_name: string;
  service_type: string;
  unit: string;
  price_per_unit: number;
  is_active: boolean;
}

interface PricingMultiplier {
  id: number;
  multiplier_type: string;
  multiplier_name: string;
  multiplier_value: number;
  description?: string;
  is_active: boolean;
}

interface DiscountRule {
  id: number;
  discount_type: string;
  discount_name: string;
  min_quantity?: number;
  min_amount?: number;
  discount_percent: number;
  conditions?: string;
  is_active: boolean;
}

interface DynamicPricingData {
  minimumOrderCosts: MinimumOrderCost[];
  productBasePrices: ProductBasePrice[];
  materialPrices: MaterialPrice[];
  servicePrices: ServicePrice[];
  pricingMultipliers: PricingMultiplier[];
  discountRules: DiscountRule[];
}

interface DynamicPricingManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicPricingManager: React.FC<DynamicPricingManagerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'minimum' | 'products' | 'materials' | 'services' | 'multipliers' | 'discounts'>('minimum');
  const [data, setData] = useState<DynamicPricingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingValues, setEditingValues] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      loadPricingData();
    }
  }, [isOpen]);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      // Для тестирования используем admin токен, если основной токен недоступен
      const token = localStorage.getItem(APP_CONFIG.storage.token) || 'admin-token-123';
      const response = await fetch('/api/dynamic-pricing/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
          logger.info('DynamicPricing', 'Загружены данные динамического ценообразования');
        }
      } else {
        logger.error('DynamicPricing', 'Ошибка загрузки данных ценообразования', response.status);
      }
    } catch (error) {
      logger.error('DynamicPricing', 'Ошибка загрузки данных ценообразования', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    setEditingValues({ ...item });
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      const { type, id } = editingItem;
      const endpoint = getUpdateEndpoint(type);
      
      // Для тестирования используем admin токен, если основной токен недоступен
      const token = localStorage.getItem(APP_CONFIG.storage.token) || 'admin-token-123';
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingValues),
      });

      if (response.ok) {
        logger.info('DynamicPricing', 'Данные обновлены успешно');
        await loadPricingData();
        setEditingItem(null);
        setEditingValues({});
      } else {
        logger.error('DynamicPricing', 'Ошибка обновления данных');
      }
    } catch (error) {
      logger.error('DynamicPricing', 'Ошибка обновления данных');
    }
  };

  const getUpdateEndpoint = (type: string): string => {
    const endpoints: Record<string, string> = {
      minimum: '/api/dynamic-pricing/minimum-order-costs',
      products: '/api/dynamic-pricing/product-base-prices',
      materials: '/api/dynamic-pricing/material-prices',
      services: '/api/dynamic-pricing/service-prices',
      multipliers: '/api/dynamic-pricing/pricing-multipliers',
      discounts: '/api/dynamic-pricing/discount-rules'
    };
    return endpoints[type] || '';
  };

  const renderMinimumOrderCosts = () => {
    if (!data?.minimumOrderCosts) return null;

    return (
      <div className="pricing-section">
        <h3>Минимальные стоимости заказов</h3>
        <div className="table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Формат</th>
                <th>Тип продукта</th>
                <th>Минимальная стоимость</th>
                <th>Макс. количество</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.minimumOrderCosts.map((item) => (
                <tr key={item.id}>
                  <td>{item.format}</td>
                  <td>{item.product_type}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingValues.minimum_cost || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, minimum_cost: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `${item.minimum_cost} BYN`
                    )}
                  </td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        value={editingValues.max_quantity || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, max_quantity: parseInt(e.target.value) })}
                      />
                    ) : (
                      item.max_quantity
                    )}
                  </td>
                  <td>
                    <span className={`status ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <div className="edit-actions">
                        <button onClick={handleSave} className="save-btn">Сохранить</button>
                        <button onClick={() => setEditingItem(null)} className="cancel-btn">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(item, 'minimum')} className="edit-btn">Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProductBasePrices = () => {
    if (!data?.productBasePrices) return null;

    return (
      <div className="pricing-section">
        <h3>Базовые цены продуктов</h3>
        <div className="table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Тип продукта</th>
                <th>Формат</th>
                <th>Бумага</th>
                <th>Плотность</th>
                <th>Ламинация</th>
                <th>Срочность</th>
                <th>Цена</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.productBasePrices.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_type}</td>
                  <td>{item.format}</td>
                  <td>{item.paper_type || '-'}</td>
                  <td>{item.paper_density || '-'}</td>
                  <td>{item.lamination || '-'}</td>
                  <td>{item.urgency}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        step="0.0001"
                        value={editingValues.base_price || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, base_price: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `${item.base_price} BYN`
                    )}
                  </td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <div className="edit-actions">
                        <button onClick={handleSave} className="save-btn">Сохранить</button>
                        <button onClick={() => setEditingItem(null)} className="cancel-btn">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(item, 'products')} className="edit-btn">Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMaterialPrices = () => {
    if (!data?.materialPrices) return null;

    return (
      <div className="pricing-section">
        <h3>Цены на материалы</h3>
        <div className="table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Тип</th>
                <th>Единица</th>
                <th>Цена за единицу</th>
                <th>Поставщик</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.materialPrices.map((item) => (
                <tr key={item.id}>
                  <td>{item.material_name}</td>
                  <td>{item.material_type}</td>
                  <td>{item.unit}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        step="0.0001"
                        value={editingValues.price_per_unit || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, price_per_unit: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `${item.price_per_unit} BYN`
                    )}
                  </td>
                  <td>{item.supplier || '-'}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <div className="edit-actions">
                        <button onClick={handleSave} className="save-btn">Сохранить</button>
                        <button onClick={() => setEditingItem(null)} className="cancel-btn">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(item, 'materials')} className="edit-btn">Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderServicePrices = () => {
    if (!data?.servicePrices) return null;

    return (
      <div className="pricing-section">
        <h3>Цены на услуги</h3>
        <div className="table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Тип</th>
                <th>Единица</th>
                <th>Цена за единицу</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.servicePrices.map((item) => (
                <tr key={item.id}>
                  <td>{item.service_name}</td>
                  <td>{item.service_type}</td>
                  <td>{item.unit}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        step="0.0001"
                        value={editingValues.price_per_unit || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, price_per_unit: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `${item.price_per_unit} BYN`
                    )}
                  </td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <div className="edit-actions">
                        <button onClick={handleSave} className="save-btn">Сохранить</button>
                        <button onClick={() => setEditingItem(null)} className="cancel-btn">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(item, 'services')} className="edit-btn">Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPricingMultipliers = () => {
    if (!data?.pricingMultipliers) return null;

    return (
      <div className="pricing-section">
        <h3>Коэффициенты ценообразования</h3>
        <div className="table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Название</th>
                <th>Значение</th>
                <th>Описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.pricingMultipliers.map((item) => (
                <tr key={item.id}>
                  <td>{item.multiplier_type}</td>
                  <td>{item.multiplier_name}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        step="0.001"
                        value={editingValues.multiplier_value || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, multiplier_value: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `${(item.multiplier_value * 100).toFixed(1)}%`
                    )}
                  </td>
                  <td>{item.description || '-'}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <div className="edit-actions">
                        <button onClick={handleSave} className="save-btn">Сохранить</button>
                        <button onClick={() => setEditingItem(null)} className="cancel-btn">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(item, 'multipliers')} className="edit-btn">Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDiscountRules = () => {
    if (!data?.discountRules) return null;

    return (
      <div className="pricing-section">
        <h3>Правила скидок</h3>
        <div className="table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Название</th>
                <th>Мин. количество</th>
                <th>Мин. сумма</th>
                <th>Скидка %</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.discountRules.map((item) => (
                <tr key={item.id}>
                  <td>{item.discount_type}</td>
                  <td>{item.discount_name}</td>
                  <td>{item.min_quantity || '-'}</td>
                  <td>{item.min_amount ? `${item.min_amount} BYN` : '-'}</td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingValues.discount_percent || ''}
                        onChange={(e) => setEditingValues({ ...editingValues, discount_percent: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `${item.discount_percent}%`
                    )}
                  </td>
                  <td>
                    {editingItem?.id === item.id ? (
                      <div className="edit-actions">
                        <button onClick={handleSave} className="save-btn">Сохранить</button>
                        <button onClick={() => setEditingItem(null)} className="cancel-btn">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(item, 'discounts')} className="edit-btn">Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="dynamic-pricing-manager">
      <div className="pricing-modal">
        <div className="pricing-header">
          <h2>Управление динамическим ценообразованием</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="pricing-tabs">
          <button 
            className={activeTab === 'minimum' ? 'active' : ''} 
            onClick={() => setActiveTab('minimum')}
          >
            Минимальные заказы
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            Цены продуктов
          </button>
          <button 
            className={activeTab === 'materials' ? 'active' : ''} 
            onClick={() => setActiveTab('materials')}
          >
            Материалы
          </button>
          <button 
            className={activeTab === 'services' ? 'active' : ''} 
            onClick={() => setActiveTab('services')}
          >
            Услуги
          </button>
          <button 
            className={activeTab === 'multipliers' ? 'active' : ''} 
            onClick={() => setActiveTab('multipliers')}
          >
            Коэффициенты
          </button>
          <button 
            className={activeTab === 'discounts' ? 'active' : ''} 
            onClick={() => setActiveTab('discounts')}
          >
            Скидки
          </button>
        </div>

        <div className="pricing-content">
          {loading ? (
            <div className="loading">Загрузка данных...</div>
          ) : (
            <>
              {activeTab === 'minimum' && renderMinimumOrderCosts()}
              {activeTab === 'products' && renderProductBasePrices()}
              {activeTab === 'materials' && renderMaterialPrices()}
              {activeTab === 'services' && renderServicePrices()}
              {activeTab === 'multipliers' && renderPricingMultipliers()}
              {activeTab === 'discounts' && renderDiscountRules()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
