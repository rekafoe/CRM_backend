import React from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useMaterialStore } from '../../stores/materialStore';
import { useCalculatorStore } from '../../stores/calculatorStore';
import { useUIStore } from '../../stores/uiStore';
import { useOrders, useMaterials } from '../../api/hooks/useOrders';
import { useMaterials as useMaterialsQuery } from '../../api/hooks/useMaterials';

// Пример компонента, показывающего использование stores
export const StoreUsageExample: React.FC = () => {
  // Использование Zustand stores
  const { orders, addOrder, updateOrder } = useOrderStore();
  const { materials, addMaterial } = useMaterialStore();
  const { specs, updateSpecs, result } = useCalculatorStore();
  const { notifications, addNotification } = useUIStore();
  
  // Использование React Query hooks
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: materialsData, isLoading: materialsLoading } = useMaterialsQuery();
  
  const handleAddOrder = () => {
    const newOrder = {
      id: Date.now(),
      customer_name: 'Новый клиент',
      customer_phone: '+375291234567',
      status: 'pending',
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    addOrder(newOrder);
    addNotification({
      type: 'success',
      message: 'Заказ добавлен успешно!'
    });
  };
  
  const handleUpdateSpecs = () => {
    updateSpecs({
      quantity: 200,
      format: 'A5'
    });
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Пример использования Stores</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Zustand Stores</h3>
        <p>Заказов в store: {orders.length}</p>
        <p>Материалов в store: {materials.length}</p>
        <p>Текущие параметры калькулятора: {specs.productType} - {specs.format}</p>
        <p>Уведомлений: {notifications.length}</p>
        
        <button onClick={handleAddOrder}>
          Добавить заказ
        </button>
        <button onClick={handleUpdateSpecs}>
          Обновить параметры
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>React Query</h3>
        <p>Заказов загружено: {ordersData?.length || 0}</p>
        <p>Материалов загружено: {materialsData?.length || 0}</p>
        <p>Загрузка заказов: {ordersLoading ? 'Да' : 'Нет'}</p>
        <p>Загрузка материалов: {materialsLoading ? 'Да' : 'Нет'}</p>
      </div>
      
      <div>
        <h3>Результат расчета</h3>
        {result ? (
          <div>
            <p>Продукт: {result.productName}</p>
            <p>Общая стоимость: {result.totalCost} BYN</p>
            <p>Цена за штуку: {result.pricePerItem} BYN</p>
          </div>
        ) : (
          <p>Нет результатов расчета</p>
        )}
      </div>
    </div>
  );
};
