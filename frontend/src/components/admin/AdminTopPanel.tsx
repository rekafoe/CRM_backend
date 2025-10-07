import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useMaterialStore } from '../../stores/materialStore';
import { useOrderStore } from '../../stores/orderStore';

interface AdminTopPanelProps {
  currentUser: { id: number; name: string; role: string } | null;
  onNavigate?: (page: string) => void;
  onOpenModal?: (modal: string) => void;
  onOpenNewOrderManagement?: () => void;
  lowStockCount?: number;
  totalOrders?: number;
  totalRevenue?: number;
}

interface AdminMenuItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  isModal?: boolean;
  badge?: number;
  color?: string;
  category: 'reports' | 'materials' | 'warehouse' | 'users' | 'orders' | 'pricing' | 'settings' | 'notifications';
}

export const AdminTopPanel: React.FC<AdminTopPanelProps> = ({
  currentUser,
  onNavigate,
  onOpenModal,
  lowStockCount = 0,
  totalOrders = 0,
  totalRevenue = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { addNotification } = useUIStore();
  const { materials } = useMaterialStore();
  const { orders } = useOrderStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Админ функции по категориям
  const adminMenuItems: AdminMenuItem[] = useMemo(() => [
    // Отчеты
    {
      id: 'reports',
      title: 'Отчеты',
      icon: '📊',
      description: 'Архив и аналитика',
      category: 'reports'
    },
    {
      id: 'daily-reports',
      title: 'Ежедневные',
      icon: '📅',
      description: 'Дневные отчеты',
      category: 'reports'
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      icon: '📈',
      description: 'Графики и метрики',
      category: 'reports'
    },

    // Материалы (полный складской сервис)
    {
      id: 'materials',
      title: 'Материалы',
      icon: '📦',
      description: 'Полное управление материалами и складом',
      category: 'materials',
      badge: lowStockCount,
      color: lowStockCount > 0 ? '#ff9800' : undefined
    },
    {
      id: 'inventory',
      title: 'Инвентарь',
      icon: '📋',
      description: 'Учет и контроль',
      category: 'warehouse'
    },
    {
      id: 'suppliers',
      title: 'Поставщики',
      icon: '🚚',
      description: 'Управление поставщиками',
      category: 'warehouse'
    },
    {
      id: 'categories',
      title: 'Категории',
      icon: '🏷️',
      description: 'Категории материалов',
      category: 'warehouse'
    },
    {
      id: 'warehouse-reports',
      title: 'Отчеты склада',
      icon: '📊',
      description: 'Аналитика склада',
      category: 'warehouse'
    },
    {
      id: 'low-stock-alerts',
      title: 'Низкие остатки',
      icon: '⚠️',
      description: 'Уведомления о низких остатках',
      category: 'warehouse',
      badge: lowStockCount,
      color: lowStockCount > 0 ? '#f44336' : undefined
    },
    {
      id: 'cost-calculation',
      title: 'Себестоимость',
      icon: '💰',
      description: 'Расчет себестоимости товаров',
      category: 'warehouse'
    },

    // Пользователи
    {
      id: 'users',
      title: 'Пользователи',
      icon: '👥',
      description: 'Управление пользователями',
      category: 'users'
    },
    {
      id: 'roles',
      title: 'Роли',
      icon: '🔐',
      description: 'Права доступа',
      category: 'users'
    },

    // Заказы
    {
      id: 'all-orders',
      title: 'Все заказы',
      icon: '📋',
      description: 'Управление заказами',
      category: 'orders',
      badge: totalOrders
    },
    {
      id: 'order-templates',
      title: 'Шаблоны',
      icon: '📄',
      description: 'Шаблоны заказов',
      category: 'orders'
    },

    // Ценообразование
    {
      id: 'pricing',
      title: 'Цены',
      icon: '💰',
      description: 'Управление ценами',
      category: 'pricing',
      isModal: true
    },
    {
      id: 'discounts',
      title: 'Скидки',
      icon: '🎯',
      description: 'Система скидок',
      category: 'pricing',
      isModal: true
    },

    // Настройки
    {
      id: 'calculator-settings',
      title: 'Настройки калькулятора',
      icon: '🧮',
      description: 'Конфигурация калькулятора',
      category: 'settings'
    },
    {
      id: 'settings',
      title: 'Общие настройки',
      icon: '⚙️',
      description: 'Системные настройки',
      category: 'settings'
    },
    {
      id: 'backup',
      title: 'Резервные копии',
      icon: '💾',
      description: 'Бэкап данных',
      category: 'settings'
    },

    // Уведомления
    {
      id: 'notifications',
      title: 'Уведомления',
      icon: '🔔',
      description: 'Управление всеми уведомлениями системы',
      category: 'notifications',
      isModal: true
    }
  ], [lowStockCount, totalOrders]);

  // Группировка по категориям
  const menuByCategory = useMemo(() => {
    return adminMenuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, AdminMenuItem[]>);
  }, [adminMenuItems]);

  // Обработчики
  const handleItemClick = useCallback((item: AdminMenuItem) => {
    if (item.isModal) {
      if (onOpenModal) {
        onOpenModal(item.id);
      }
    } else {
      // Используем React Router для навигации
      navigate(`/adminpanel/${item.id}`);
      if (onNavigate) {
        onNavigate(item.id);
      }
    }
    setIsExpanded(false);
    addNotification({
      type: 'info',
      message: `Открыт раздел: ${item.title}`
    });
  }, [navigate, onNavigate, onOpenModal, addNotification]);

  const handleCategoryHover = useCallback((category: string | null) => {
    setActiveCategory(category);
  }, []);

  // Статистика
  const stats = useMemo(() => ({
    materials: materials.length,
    lowStock: lowStockCount,
    orders: totalOrders,
    revenue: totalRevenue
  }), [materials.length, lowStockCount, totalOrders, totalRevenue]);

  if (currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-top-panel">
      {/* Кнопка открытия админ панели */}
      <button
        className={`admin-toggle-btn ${isExpanded ? 'active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Админ панель"
      >
        <span className="admin-icon">🛡️</span>
        <span className="admin-text">Админ</span>
        {lowStockCount > 0 && (
          <span className="admin-badge">{lowStockCount}</span>
        )}
      </button>

      {/* Развернутая панель */}
      {isExpanded && (
        <div className="admin-panel-content">
          {/* Статистика */}
          <div className="admin-stats">
            <div className="stat-item">
              <span className="stat-icon">📦</span>
              <span className="stat-value">{stats.materials}</span>
              <span className="stat-label">Материалы</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚠️</span>
              <span className="stat-value">{stats.lowStock}</span>
              <span className="stat-label">Низкий остаток</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📋</span>
              <span className="stat-value">{stats.orders}</span>
              <span className="stat-label">Заказы</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-value">{stats.revenue.toFixed(0)}</span>
              <span className="stat-label">BYN</span>
            </div>
          </div>

          {/* Меню по категориям */}
          <div className="admin-menu-categories">
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div
                key={category}
                className={`admin-category ${activeCategory === category ? 'active' : ''}`}
                onMouseEnter={() => handleCategoryHover(category)}
                onMouseLeave={() => handleCategoryHover(null)}
              >
                <div className="category-header">
                  <span className="category-icon">
                    {category === 'reports' && '📊'}
                    {category === 'materials' && '📦'}
                    {category === 'warehouse' && '🏪'}
                    {category === 'users' && '👥'}
                    {category === 'orders' && '📋'}
                    {category === 'pricing' && '💰'}
                    {category === 'settings' && '⚙️'}
                    {category === 'notifications' && '🔔'}
                  </span>
                  <span className="category-title">
                    {category === 'reports' && 'Отчеты'}
                    {category === 'materials' && 'Материалы'}
                    {category === 'warehouse' && 'Складской сервис'}
                    {category === 'users' && 'Пользователи'}
                    {category === 'orders' && 'Заказы'}
                    {category === 'pricing' && 'Ценообразование'}
                    {category === 'settings' && 'Настройки'}
                    {category === 'notifications' && 'Уведомления'}
                  </span>
                </div>
                
                <div className="category-items">
                  {items.map(item => (
                    <button
                      key={item.id}
                      className={`admin-menu-item ${item.color ? 'has-badge' : ''}`}
                      onClick={() => handleItemClick(item)}
                      style={item.color ? { borderLeftColor: item.color } : {}}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <div className="item-content">
                        <span className="item-title">{item.title}</span>
                        <span className="item-description">{item.description}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="item-badge">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Быстрые действия */}
          <div className="admin-quick-actions">
            <button
              className="quick-action-btn"
              onClick={() => onOpenModal?.('pricing')}
            >
              💰 Цены
            </button>
            <button
              className="quick-action-btn"
              onClick={() => onNavigate?.('materials')}
            >
              📦 Материалы
            </button>
            <button
              className="quick-action-btn"
              onClick={() => onNavigate?.('reports')}
            >
              📊 Отчеты
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
