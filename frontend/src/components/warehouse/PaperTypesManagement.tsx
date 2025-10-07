import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { 
  getPaperTypes, 
  createPaperType, 
  updatePaperType, 
  deletePaperType
} from '../../api';

interface Material {
  id: number;
  name: string;
  category_id: number;
  paper_type_id?: number;
  density?: number;
  sheet_price_single?: number;
  price?: number;
  quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  unit: string;
  supplier: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

interface PaperType {
  id: number;
  name: string;
  display_name: string;
  search_keywords: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  materials?: Material[];
  prices?: { [density: number]: number }; // Для обратной совместимости
}

interface PaperTypesManagementProps {
  onRefresh?: () => void;
}

export const PaperTypesManagement: React.FC<PaperTypesManagementProps> = ({ onRefresh }) => {
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPaperType, setEditingPaperType] = useState<PaperType | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'materials'>('types');

  const { showToast } = useUIStore();

  // Формы
  const [newPaperType, setNewPaperType] = useState({
    name: '',
    display_name: '',
    search_keywords: ''
  });

  const [newPrice, setNewPrice] = useState({
    paper_type_id: 0,
    density: 0,
    price: 0
  });

  // Загрузка типов бумаги
  const loadPaperTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPaperTypes();
      setPaperTypes(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки типов бумаги:', error);
      showToast('Ошибка загрузки типов бумаги', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPaperTypes();
  }, [loadPaperTypes]);

  // Создание типа бумаги
  const handleCreatePaperType = async () => {
    if (!newPaperType.name || !newPaperType.display_name) {
      showToast('Заполните обязательные поля', 'error');
      return;
    }

    try {
      await createPaperType(newPaperType);
      showToast('Тип бумаги создан', 'success');
      setNewPaperType({ name: '', display_name: '', search_keywords: '' });
      setShowAddModal(false);
      loadPaperTypes();
      onRefresh?.();
    } catch (error) {
      console.error('Ошибка создания типа бумаги:', error);
      showToast('Ошибка создания типа бумаги', 'error');
    }
  };

  // Обновление типа бумаги
  const handleUpdatePaperType = async () => {
    if (!editingPaperType) return;

    try {
      await updatePaperType(editingPaperType.id, {
        name: editingPaperType.name,
        display_name: editingPaperType.display_name,
        search_keywords: editingPaperType.search_keywords,
        is_active: editingPaperType.is_active
      });
      showToast('Тип бумаги обновлен', 'success');
      setEditingPaperType(null);
      loadPaperTypes();
      onRefresh?.();
    } catch (error) {
      console.error('Ошибка обновления типа бумаги:', error);
      showToast('Ошибка обновления типа бумаги', 'error');
    }
  };

  // Удаление типа бумаги
  const handleDeletePaperType = async (id: number) => {
    if (!confirm('Удалить тип бумаги?')) return;

    try {
      await deletePaperType(id);
      showToast('Тип бумаги удален', 'success');
      loadPaperTypes();
      onRefresh?.();
    } catch (error) {
      console.error('Ошибка удаления типа бумаги:', error);
      showToast('Ошибка удаления типа бумаги', 'error');
    }
  };

  // Добавление цены
  const handleAddPrice = async () => {
    if (!newPrice.paper_type_id || !newPrice.density || !newPrice.price) {
      showToast('Заполните все поля', 'error');
      return;
    }

    try {
      await addPrintingPrice(newPrice.paper_type_id, newPrice.density, newPrice.price);
      showToast('Цена добавлена', 'success');
      setNewPrice({ paper_type_id: 0, density: 0, price: 0 });
      setShowPriceModal(false);
      loadPaperTypes();
    } catch (error) {
      console.error('Ошибка добавления цены:', error);
      showToast('Ошибка добавления цены', 'error');
    }
  };

