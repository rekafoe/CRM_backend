import React, { useState, useEffect } from 'react';
import { useToastNotifications } from '../Toast';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorDisplay } from '../ErrorStates';
import { api } from '../../api';
import './PriceManagementPage.css';

interface PriceChangeNotification {
  id: number;
  material_id: number;
  material_name: string;
  old_price: number;
  new_price: number;
  change_percent: number;
  affected_orders_count: number;
  notification_sent: boolean;
  created_at: string;
}

interface PriceHistoryItem {
  id: number;
  material_id: number;
  material_name: string;
  old_price: number;
  new_price: number;
  change_percent: number;
  change_reason: string;
  changed_by_name: string;
  created_at: string;
}

interface PriceAnalytics {
  priceChanges: {
    total_changes: number;
    avg_change_percent: number;
    max_increase: number;
    max_decrease: number;
    price_increases: number;
    price_decreases: number;
  };
  affectedOrders: {
    total_notifications: number;
    total_affected_orders: number;
    avg_affected_orders: number;
  };
  topChanges: Array<{
    material_name: string;
    old_price: number;
    new_price: number;
    change_percent: number;
    created_at: string;
  }>;
  marginStats: {
    total_orders: number;
    avg_order_value: number;
    orders_with_price_snapshots: number;
  };
  period: string;
}

