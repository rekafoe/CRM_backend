import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Order } from "../../types";
import {
  getOrders,
  createOrder,
  deleteOrder,
  deleteOrderItem,
  updateOrderStatus,
  updateOrderItem,
  addOrderItem,
} from "../../api";
import { useNavigate } from 'react-router-dom';
import AddItemModal from "../AddItemModal";
import ManageMaterialsModal from "../ManageMaterialsModal";
import ManagePresetsModal from "../ManagePresetsModal";
import { PrepaymentModal } from "../PrepaymentModal";
import { ImprovedPrintingCalculatorModal } from "../calculator/ImprovedPrintingCalculatorModal";
import { PaperTypesManager } from "../PaperTypesManager";
import { CountersPage } from "../../pages/CountersPage";
import { useToastNotifications } from "../Toast";
import { useLogger } from "../../utils/logger";
import "../../styles/admin-page-layout.css";
import "../../styles/admin-cards.css";

import { ProgressBar } from "../order/ProgressBar";
import { OrderTotal } from "../order/OrderTotal";
import { FilesModal } from "../FilesModal";
import { PrepaymentDetailsModal } from "../PrepaymentDetailsModal";
import { OrderPool } from "../orders/OrderPool";
import { UserOrderPage } from "../orders/UserOrderPage";
import { DateSwitcher } from "../orders/DateSwitcher";
import { setAuthToken, getOrderStatuses, listOrderFiles, uploadOrderFile, deleteOrderFile, approveOrderFile, createPrepaymentLink, getLowStock, getCurrentUser, getUsers, getDailyReportByDate, createDailyReport } from '../../api';
import { APP_CONFIG } from '../../types';
import type { OrderFile } from '../../types';
import { StateManagementTestPanel } from '../StateManagementTestPanel';
import { OptimizedOrderList } from './OptimizedOrderList';
import { MemoizedOrderItem } from './MemoizedOrderItem';
import { MemoizedOrderList } from './MemoizedOrderList';
import { OrderManagementPage } from '../../pages/OrderManagementPage';

interface OptimizedAppProps {
  onClose?: () => void;
}

