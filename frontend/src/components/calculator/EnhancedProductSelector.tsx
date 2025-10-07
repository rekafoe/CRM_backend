import React, { useState, useMemo, useCallback } from 'react';
import { ProductConfig } from '../../types/shared';
import { useLogger } from '../../utils/logger';
import './EnhancedProductSelector.css';

interface EnhancedProductSelectorProps {
  productConfigs: Record<string, ProductConfig>;
  onSelectProduct: (productType: string) => void;
  onClose: () => void;
  initialSearch?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  products: string[];
}

export const EnhancedProductSelector: React.FC<EnhancedProductSelectorProps> = ({
  productConfigs,
  onSelectProduct,
  onClose,
  initialSearch = ''
}) => {
  const logger = useLogger('EnhancedProductSelector');
  
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'price'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Категории продуктов
  const categories: ProductCategory[] = useMemo(() => [
    {
      id: 'all',
      name: 'Все продукты',
      icon: '📦',
      description: 'Показать все доступные продукты',
      products: Object.keys(productConfigs)
    },
    {
      id: 'printing',
      name: 'Печатная продукция',
      icon: '🖨️',
      description: 'Листовки, визитки, буклеты, постеры',
      products: ['flyers', 'business_cards', 'booklets', 'posters', 'brochures', 'stickers', 'labels']
    },
    {
      id: 'office',
      name: 'Офисная продукция',
      icon: '📋',
      description: 'Бланки, формы, конверты, папки',
      products: ['forms', 'business_forms', 'envelopes', 'folders', 'notebooks', 'badges']
    },
    {
      id: 'promotional',
      name: 'Рекламная продукция',
      icon: '📢',
      description: 'Баннеры, стенды, флажки, тейбл-тенты',
      products: ['banners', 'stands', 'flags', 'table_tents', 'placemats', 'table_numbers', 'seating_cards']
    },
    {
      id: 'specialty',
      name: 'Специализированная',
      icon: '⭐',
      description: 'Магнитные, календари, приглашения',
      products: ['magnetic_cards', 'calendars', 'wall_calendars', 'table_calendars', 'invitations', 'certificates']
    },
    {
      id: 'souvenirs',
      name: 'Сувенирная продукция',
      icon: '🎁',
      description: 'Майки, сумки, кружки, брелоки',
      products: ['t_shirts', 'bags', 'pens', 'mugs', 'keychains', 'coasters', 'mouse_pads', 'puzzles']
    },
    {
      id: 'photo',
      name: 'Фотопродукция',
      icon: '📸',
      description: 'Фотоальбомы, фотокарточки, фотообои',
      products: ['photo_albums', 'photo_cards', 'photo_wallpaper']
    },
    {
      id: 'wedding',
      name: 'Свадебная продукция',
      icon: '💒',
      description: 'Свадебные приглашения и аксессуары',
      products: ['wedding_invitations', 'wedding_place_cards', 'wedding_labels', 'wedding_scrolls', 'wedding_boxes', 'wedding_disc_labels', 'wedding_disc_boxes']
    }
  ], [productConfigs]);

  // Фильтрация и сортировка продуктов
  const filteredProducts = useMemo(() => {
    let products = Object.entries(productConfigs);
    
    // Фильтр по категории
    if (selectedCategory !== 'all') {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category) {
        products = products.filter(([key]) => category.products.includes(key));
      }
    }
    
    // Фильтр по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(([key, config]) => 
        key.toLowerCase().includes(query) ||
        config.name.toLowerCase().includes(query) ||
        (config.description && config.description.toLowerCase().includes(query))
      );
    }
    
    // Сортировка
    products.sort(([, a], [, b]) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          // Простая логика популярности на основе количества форматов
          return b.formats.length - a.formats.length;
        case 'price':
          // Сортировка по минимальной цене (если есть)
          return 0; // Пока не реализовано
        default:
          return 0;
      }
    });
    
    return products;
  }, [productConfigs, selectedCategory, searchQuery, sortBy, categories]);

  // Обработка выбора продукта
  const handleProductSelect = useCallback((productType: string) => {
    logger.info('Выбран продукт', { productType });
    onSelectProduct(productType);
  }, [onSelectProduct, logger]);

  // Обработка поиска
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Обработка смены категории
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  // Обработка смены сортировки
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'name' | 'popularity' | 'price');
  }, []);

  // Обработка смены режима просмотра
  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  return (
    <div className="enhanced-product-selector">
      {/* Заголовок */}
      <div className="selector-header">
        <div className="header-content">
          <h2>📦 Выберите тип продукта</h2>
          <p>Выберите тип печатной продукции для расчета стоимости</p>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* Панель управления */}
      <div className="selector-controls">
        {/* Поиск */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Поиск продуктов..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>
        </div>

        {/* Фильтры и сортировка */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Категория:</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Сортировка:</label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="filter-select"
            >
              <option value="name">По названию</option>
              <option value="popularity">По популярности</option>
              <option value="price">По цене</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('grid')}
              title="Сетка"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('list')}
              title="Список"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Таблица продуктов по категориям */}
      <div className="products-container">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">🔍</div>
            <h3>Продукты не найдены</h3>
            <p>Попробуйте изменить поисковый запрос или категорию</p>
          </div>
        ) : (
          <div className="products-table-container">
            {categories.map(category => {
              const categoryProducts = filteredProducts.filter(([key]) => 
                category.products.includes(key)
              );
              
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category.id} className="category-section">
                  <div className="category-header">
                    <div className="category-icon">{category.icon}</div>
                    <div className="category-info">
                      <h3 className="category-name">{category.name}</h3>
                      <p className="category-description">{category.description}</p>
                    </div>
                    <div className="category-count">{categoryProducts.length} продуктов</div>
                  </div>
                  
                  <div className="products-table">
                    <div className="table-header">
                      <div className="header-cell icon">Иконка</div>
                      <div className="header-cell name">Название</div>
                      <div className="header-cell description">Описание</div>
                      <div className="header-cell formats">Форматы</div>
                      <div className="header-cell materials">Материалы</div>
                      <div className="header-cell sides">Стороны</div>
                      <div className="header-cell features">Особенности</div>
                      <div className="header-cell action">Действие</div>
                    </div>
                    
                    {categoryProducts.map(([key, config]) => (
                      <div
                        key={key}
                        className="table-row"
                        onClick={() => handleProductSelect(key)}
                      >
                        <div className="table-cell icon">
                          <div className="product-icon">
                            {getProductIcon(key)}
                          </div>
                        </div>
                        <div className="table-cell name">
                          <div className="product-name">{config.name}</div>
                          <div className="product-type">{key}</div>
                        </div>
                        <div className="table-cell description">
                          <div className="product-description">
                            {config.description || 'Описание продукта'}
                          </div>
                        </div>
                        <div className="table-cell formats">
                          <div className="formats-list">
                            {config.formats.slice(0, 3).map(format => (
                              <span key={format} className="format-tag">{format}</span>
                            ))}
                            {config.formats.length > 3 && (
                              <span className="format-more">+{config.formats.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <div className="table-cell materials">
                          <div className="materials-count">
                            {config.paperDensities.length} типов
                          </div>
                        </div>
                        <div className="table-cell sides">
                          <div className="sides-info">
                            {config.sides?.includes(1) && config.sides?.includes(2) ? '1-2' : config.sides?.join(', ') || '-'}
                          </div>
                        </div>
                        <div className="table-cell features">
                          <div className="features-list">
                            {config.magnetic && <span className="feature-tag">🧲</span>}
                            {config.cutting && <span className="feature-tag">✂️</span>}
                            {config.folding && <span className="feature-tag">📄</span>}
                            {config.roundCorners && <span className="feature-tag">⭕</span>}
                          </div>
                        </div>
                        <div className="table-cell action">
                          <button className="select-btn">
                            Выбрать →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="selector-footer">
        <div className="products-count">
          Показано: {filteredProducts.length} из {Object.keys(productConfigs).length} продуктов
        </div>
        <div className="category-info">
          {selectedCategory !== 'all' && (
            <span>
              Категория: {categories.find(cat => cat.id === selectedCategory)?.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция для иконок продуктов
const getProductIcon = (productType: string): string => {
  const icons: Record<string, string> = {
    // Основные полиграфические продукты
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
    
    // Новые продукты из Karandash
    'forms': '📋',
    'magnetic_cards': '🧲',
    'posters_large': '🖼️',
    'perforated_cards': '✂️',
    'wall_calendars': '📅',
    'table_calendars': '📅',
    
    // Специализированные продукты
    'notebooks': '📓',
    'folders': '📁',
    'menus': '🍽️',
    'invitations': '💌',
    'certificates': '🏆',
    'banners': '🚩',
    'stands': '🖼️',
    
    // Сувенирная продукция
    't_shirts': '👕',
    'bags': '👜',
    'pens': '✏️',
    'mugs': '☕',
    'keychains': '🔑',
    'coasters': '🍽️',
    'mouse_pads': '🖱️',
    'puzzles': '🧩',
    'photo_albums': '📸',
    'photo_cards': '🖼️',
    'photo_wallpaper': '🖼️',
    'flags': '🏳️',
    
    // Продукты для мероприятий
    'table_tents': '🏷️',
    'placemats': '🍽️',
    'table_numbers': '🔢',
    'seating_cards': '💺',
    
    // Свадебная продукция
    'wedding_invitations': '💒',
    'wedding_place_cards': '💒',
    'wedding_labels': '💒',
    'wedding_scrolls': '📜',
    'wedding_boxes': '📦',
    'wedding_disc_labels': '💿',
    'wedding_disc_boxes': '💿'
  };
  return icons[productType] || '📄';
};