export const PriceManagementPage: React.FC = () => {
  const toast = useToastNotifications();
  const [activeTab, setActiveTab] = useState<'notifications' | 'history' | 'analytics' | 'recalculation'>('notifications');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные
  const [notifications, setNotifications] = useState<PriceChangeNotification[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<PriceAnalytics | null>(null);
  
  // Фильтры
  const [period, setPeriod] = useState('30');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Загрузка уведомлений
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/price-management/notifications', {
        params: { limit: 50, unreadOnly }
      });
      setNotifications(response.data.data);
    } catch (error: any) {
      setError('Ошибка загрузки уведомлений: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка истории цен
  const loadPriceHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/price-management/history', {
        params: { limit: 50 }
      });
      setPriceHistory(response.data.data);
    } catch (error: any) {
      setError('Ошибка загрузки истории цен: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка аналитики
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/price-management/analytics', {
        params: { period }
      });
      setAnalytics(response.data.data);
    } catch (error: any) {
      setError('Ошибка загрузки аналитики: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Пересчет цены товара
  const recalculateItemPrice = async (itemId: number) => {
    try {
      setLoading(true);
      const response = await api.post(`/price-management/item/${itemId}/recalculate`);
      const result = response.data.data;
      
      toast.success(
        'Цена пересчитана', 
        `Старая цена: ${result.oldPrice.toFixed(2)} BYN, новая: ${result.newPrice.toFixed(2)} BYN (${result.priceDifferencePercent.toFixed(2)}%)`
      );
    } catch (error: any) {
      toast.error('Ошибка пересчета цены: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Создание снимка цен
  const createPriceSnapshot = async () => {
    try {
      setLoading(true);
      await api.post('/price-management/snapshot');
      toast.success('Снимок цен создан', 'Текущие цены сохранены в систему');
    } catch (error: any) {
      toast.error('Ошибка создания снимка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    } else if (activeTab === 'history') {
      loadPriceHistory();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, unreadOnly, period]);

  const formatPrice = (price: number) => `${price.toFixed(2)} BYN`;
  const formatPercent = (percent: number) => `${percent.toFixed(2)}%`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ru-RU');

  const getChangeColor = (percent: number) => {
    if (percent > 0) return '#e53e3e'; // красный для увеличения
    if (percent < 0) return '#38a169'; // зеленый для уменьшения
    return '#718096'; // серый для без изменений
  };

  const getChangeIcon = (percent: number) => {
    if (percent > 0) return '📈';
    if (percent < 0) return '📉';
    return '➡️';
  };

  if (loading && !notifications.length && !priceHistory.length && !analytics) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => setError(null)} />;
  }

  return (
    <div className="price-management-page">
      <div className="page-header">
        <h1>💰 Управление ценами</h1>
        <p>Мониторинг изменений цен, аналитика и пересчет заказов</p>
      </div>

      {/* Навигация по вкладкам */}
      <div className="tabs-navigation">
        <button 
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Уведомления ({notifications.filter(n => !n.notification_sent).length})
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📊 История цен
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Аналитика
        </button>
        <button 
          className={activeTab === 'recalculation' ? 'active' : ''}
          onClick={() => setActiveTab('recalculation')}
        >
          🔄 Пересчет
        </button>
      </div>

      {/* Контент вкладок */}
      <div className="tab-content">
        {activeTab === 'notifications' && (
          <div className="notifications-tab">
            <div className="tab-header">
              <h2>Уведомления об изменениях цен</h2>
              <div className="tab-controls">
                <label>
                  <input 
                    type="checkbox" 
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                  />
                  Только непрочитанные
                </label>
                <button onClick={loadNotifications} disabled={loading}>
                  🔄 Обновить
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>Нет уведомлений об изменениях цен</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className="notification-card">
                    <div className="notification-header">
                      <span className="material-name">{notification.material_name}</span>
                      <span className="change-indicator" style={{ color: getChangeColor(notification.change_percent) }}>
                        {getChangeIcon(notification.change_percent)} {formatPercent(notification.change_percent)}
                      </span>
                    </div>
                    <div className="notification-details">
                      <div className="price-change">
                        <span className="old-price">{formatPrice(notification.old_price)}</span>
                        <span className="arrow">→</span>
                        <span className="new-price">{formatPrice(notification.new_price)}</span>
                      </div>
                      <div className="notification-meta">
                        <span>Затронуто заказов: {notification.affected_orders_count}</span>
                        <span>{formatDate(notification.created_at)}</span>
                        {!notification.notification_sent && (
                          <span className="unread-badge">Новое</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <div className="tab-header">
              <h2>История изменений цен</h2>
              <button onClick={loadPriceHistory} disabled={loading}>
                🔄 Обновить
              </button>
            </div>

            {priceHistory.length === 0 ? (
              <div className="empty-state">
                <p>История изменений цен пуста</p>
              </div>
            ) : (
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Материал</th>
                      <th>Старая цена</th>
                      <th>Новая цена</th>
                      <th>Изменение</th>
                      <th>Причина</th>
                      <th>Кто изменил</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.material_name}</td>
                        <td>{formatPrice(item.old_price)}</td>
                        <td>{formatPrice(item.new_price)}</td>
                        <td style={{ color: getChangeColor(item.change_percent) }}>
                          {getChangeIcon(item.change_percent)} {formatPercent(item.change_percent)}
                        </td>
                        <td>{item.change_reason}</td>
                        <td>{item.changed_by_name || 'Система'}</td>
                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="tab-header">
              <h2>Аналитика по ценам</h2>
              <div className="tab-controls">
                <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="7">7 дней</option>
                  <option value="30">30 дней</option>
                  <option value="90">90 дней</option>
                  <option value="365">1 год</option>
                </select>
                <button onClick={loadAnalytics} disabled={loading}>
                  🔄 Обновить
                </button>
              </div>
            </div>

            {analytics ? (
              <div className="analytics-content">
                {/* Общая статистика */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Изменения цен</h3>
                    <div className="stat-value">{analytics.priceChanges.total_changes}</div>
                    <div className="stat-details">
                      <span>Увеличений: {analytics.priceChanges.price_increases}</span>
                      <span>Уменьшений: {analytics.priceChanges.price_decreases}</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <h3>Среднее изменение</h3>
                    <div className="stat-value" style={{ color: getChangeColor(analytics.priceChanges.avg_change_percent) }}>
                      {formatPercent(analytics.priceChanges.avg_change_percent)}
                    </div>
                    <div className="stat-details">
                      <span>Макс. рост: {formatPercent(analytics.priceChanges.max_increase)}</span>
                      <span>Макс. спад: {formatPercent(analytics.priceChanges.max_decrease)}</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <h3>Затронутые заказы</h3>
                    <div className="stat-value">{analytics.affectedOrders.total_affected_orders}</div>
                    <div className="stat-details">
                      <span>Уведомлений: {analytics.affectedOrders.total_notifications}</span>
                      <span>Среднее: {analytics.affectedOrders.avg_affected_orders.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <h3>Маржинальность</h3>
                    <div className="stat-value">{formatPrice(analytics.marginStats.avg_order_value)}</div>
                    <div className="stat-details">
                      <span>Заказов: {analytics.marginStats.total_orders}</span>
                      <span>Со снимками: {analytics.marginStats.orders_with_price_snapshots}</span>
                    </div>
                  </div>
                </div>

                {/* Топ изменений */}
                <div className="top-changes">
                  <h3>Топ изменений цен за {analytics.period}</h3>
                  <div className="changes-list">
                    {analytics.topChanges.map((change, index) => (
                      <div key={index} className="change-item">
                        <span className="change-rank">#{index + 1}</span>
                        <span className="change-material">{change.material_name}</span>
                        <span className="change-price">
                          {formatPrice(change.old_price)} → {formatPrice(change.new_price)}
                        </span>
                        <span className="change-percent" style={{ color: getChangeColor(change.change_percent) }}>
                          {getChangeIcon(change.change_percent)} {formatPercent(change.change_percent)}
                        </span>
                        <span className="change-date">{formatDate(change.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Загрузите аналитику для просмотра данных</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recalculation' && (
          <div className="recalculation-tab">
            <div className="tab-header">
              <h2>Пересчет цен заказов</h2>
              <button onClick={createPriceSnapshot} disabled={loading}>
                📸 Создать снимок цен
              </button>
            </div>

            <div className="recalculation-info">
              <div className="info-card">
                <h3>ℹ️ Информация о пересчете</h3>
                <ul>
                  <li>Пересчет позволяет обновить цены в заказах с учетом текущих цен материалов</li>
                  <li>Рекомендуется создавать снимок цен перед массовыми изменениями</li>
                  <li>Пересчет доступен только для заказов со статусом "В ожидании" или "В работе"</li>
                  <li>История изменений сохраняется для аудита</li>
                </ul>
              </div>

              <div className="recalculation-actions">
                <h3>Действия</h3>
                <div className="action-buttons">
                  <button 
                    className="primary-button"
                    onClick={() => toast.info('Функция в разработке', 'Пересчет отдельных товаров будет доступен в следующей версии')}
                  >
                    🔄 Пересчитать товар
                  </button>
                  <button 
                    className="secondary-button"
                    onClick={() => toast.info('Функция в разработке', 'Массовый пересчет будет доступен в следующей версии')}
                  >
                    📊 Массовый пересчет
                  </button>
                  <button 
                    className="secondary-button"
                    onClick={() => toast.info('Функция в разработке', 'Экспорт данных будет доступен в следующей версии')}
                  >
                    📤 Экспорт данных
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