  return (
    <div className="paper-types-management">
      {/* Заголовок и кнопки */}
      <div className="paper-header">
        <div className="paper-tabs">
          <button 
            className={`tab-button ${activeTab === 'types' ? 'active' : ''}`}
            onClick={() => setActiveTab('types')}
          >
            📄 Типы бумаги ({paperTypes.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            📦 Материалы
          </button>
        </div>
        
        <div className="paper-actions">
          {activeTab === 'types' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Добавить тип
            </button>
          )}
          {activeTab === 'materials' && (
            <div className="info-text">
              💡 Материалы связываются с типами бумаги через форму добавления материалов
            </div>
          )}
        </div>
      </div>

      {loading && <div className="loading">Загрузка...</div>}

      {/* Содержимое вкладок */}
      {activeTab === 'types' && (
        <div className="paper-types-grid">
          {paperTypes.map(paperType => (
            <div key={paperType.id} className="paper-type-card">
              <div className="paper-type-header">
                <h3>{paperType.display_name}</h3>
                <div className="paper-type-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setEditingPaperType(paperType)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeletePaperType(paperType.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="paper-type-details">
                <p><strong>Системное имя:</strong> {paperType.name}</p>
                <p><strong>Ключевые слова:</strong> {paperType.search_keywords || 'Не указаны'}</p>
                <p><strong>Статус:</strong> 
                  <span className={`status ${paperType.is_active ? 'active' : 'inactive'}`}>
                    {paperType.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </p>
                
                {paperType.materials && paperType.materials.length > 0 && (
                  <div className="paper-materials">
                    <strong>Связанные материалы:</strong>
                    <div className="materials-grid">
                      {paperType.materials.map((material) => (
                        <div key={material.id} className="material-item">
                          <span className="material-name">{material.name}</span>
                          {material.density && (
                            <span className="material-density">{material.density}г/м²</span>
                          )}
                          <span className="material-price">
                            {(material.sheet_price_single || material.price || 0).toFixed(2)} BYN
                          </span>
                          <span className="material-stock">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="materials-management">
          <div className="materials-grid">
            {paperTypes.map(paperType => (
              <div key={paperType.id} className="material-section">
                <h3>{paperType.display_name}</h3>
                {paperType.materials && paperType.materials.length > 0 ? (
                  <div className="material-list">
                    {paperType.materials.map((material) => (
                      <div key={material.id} className="material-item">
                        <div className="material-info">
                          <span className="material-name">{material.name}</span>
                          {material.density && (
                            <span className="material-density">{material.density} г/м²</span>
                          )}
                          <span className="material-category">{material.category_name || 'Без категории'}</span>
                        </div>
                        <div className="material-details">
                          <span className="material-price">
                            {(material.sheet_price_single || material.price || 0).toFixed(2)} BYN
                          </span>
                          <span className="material-stock">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-materials">Материалы не связаны</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно добавления типа бумаги */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добавить тип бумаги</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Системное имя *</label>
                <input
                  type="text"
                  value={newPaperType.name}
                  onChange={e => setNewPaperType({...newPaperType, name: e.target.value})}
                  placeholder="semi-matte"
                />
              </div>
              
              <div className="form-group">
                <label>Отображаемое имя *</label>
                <input
                  type="text"
                  value={newPaperType.display_name}
                  onChange={e => setNewPaperType({...newPaperType, display_name: e.target.value})}
                  placeholder="Полуматовая"
                />
              </div>
              
              <div className="form-group">
                <label>Ключевые слова</label>
                <input
                  type="text"
                  value={newPaperType.search_keywords}
                  onChange={e => setNewPaperType({...newPaperType, search_keywords: e.target.value})}
                  placeholder="полуматовая,мелованная,130г"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleCreatePaperType}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования типа бумаги */}
      {editingPaperType && (
        <div className="modal-overlay" onClick={() => setEditingPaperType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Редактировать тип бумаги</h2>
              <button className="close-btn" onClick={() => setEditingPaperType(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Системное имя *</label>
                <input
                  type="text"
                  value={editingPaperType.name}
                  onChange={e => setEditingPaperType({...editingPaperType, name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Отображаемое имя *</label>
                <input
                  type="text"
                  value={editingPaperType.display_name}
                  onChange={e => setEditingPaperType({...editingPaperType, display_name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Ключевые слова</label>
                <input
                  type="text"
                  value={editingPaperType.search_keywords}
                  onChange={e => setEditingPaperType({...editingPaperType, search_keywords: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingPaperType.is_active}
                    onChange={e => setEditingPaperType({...editingPaperType, is_active: e.target.checked})}
                  />
                  Активен
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingPaperType(null)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleUpdatePaperType}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления цены */}
      {showPriceModal && (
        <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добавить цену</h2>
              <button className="close-btn" onClick={() => setShowPriceModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Тип бумаги *</label>
                <select
                  value={newPrice.paper_type_id}
                  onChange={e => setNewPrice({...newPrice, paper_type_id: parseInt(e.target.value)})}
                >
                  <option value={0}>Выберите тип бумаги</option>
                  {paperTypes.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.display_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Плотность (г/м²) *</label>
                <input
                  type="number"
                  value={newPrice.density}
                  onChange={e => setNewPrice({...newPrice, density: parseInt(e.target.value)})}
                  placeholder="130"
                />
              </div>
              
              <div className="form-group">
                <label>Цена (BYN) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.price}
                  onChange={e => setNewPrice({...newPrice, price: parseFloat(e.target.value)})}
                  placeholder="0.20"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPriceModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleAddPrice}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .paper-types-management {
          padding: 24px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .paper-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .paper-tabs {
          display: flex;
          gap: 8px;
          background: #f1f3f4;
          padding: 4px;
          border-radius: 8px;
        }

        .tab-button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          color: #666;
        }

        .tab-button.active {
          background: #007bff;
          color: white;
          box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }

        .tab-button:hover:not(.active) {
          background: rgba(0,123,255,0.1);
          color: #007bff;
        }

        .paper-actions {
          display: flex;
          gap: 12px;
        }

        .paper-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .paper-type-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .paper-type-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }

        .paper-type-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .paper-type-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
        }

        .paper-type-actions {
          display: flex;
          gap: 8px;
        }

        .paper-type-details p {
          margin: 10px 0;
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }

        .paper-type-details strong {
          color: #2c3e50;
          font-weight: 600;
        }

        .status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status.active {
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          color: #155724;
          border: 1px solid #b8dabd;
        }

        .status.inactive {
          background: linear-gradient(135deg, #f8d7da, #f5c6cb);
          color: #721c24;
          border: 1px solid #f1b0b7;
        }

        .paper-prices {
          margin-top: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .paper-prices strong {
          color: #007bff;
          font-size: 14px;
        }

        .prices-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .price-tag {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,123,255,0.3);
          transition: all 0.2s ease;
        }

        .price-tag:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,123,255,0.4);
        }

        .prices-management {
          padding: 24px 0;
        }

        .price-section {
          margin-bottom: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .price-section h3 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 2px solid #007bff;
        }

        .price-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 8px;
          border: 1px solid #dee2e6;
          transition: all 0.2s ease;
        }

        .price-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .no-prices {
          color: #6c757d;
          font-style: italic;
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: #6c757d;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,123,255,0.4);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #6c757d, #545b62);
          color: white;
          box-shadow: 0 2px 4px rgba(108,117,125,0.3);
        }

        .btn-secondary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(108,117,125,0.4);
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          box-shadow: 0 2px 4px rgba(220,53,69,0.3);
        }

        .btn-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220,53,69,0.4);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .modal-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 20px;
          font-weight: 600;
        }

        .close-btn {
          background: #f8f9fa;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          color: #6c757d;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #e9ecef;
          color: #495057;
          transform: scale(1.1);
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: #f8f9fa;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
          background: white;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
          transform: scale(1.2);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px 24px 24px;
          border-top: 1px solid #f0f0f0;
        }

        /* Стили для материалов */
        .paper-materials {
          margin-top: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .materials-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .material-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e9ecef;
          font-size: 14px;
        }

        .material-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .material-density {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-left: 8px;
        }

        .material-price {
          color: #28a745;
          font-weight: 600;
        }

        .material-stock {
          color: #6c757d;
          font-size: 12px;
        }

        .materials-management {
          padding: 20px 0;
        }

        .material-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .material-section h3 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
        }

        .material-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .material-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .material-category {
          background: #6c757d;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .material-details {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .no-materials {
          color: #6c757d;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }

        .info-text {
          background: #e3f2fd;
          color: #1976d2;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid #bbdefb;
        }
      `}</style>
    </div>
  );
};
