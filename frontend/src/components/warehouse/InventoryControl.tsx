import React, { useState, useCallback, useMemo } from 'react';
import { Material, InventoryTransaction } from '../../types/shared';
import { useUIStore } from '../../stores/uiStore';

interface InventoryControlProps {
  materials: Material[];
  onRefresh: () => void;
}

type TransactionType = 'in' | 'out' | 'adjustment' | 'transfer';
type ViewMode = 'transactions' | 'alerts' | 'movements';

export const InventoryControl: React.FC<InventoryControlProps> = ({
  materials,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('transactions');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>('in');
  const [transactionQuantity, setTransactionQuantity] = useState<number>(0);
  const [transactionReason, setTransactionReason] = useState<string>('');

  const { showToast } = useUIStore();

  // Mock данные для транзакций
  const transactions: InventoryTransaction[] = useMemo(() => [
    {
      id: 1,
      material_id: 1,
      transaction_type: 'in',
      quantity: 100,
      reason: 'Поступление от поставщика',
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      material: materials.find(m => m.id === 1)
    },
    {
      id: 2,
      material_id: 2,
      transaction_type: 'out',
      quantity: -50,
      reason: 'Использование в заказе #123',
      user_id: 1,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      material: materials.find(m => m.id === 2)
    }
  ], [materials]);

  // Алерты о низких остатках
  const alerts = useMemo(() => {
    return materials
      .filter(m => (m.quantity || 0) <= (m.min_stock_level || 10))
      .map(material => ({
        id: material.id,
        material_id: material.id,
        alert_type: (material.quantity || 0) <= 0 ? 'out_of_stock' as const : 'low_stock' as const,
        threshold_value: material.min_stock_level || 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        material
      }));
  }, [materials]);

  // Обработчики
  const handleAddTransaction = useCallback(async () => {
    if (!selectedMaterial || transactionQuantity === 0 || !transactionReason.trim()) {
      showToast('Заполните все поля', 'warning');
      return;
    }

    try {
      // Здесь будет API вызов для создания транзакции
      showToast('Транзакция добавлена', 'success');
      setShowAddTransaction(false);
      setSelectedMaterial(null);
      setTransactionQuantity(0);
      setTransactionReason('');
      onRefresh();
    } catch (error) {
      showToast('Ошибка при добавлении транзакции', 'error');
    }
  }, [selectedMaterial, transactionQuantity, transactionReason, showToast, onRefresh]);

  const handleAdjustStock = useCallback((material: Material, newQuantity: number) => {
    setSelectedMaterial(material);
    setTransactionType('adjustment');
    setTransactionQuantity(newQuantity - (material.quantity || 0));
    setTransactionReason('Корректировка остатков');
    setShowAddTransaction(true);
  }, []);

  // Статистика
  const stats = useMemo(() => {
    const totalTransactions = transactions.length;
    const todayTransactions = transactions.filter(t => 
      new Date(t.created_at).toDateString() === new Date().toDateString()
    ).length;
    const totalIn = transactions
      .filter(t => t.transaction_type === 'in')
      .reduce((sum, t) => sum + t.quantity, 0);
    const totalOut = Math.abs(transactions
      .filter(t => t.transaction_type === 'out')
      .reduce((sum, t) => sum + t.quantity, 0));

    return {
      totalTransactions,
      todayTransactions,
      totalIn,
      totalOut,
      alertsCount: alerts.length
    };
  }, [transactions, alerts]);

  return (
    <div className="inventory-control">
      {/* Заголовок */}
      <div className="inventory-header">
        <h2>📋 Управление инвентарем</h2>
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={() => setShowAddTransaction(true)}
          >
            ➕ Добавить транзакцию
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTransactions}</div>
            <div className="stat-label">Всего транзакций</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.todayTransactions}</div>
            <div className="stat-label">Сегодня</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalIn}</div>
            <div className="stat-label">Поступлений</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOut}</div>
            <div className="stat-label">Списаний</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.alertsCount}</div>
            <div className="stat-label">Алертов</div>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="inventory-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${viewMode === 'transactions' ? 'active' : ''}`}
            onClick={() => setViewMode('transactions')}
          >
            📊 Транзакции
          </button>
          <button 
            className={`tab-btn ${viewMode === 'alerts' ? 'active' : ''}`}
            onClick={() => setViewMode('alerts')}
          >
            ⚠️ Алерты ({alerts.length})
          </button>
          <button 
            className={`tab-btn ${viewMode === 'movements' ? 'active' : ''}`}
            onClick={() => setViewMode('movements')}
          >
            🔄 Движения
          </button>
        </div>

        <div className="tabs-content">
          {viewMode === 'transactions' && (
            <div className="transactions-view">
              <div className="transactions-list">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-header">
                      <div className="transaction-type">
                        {transaction.transaction_type === 'in' && '📥 Поступление'}
                        {transaction.transaction_type === 'out' && '📤 Списание'}
                        {transaction.transaction_type === 'adjustment' && '🔧 Корректировка'}
                        {transaction.transaction_type === 'transfer' && '🔄 Перемещение'}
                      </div>
                      <div className="transaction-date">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="transaction-content">
                      <div className="material-info">
                        <strong>{transaction.material?.name}</strong>
                        <span className="quantity">
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                        </span>
                      </div>
                      <div className="transaction-reason">
                        {transaction.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'alerts' && (
            <div className="alerts-view">
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-item ${alert.alert_type}`}>
                    <div className="alert-icon">
                      {alert.alert_type === 'out_of_stock' ? '❌' : '⚠️'}
                    </div>
                    <div className="alert-content">
                      <div className="alert-title">
                        {alert.material?.name}
                      </div>
                      <div className="alert-description">
                        {alert.alert_type === 'out_of_stock' 
                          ? 'Материал закончился' 
                          : `Низкий остаток: ${alert.material?.quantity || 0} (мин: ${alert.threshold_value})`
                        }
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button 
                        className="action-btn small"
                        onClick={() => handleAdjustStock(alert.material!, (alert.material?.min_stock_level || 10) + 50)}
                      >
                        📥 Пополнить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'movements' && (
            <div className="movements-view">
              <div className="materials-movements">
                {materials.map(material => (
                  <div key={material.id} className="material-movement">
                    <div className="material-info">
                      <strong>{material.name}</strong>
                      <span className="current-stock">
                        Текущий остаток: {material.quantity || 0} {material.unit}
                      </span>
                    </div>
                    <div className="movement-actions">
                      <button 
                        className="action-btn small"
                        onClick={() => {
                          setSelectedMaterial(material);
                          setTransactionType('in');
                          setShowAddTransaction(true);
                        }}
                      >
                        📥 Поступление
                      </button>
                      <button 
                        className="action-btn small"
                        onClick={() => {
                          setSelectedMaterial(material);
                          setTransactionType('out');
                          setShowAddTransaction(true);
                        }}
                      >
                        📤 Списание
                      </button>
                      <button 
                        className="action-btn small"
                        onClick={() => handleAdjustStock(material, material.quantity || 0)}
                      >
                        🔧 Корректировка
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно добавления транзакции */}
      {showAddTransaction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Добавить транзакцию</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddTransaction(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Материал:</label>
                <select 
                  value={selectedMaterial?.id || ''}
                  onChange={(e) => {
                    const material = materials.find(m => m.id === parseInt(e.target.value));
                    setSelectedMaterial(material || null);
                  }}
                >
                  <option value="">Выберите материал</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} (остаток: {material.quantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Тип операции:</label>
                <select 
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                >
                  <option value="in">📥 Поступление</option>
                  <option value="out">📤 Списание</option>
                  <option value="adjustment">🔧 Корректировка</option>
                  <option value="transfer">🔄 Перемещение</option>
                </select>
              </div>

              <div className="form-group">
                <label>Количество:</label>
                <input 
                  type="number"
                  value={transactionQuantity}
                  onChange={(e) => setTransactionQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Введите количество"
                />
              </div>

              <div className="form-group">
                <label>Причина:</label>
                <textarea 
                  value={transactionReason}
                  onChange={(e) => setTransactionReason(e.target.value)}
                  placeholder="Укажите причину операции"
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="action-btn secondary"
                onClick={() => setShowAddTransaction(false)}
              >
                Отмена
              </button>
              <button 
                className="action-btn primary"
                onClick={handleAddTransaction}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
