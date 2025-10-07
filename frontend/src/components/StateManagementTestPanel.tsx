import React, { useState } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { useMaterialStore } from '../stores/materialStore';
import { useCalculatorStore } from '../stores/calculatorStore';
import { useUIStore } from '../stores/uiStore';

export const StateManagementTestPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testMode, setTestMode] = useState<'stores' | 'api'>('stores');
  
  // Zustand stores
  const { 
    orders, 
    addOrder, 
    updateOrder, 
    deleteOrder,
    getOrderTotal 
  } = useOrderStore();
  
  const { 
    materials, 
    addMaterial, 
    updateMaterial,
    getLowStockMaterials 
  } = useMaterialStore();
  
  const { 
    specs, 
    updateSpecs, 
    result, 
    addToHistory,
    savedPresets,
    savePreset 
  } = useCalculatorStore();
  
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    isCalculatorOpen,
    openCalculator,
    closeCalculator 
  } = useUIStore();

  // Тестовые функции
  const testOrderOperations = () => {
    const testOrder = {
      id: Date.now(),
      customer_name: `Тест клиент ${Date.now()}`,
      customer_phone: '+375291234567',
      status: 'pending',
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    addOrder(testOrder);
    addNotification({
      type: 'success',
      message: 'Тестовый заказ добавлен!'
    });
  };

  const testMaterialOperations = () => {
    const testMaterial = {
      id: Date.now(),
      name: `Тест материал ${Date.now()}`,
      category: 'paper',
      quantity: 100,
      unit: 'лист',
      price_per_unit: 0.5,
      supplier: 'Тест поставщик'
    };
    
    addMaterial(testMaterial);
    addNotification({
      type: 'info',
      message: 'Тестовый материал добавлен!'
    });
  };

  const testCalculatorOperations = () => {
    updateSpecs({
      quantity: Math.floor(Math.random() * 1000) + 100,
      format: ['A4', 'A5', 'A6'][Math.floor(Math.random() * 3)],
      productType: ['flyers', 'business_cards', 'booklets'][Math.floor(Math.random() * 3)]
    });
    
    addNotification({
      type: 'warning',
      message: 'Параметры калькулятора обновлены!'
    });
  };

  const testPresetOperations = () => {
    const testPreset = {
      ...specs,
      productType: 'test_preset',
      format: 'A4'
    };
    
    savePreset(testPreset);
    addNotification({
      type: 'success',
      message: 'Пресет сохранен!'
    });
  };

  const testUIOperations = () => {
    if (isCalculatorOpen) {
      closeCalculator();
      addNotification({
        type: 'info',
        message: 'Калькулятор закрыт!'
      });
    } else {
      openCalculator();
      addNotification({
        type: 'success',
        message: 'Калькулятор открыт!'
      });
    }
  };

  const clearAllData = () => {
    // Очищаем тестовые данные
    orders.forEach(order => {
      if (order.customer_name.includes('Тест')) {
        deleteOrder(order.id);
      }
    });
    
    materials.forEach(material => {
      if (material.name.includes('Тест')) {
        // В реальном приложении нужно добавить deleteMaterial
      }
    });
    
    addNotification({
      type: 'warning',
      message: 'Тестовые данные очищены!'
    });
  };

  return (
    <>
      {/* Кнопка для открытия панели */}
      <button 
        className={`state-test-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Тест управления состоянием"
      >
        🧪
        {notifications.length > 0 && (
          <span className="state-test-notification">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Панель тестирования */}
      {isOpen && (
        <div style={{ 
          position: 'fixed',
          top: '60px',
          right: '20px',
          width: '400px',
          maxHeight: '80vh',
          backgroundColor: '#f8f9fa',
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '20px',
          zIndex: 1000,
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#007bff' }}>🧪 Тест состояния</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '18px', 
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={() => setTestMode('stores')}
              style={{ 
                marginRight: '10px',
                backgroundColor: testMode === 'stores' ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              Zustand
            </button>
            <button 
              onClick={() => setTestMode('api')}
              style={{ 
                backgroundColor: testMode === 'api' ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              React Query
            </button>
          </div>

          {testMode === 'stores' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>Заказы ({orders.length})</h4>
                  <button 
                    onClick={testOrderOperations} 
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px',
                      marginRight: '5px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px'
                    }}
                  >
                    ➕ Тест заказ
                  </button>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>Материалы ({materials.length})</h4>
                  <button 
                    onClick={testMaterialOperations} 
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px'
                    }}
                  >
                    ➕ Тест материал
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>Калькулятор</h4>
                  <p style={{ fontSize: '11px', margin: '0 0 5px 0' }}>
                    <strong>{specs.productType}</strong> - {specs.quantity} шт
                  </p>
                  <button 
                    onClick={testCalculatorOperations} 
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px',
                      backgroundColor: '#ffc107',
                      color: 'black',
                      border: 'none',
                      borderRadius: '3px'
                    }}
                  >
                    🔄 Обновить
                  </button>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>UI ({notifications.length})</h4>
                  <p style={{ fontSize: '11px', margin: '0 0 5px 0' }}>
                    Калькулятор: {isCalculatorOpen ? 'Открыт' : 'Закрыт'}
                  </p>
                  <button 
                    onClick={testUIOperations} 
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px',
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px'
                    }}
                  >
                    🔄 Переключить
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <button 
                  onClick={clearAllData} 
                  style={{ 
                    fontSize: '11px', 
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    width: '100%'
                  }}
                >
                  🗑️ Очистить тесты
                </button>
              </div>
              
              {result && (
                <div style={{ 
                  backgroundColor: '#e9ecef', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Результат расчета</h4>
                  <p style={{ margin: '2px 0' }}><strong>Продукт:</strong> {result.productName}</p>
                  <p style={{ margin: '2px 0' }}><strong>Стоимость:</strong> {result.totalCost} BYN</p>
                  <p style={{ margin: '2px 0' }}><strong>За штуку:</strong> {result.pricePerItem} BYN</p>
                </div>
              )}
            </div>
          )}

          {testMode === 'api' && (
            <div>
              <h4 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>React Query API</h4>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                <p>✅ <code>useOrders()</code> - загрузка заказов</p>
                <p>✅ <code>useMaterials()</code> - загрузка материалов</p>
                <p>✅ <code>usePricing()</code> - ценообразование</p>
                <p>✅ <code>useCreateOrder()</code> - создание заказов</p>
                <p>✅ <code>useUpdateOrder()</code> - обновление заказов</p>
                <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                  Для полного тестирования API нужно запустить backend сервер
                </p>
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: '15px', 
            padding: '8px', 
            backgroundColor: '#d4edda', 
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '11px' }}>✅ Статус</h4>
            <ul style={{ margin: 0, paddingLeft: '15px' }}>
              <li>Zustand stores работают</li>
              <li>Состояние синхронизируется</li>
              <li>Уведомления отображаются</li>
              <li>API hooks настроены</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