// Основной компонент приложения с оптимизацией
export const OptimizedApp: React.FC<OptimizedAppProps> = ({ onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [statuses, setStatuses] = useState<Array<{ id: number; name: string; color?: string; sort_order: number }>>([]);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [prepayAmount, setPrepayAmount] = useState<string>('');
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [showPrepaymentModal, setShowPrepaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('orders');
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [allUsers, setAllUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [contextDate, setContextDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [contextUserId, setContextUserId] = useState<number | null>(null);
  const [showTopPicker, setShowTopPicker] = useState(false);
  const [showPrintingCalculator, setShowPrintingCalculator] = useState(false);
  const [showPaperTypesManager, setShowPaperTypesManager] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showPrepaymentDetailsModal, setShowPrepaymentDetailsModal] = useState(false);
  const [showOrderPool, setShowOrderPool] = useState(false);
  const [showUserOrderPage, setShowUserOrderPage] = useState(false);
  const [showCountersPage, setShowCountersPage] = useState(false);
  const [orderManagementTab, setOrderManagementTab] = useState<'pool' | 'page'>('pool');
  const [showPageSwitcher, setShowPageSwitcher] = useState(false);
  
  // Реф для отслеживания предыдущих значений и предотвращения циклов
  const prevValuesRef = useRef({ currentUser: null, contextUserId: null, contextDate: null });

  // Хуки для уведомлений и логирования
  const toast = useToastNotifications();
  const logger = useLogger('OptimizedApp');

  // Мемоизированные обработчики
  const handleLogout = useCallback(() => {
    try {
      setAuthToken(undefined);
      localStorage.removeItem('crmRole');
      localStorage.removeItem('crmSessionDate');
      localStorage.removeItem('crmUserId');
    } catch {}
    location.href = '/login';
  }, []);

  const loadOrders = useCallback((date?: string) => {
    const targetDate = (date || contextDate).slice(0,10);
    const uid = contextUserId ?? currentUser?.id ?? null;
    
    getOrders().then((res) => {
      const filtered = res.data
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = new Date(o.createdAt).toISOString().slice(0,10);
          return orderDate === targetDate;
        })
        .filter(o => uid == null ? true : ((o as any).userId == null || (o as any).userId === uid));
      
      // Убираем дубликаты по ID
      const uniqueOrders = filtered.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      setOrders(uniqueOrders);
      if (!selectedId && uniqueOrders.length) setSelectedId(uniqueOrders[0].id);
    }).catch((error) => {
      logger.error('Failed to load orders', error);
      toast.error('Ошибка загрузки заказов', error.message);
    });
  }, [contextDate, contextUserId, currentUser, selectedId]);

  // Стабильная функция для обновления даты с полной перезагрузкой
  const handleDateChange = useCallback((newDate: string) => {
    setContextDate(newDate);
    // Полная перезагрузка заказов для избежания визуальных багов
    const targetDate = newDate.slice(0,10);
    const uid = contextUserId ?? currentUser?.id ?? null;
    
    getOrders().then((res) => {
      const filtered = res.data
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = new Date(o.createdAt).toISOString().slice(0,10);
          return orderDate === targetDate;
        })
        .filter(o => uid == null ? true : ((o as any).userId == null || (o as any).userId === uid));
      
      // Убираем дубликаты по ID
      const uniqueOrders = filtered.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      setOrders(uniqueOrders);
      if (!selectedId && uniqueOrders.length) setSelectedId(uniqueOrders[0].id);
    }).catch((error) => {
      logger.error('Failed to load orders', error);
      toast.error('Ошибка загрузки заказов', error.message);
    });
  }, [contextUserId, currentUser, selectedId]);

  const handleCreateOrder = useCallback(async () => {
    const res = await createOrder(contextDate);
    const order = res.data;
    // Убираем дубликаты и добавляем новый заказ в начало
    const uniqueOrders = orders.filter(o => o.id !== order.id);
    setOrders([order, ...uniqueOrders]);
    setSelectedId(order.id);
  }, [orders, contextDate]);

  const handleAddToOrder = useCallback(async (item: any) => {
    try {
      let orderId = selectedId;
      
      if (!orderId) {
        const res = await createOrder(contextDate);
        orderId = res.data.id;
        setSelectedId(orderId);
        await loadOrders();
      }
      
      const apiItem = {
        type: item.type || item.name || 'Товар из калькулятора',
        params: {
          description: item.description || 'Описание товара',
          specifications: item.specifications,
          materials: item.materials,
          services: item.services,
          productionTime: item.productionTime,
          productType: item.productType,
          urgency: item.urgency,
          customerType: item.customerType,
          estimatedDelivery: item.estimatedDelivery
        },
        price: item.price || 0,
        quantity: item.quantity || 1,
        printerId: undefined,
        sides: item.specifications?.sides || 1,
        sheets: 1,
        waste: 0,
        clicks: 1,
        components: item.materials?.map((m: any) => ({
          materialId: m.material.id,
          qtyPerItem: m.quantity / item.quantity
        })) || []
      };
      
      await addOrderItem(orderId, apiItem);
      await loadOrders();
      setShowPrintingCalculator(false);
      
      toast.success('Товар добавлен в заказ!', 'Товар успешно добавлен в заказ');
      logger.info('Item added to order');
    } catch (error) {
      logger.error('Failed to add item to order', error);
      toast.error('Ошибка добавления товара', (error as Error).message);
    }
  }, [selectedId, loadOrders, toast, logger]);

  // Мемоизированные вычисления
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedId) || null;
  }, [orders, selectedId]);

  const lowStockCount = useMemo(() => {
    return lowStock.length;
  }, [lowStock]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  }, [orders]);

  // Эффекты
  useEffect(() => {
    getOrderStatuses().then(r => setStatuses(r.data));
    getCurrentUser().then(r => setCurrentUser(r.data)).catch(() => setCurrentUser(null));
    getUsers().then(r => setAllUsers(r.data)).catch(() => setAllUsers([]));
    if (typeof window !== 'undefined' && localStorage.getItem(APP_CONFIG.storage.role) === 'admin') {
      getLowStock().then(r => setLowStock(r.data as any[]));
    }
  }, []);

  useEffect(() => {
    if (currentUser && !contextUserId) setContextUserId(currentUser.id);
  }, [currentUser, contextUserId]);

  useEffect(() => {
    if (currentUser) {
      const targetDate = contextDate.slice(0,10);
      const uid = contextUserId ?? currentUser?.id ?? null;
      
      // Проверяем, изменились ли значения
      const prevValues = prevValuesRef.current;
      const hasChanged = 
        prevValues.currentUser !== currentUser ||
        prevValues.contextUserId !== contextUserId ||
        prevValues.contextDate !== contextDate;
      
      if (!hasChanged) {
        return; // Пропускаем если значения не изменились
      }
      
      // Обновляем предыдущие значения
      prevValuesRef.current = { currentUser, contextUserId, contextDate };
      
      getOrders().then((res) => {
        const filtered = res.data
          .filter(o => {
            if (!o.createdAt) return false;
            const orderDate = new Date(o.createdAt).toISOString().slice(0,10);
            return orderDate === targetDate;
          })
          .filter(o => uid == null ? true : ((o as any).userId == null || (o as any).userId === uid));
        
        // Убираем дубликаты по ID
        const uniqueOrders = filtered.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        );
        
        setOrders(uniqueOrders);
        // Устанавливаем selectedId только если его нет и есть заказы
        if (!selectedId && uniqueOrders.length > 0) {
          setSelectedId(uniqueOrders[0].id);
        }
      }).catch((error) => {
        logger.error('Failed to load orders', error);
        toast.error('Ошибка загрузки заказов', error.message);
      });
    }
  }, [currentUser, contextUserId, contextDate]);

  useEffect(() => {
    if (selectedId) {
      listOrderFiles(selectedId).then(r => {
        setFiles(r.data);
      }).catch((error) => {
        logger.error('Failed to load files for order', error);
        toast.error('Ошибка загрузки файлов', 'Не удалось загрузить файлы для заказа');
        setFiles([]);
      });
    } else {
      setFiles([]);
    }
  }, [selectedId]);

  return (
    <div className="app">
      {currentPage === 'orders' && (
        <>
          <div className="app-topbar">
            <div className="topbar-info">
              <button 
                className="chip chip--clickable" 
                onClick={() => setShowPageSwitcher(true)} 
                title="Переключиться между страницами заказов" 
                aria-label="Переключиться между страницами заказов"
              >
                📅 {contextDate} · 👤 {currentUser?.name || ''}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => {
                  setOrderManagementTab('pool');
                  setShowOrderPool(true);
                }}
                title="Пул заказов" 
                aria-label="Пул заказов" 
                className="app-icon-btn"
                style={{ 
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  border: '2px solid #1976D2',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                📋
              </button>
              <button 
                onClick={() => {
                  setOrderManagementTab('page');
                  setShowUserOrderPage(true);
                }}
                title="Мои заказы" 
                aria-label="Мои заказы" 
                className="app-icon-btn"
                style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: '2px solid #45a049',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                📄
              </button>
              <button 
                onClick={() => setShowCountersPage(true)}
                title="Счётчики принтеров и кассы" 
                aria-label="Счётчики принтеров и кассы" 
                className="app-icon-btn"
                style={{ 
                  backgroundColor: '#9C27B0', 
                  color: 'white', 
                  border: '2px solid #7B1FA2',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                📊
              </button>
              {currentUser?.role === 'admin' && (
                <>
                  <button 
                    onClick={() => window.location.href = '/adminpanel/reports'}
                    title="Ежедневные отчёты" 
                    aria-label="Ежедневные отчёты" 
                    className="app-icon-btn"
                  >
                    📊
                  </button>
                  <button 
                    onClick={() => window.location.href = '/adminpanel'}
                    title="Админ панель" 
                    aria-label="Админ панель" 
                    className="app-icon-btn"
                  >
                    ⚙️
                  </button>
                </>
              )}
              <StateManagementTestPanel />
              <button onClick={handleLogout} title="Выйти" aria-label="Выйти" className="app-icon-btn">⎋</button>
            </div>
          </div>

          {showTopPicker && (
            <div className="topbar-picker" onMouseLeave={() => setShowTopPicker(false)}>
              <div className="row">
                <span style={{ width: 90 }}>Дата:</span>
                <input 
                  type="date" 
                  value={contextDate} 
                  onChange={async e => {
                    setContextDate(e.target.value);
                    setShowTopPicker(false);
                    try {
                      const uid = contextUserId ?? currentUser?.id ?? undefined;
                      await getDailyReportByDate(e.target.value).catch(() => Promise.resolve());
                    } finally { loadOrders(); }
                  }} 
                />
              </div>
              <div className="row">
                <span style={{ width: 90 }}>Пользователь:</span>
                <select 
                  value={String(contextUserId ?? currentUser?.id ?? '')} 
                  onChange={async e => {
                    const uid = e.target.value ? Number(e.target.value) : null;
                    setContextUserId(uid);
                    setShowTopPicker(false);
                    try {
                      await getDailyReportByDate(contextDate).catch(() => Promise.resolve());
                    } finally { loadOrders(); }
                  }}
                >
                  {currentUser?.role === 'admin' ? (
                    allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)
                  ) : (
                    <option value={currentUser?.id}>{currentUser?.name}</option>
                  )}
                </select>
              </div>
              <div className="note">Отчёт создаётся только в день входа. Переключение даты показывает сохранённые данные.</div>
            </div>
          )}

          <aside className="sidebar">
            <div className="sidebar-toolbar">
              <button className="icon-btn" title="Добавить заказ" aria-label="Добавить заказ" onClick={handleCreateOrder}>＋</button>
              <button
                className="icon-btn"
                title="Удалить выбранный заказ"
                aria-label="Удалить выбранный заказ"
                disabled={!selectedOrder}
                onClick={async () => {
                  if (!selectedOrder) return;
                  try {
                    await deleteOrder(selectedOrder.id);
                    setSelectedId(null);
                    loadOrders();
                  } catch (e: any) {
                    alert('Не удалось удалить заказ. Возможно нужна авторизация.');
                  }
                }}
              >🗑️</button>
            </div>
            
        <h2>Заказы</h2>
            
            <MemoizedOrderList
              orders={orders}
              selectedId={selectedId}
              statuses={statuses}
              onSelect={setSelectedId}
            />
            
            {currentUser?.role === 'admin' && (
              <>
                <button
                  className="add-order-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => setShowMaterials(true)}
                >
                  📦 Материалы
                </button>
                <button
                  className="add-order-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => setShowPrintingCalculator(true)}
                >
                  🧮 Калькулятор
                </button>
              </>
            )}
          </aside>

          <section className="detail">
            {selectedOrder ? (
              <>
                <div className="detail-header" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h2 style={{ margin: 0 }}>{selectedOrder.number}</h2>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => setShowFilesModal(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Файлы макетов"
                        >
                          📁 Файлы
                        </button>
                        <button 
                          onClick={() => setShowPrepaymentDetailsModal(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Предоплата"
                        >
                          💳 Предоплата
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: 12, color: '#666' }}>Дата</label>
                        <input 
                          type="date" 
                          value={contextDate} 
                          onChange={async e => {
                            setContextDate(e.target.value);
                            try {
                              const uid = contextUserId ?? currentUser?.id ?? undefined;
                              await getDailyReportByDate(e.target.value).catch(async () => {
                                if (uid) await createDailyReport({ report_date: e.target.value, user_id: uid });
                              });
                            } finally { loadOrders(); }
                          }} 
                          style={{ marginLeft: 8 }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#666' }}>Пользователь</label>
                        <select 
                          value={String(contextUserId ?? currentUser?.id ?? '')} 
                          onChange={async e => {
                            const uid = e.target.value ? Number(e.target.value) : null;
                            setContextUserId(uid);
                            try {
                              await getDailyReportByDate(contextDate).catch(async () => {
                                if (uid) await createDailyReport({ report_date: contextDate, user_id: uid });
                              });
                            } catch {}
                          }} 
                          style={{ marginLeft: 8 }}
                        >
                          {currentUser?.role === 'admin' ? (
                            allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)
                          ) : (
                            <option value={currentUser?.id}>{currentUser?.name}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <select
                      value={String(selectedOrder.status)}
                      onChange={async (e) => {
                        const newStatus = Number(e.target.value);
                        try {
                          await updateOrderStatus(selectedOrder.id, newStatus);
                          loadOrders();
                        } catch (err) {
                          alert('Не удалось обновить статус. Возможно нужна авторизация.');
                        }
                      }}
                      style={{ marginRight: 8 }}
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.sort_order}>{s.name}</option>
                      ))}
                    </select>
                    {typeof window !== 'undefined' && localStorage.getItem('crmRole') === 'admin' && (
                      <button onClick={() => setShowPresets(true)}>Пресеты</button>
                    )}
                    <button onClick={() => setShowPrintingCalculator(true)}>+ Калькулятор</button>
                    <button onClick={() => setShowPaperTypesManager(true)}>📄 Типы бумаги</button>
                  </div>
                </div>

                <ProgressBar
                  current={selectedOrder.status}
                  statuses={statuses}
                  onStatusChange={async (newStatus) => {
                    try {
                      await updateOrderStatus(selectedOrder.id, newStatus);
                      loadOrders();
                    } catch (e: any) {
                      alert('Не удалось изменить статус');
                    }
                  }}
                  height="12px"
                />

                <div className="detail-body">
                  {selectedOrder.items.length === 0 && (
                    <div className="item">Пока нет позиций</div>
                  )}

                  {selectedOrder.items.map((it) => (
                    <MemoizedOrderItem 
                      key={it.id} 
                      item={it} 
                      orderId={selectedOrder.id} 
                      onUpdate={loadOrders} 
                    />
                  ))}
                </div>

                <OrderTotal
                  items={selectedOrder.items.map((it) => ({
                    id: it.id,
                    type: it.type,
                    price: it.price,
                    quantity: it.quantity ?? 1,
                  }))}
                  discount={0}
                  taxRate={0}
                  prepaymentAmount={selectedOrder.prepaymentAmount}
                  prepaymentStatus={selectedOrder.prepaymentStatus}
                  paymentMethod={selectedOrder.paymentMethod === 'telegram' ? 'online' : selectedOrder.paymentMethod}
                />
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Выберите заказ слева</p>
                {selectedId && (
                  <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                    <p>Заказ с ID {selectedId} не найден в списке</p>
                    <p>Всего заказов: {orders.length}</p>
                    <button 
                      onClick={() => setSelectedId(null)}
                      style={{ 
                        marginTop: '10px', 
                        padding: '8px 16px', 
                        backgroundColor: '#f5f5f5', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Сбросить выбор
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}


      {/* Модальные окна */}
      {showAddItem && selectedOrder && (
        <AddItemModal
          order={selectedOrder}
          allowedCategories={[ 'Листовки' ]}
          initialCategory={'Листовки'}
          onSave={() => {
            setShowAddItem(false);
            loadOrders();
          }}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {currentUser?.role === 'admin' && showMaterials && (
        <ManageMaterialsModal onClose={() => setShowMaterials(false)} />
      )}

      {showPresets && (
        <ManagePresetsModal
          onClose={() => setShowPresets(false)}
          onSave={() => setShowPresets(false)}
        />
      )}

      {showPrepaymentModal && selectedOrder && (
        <PrepaymentModal
          isOpen={showPrepaymentModal}
          onClose={() => setShowPrepaymentModal(false)}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.number}
          currentAmount={selectedOrder.prepaymentAmount}
          currentPaymentMethod={selectedOrder.paymentMethod === 'telegram' ? 'online' : selectedOrder.paymentMethod}
          currentEmail={selectedOrder.customerEmail || ''}
          onPrepaymentCreated={async (amount, email, paymentMethod) => {
            try {
              const res = await createPrepaymentLink(selectedOrder.id, amount, paymentMethod);
              await loadOrders();
              setPrepayAmount(String(amount));
              const isEditing = selectedOrder.prepaymentAmount && selectedOrder.prepaymentAmount > 0;
              const actionText = isEditing ? 'изменена' : 'создана';
              
              if (amount === 0) {
                toast.info('Предоплата убрана с заказа');
              } else if (paymentMethod === 'online') {
                toast.success(
                  `Онлайн предоплата ${actionText}`,
                  `Сумма: ${amount} BYN. Ссылка отправлена на ${email}`
                );
              } else {
                toast.success(
                  `Оффлайн предоплата ${actionText}`,
                  `Сумма: ${amount} BYN. Оплата отмечена как полученная в кассе`
                );
              }
            } catch (error) {
              logger.error('Failed to create prepayment', error);
              const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
              toast.error('Ошибка создания предоплаты', errorMessage);
            }
          }}
        />
      )}

      {/* Админ-страницы теперь доступны через /adminpanel */}
      
      {/* Все админ функции теперь доступны через /adminpanel */}

      {/* Калькулятор типографии */}
      <ImprovedPrintingCalculatorModal
        isOpen={showPrintingCalculator}
        onClose={() => setShowPrintingCalculator(false)}
        onAddToOrder={handleAddToOrder}
      />

      {/* Настройки калькулятора - теперь это страница, а не модальное окно */}

      {/* Управление типами бумаги */}
      <PaperTypesManager
        isOpen={showPaperTypesManager}
        onClose={() => setShowPaperTypesManager(false)}
      />


      {/* Модальное окно файлов макетов */}
      <FilesModal
        isOpen={showFilesModal}
        onClose={() => setShowFilesModal(false)}
        orderId={selectedOrder?.id || 0}
        orderNumber={selectedOrder?.number || ''}
      />

      {/* Модальное окно предоплаты */}
      {selectedOrder && (
        <PrepaymentDetailsModal
          isOpen={showPrepaymentDetailsModal}
          onClose={() => setShowPrepaymentDetailsModal(false)}
          order={selectedOrder}
          onPrepaymentUpdate={loadOrders}
          onOpenPrepaymentModal={() => setShowPrepaymentModal(true)}
        />
      )}

      {/* Модальное окно ролей пользователей теперь доступно через /adminpanel */}

      {/* Стили для заглушек */}
      <style>{`
        .admin-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f5f5f5;
          z-index: 1000;
          overflow-y: auto;
        }
        .admin-page-header {
          background: white;
          padding: 20px;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .back-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        .back-btn:hover {
          background: #0056b3;
        }
        .admin-page-content {
          padding: 40px;
          text-align: center;
        }
        .admin-page-content p {
          font-size: 18px;
          color: #666;
        }

        /* Стили для новой системы управления заказами */
        .new-order-management-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .new-order-management-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 95vw;
          max-height: 95vh;
          width: 100%;
          height: 95vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .new-order-management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          flex-shrink: 0;
        }
        
        .new-order-management-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }
        
        .new-order-management-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .close-btn {
          background: #f44336;
          border: none;
          font-size: 20px;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .close-btn:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }
        
        /* Компактное модальное окно для выбора даты */
        .date-switcher-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>

      {/* Управление заказами */}
      {(showOrderPool || showUserOrderPage) && (
        <div className="new-order-management-overlay">
          <div className="new-order-management-container">
            <div className="new-order-management-header">
              <div className="flex items-center gap-4">
                <h2>📋 Управление заказами</h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setOrderManagementTab('pool')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      orderManagementTab === 'pool'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📋 Пул заказов
                  </button>
                  <button
                    onClick={() => setOrderManagementTab('page')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      orderManagementTab === 'page'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📄 Мои заказы
                  </button>
                </div>
              </div>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowOrderPool(false);
                  setShowUserOrderPage(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="new-order-management-content">
              {orderManagementTab === 'pool' && (
                <OrderPool 
                  currentUserId={currentUser?.id || 0}
                  currentUserName={currentUser?.name || ''}
                  onOrderAssigned={() => {
                    setOrderManagementTab('page');
                    toast.success('Заказ успешно назначен!');
                  }}
                />
              )}
              {orderManagementTab === 'page' && (
                <UserOrderPage 
                  userId={currentUser?.id || 0}
                  date={contextDate}
                  isAdmin={currentUser?.role === 'admin'}
                  onDateChange={(newDate) => setContextDate(newDate)}
                />
              )}
            </div>
          </div>
        </div>
      )}


      {/* Страница счетчиков */}
      {showCountersPage && (
        <div className="new-order-management-overlay">
          <div className="new-order-management-container">
            <div className="new-order-management-header">
              <h2>📊 Счётчики принтеров и кассы</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCountersPage(false)}
              >
                ✕
              </button>
            </div>
            <div className="new-order-management-content">
              <CountersPage />
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора даты */}
      {showPageSwitcher && (
        <div className="new-order-management-overlay">
          <div className="date-switcher-modal">
            <div className="new-order-management-header">
              <h2>📅 Выбор даты</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPageSwitcher(false)}
              >
                ×
              </button>
            </div>
            <div className="new-order-management-content">
              <DateSwitcher 
                currentDate={contextDate}
                onDateChange={handleDateChange}
                onClose={() => setShowPageSwitcher(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
