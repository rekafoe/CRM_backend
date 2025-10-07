import React, { useState, useEffect } from 'react';
import { useLogger } from '../../utils/logger';
import { useToastNotifications } from '../Toast';

interface CalculatorBackupTabProps {
  productConfigs: Record<string, any>;
  printingPrices: Record<string, any>;
  presets: any[];
  settings: any;
}

export const CalculatorBackupTab: React.FC<CalculatorBackupTabProps> = ({
  productConfigs,
  printingPrices,
  presets,
  settings
}) => {
  const logger = useLogger('CalculatorBackupTab');
  const toast = useToastNotifications();
  
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('calculator-backup-history') || '[]');
      setBackupHistory(history);
      logger.info('История резервных копий загружена', { count: history.length });
    } catch (error) {
      logger.error('Ошибка загрузки истории резервных копий', error);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupData = {
        id: Date.now().toString(),
        name: `Backup ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        data: {
          productConfigs,
          printingPrices,
          presets,
          settings
        },
        version: '1.0',
        size: JSON.stringify({ productConfigs, printingPrices, presets, settings }).length
      };

      // Сохраняем в историю
      const newHistory = [backupData, ...backupHistory.slice(0, 9)]; // Храним только последние 10
      setBackupHistory(newHistory);
      localStorage.setItem('calculator-backup-history', JSON.stringify(newHistory));

      // Создаем файл для скачивания
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `calculator-backup-${backupData.id}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      logger.info('Резервная копия создана', { id: backupData.id });
      toast.success('Резервная копия создана и скачана!');
    } catch (error) {
      logger.error('Ошибка создания резервной копии', error);
      toast.error('Ошибка создания резервной копии');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = (backup: any) => {
    if (window.confirm(`Вы уверены, что хотите восстановить резервную копию "${backup.name}"? Текущие данные будут перезаписаны.`)) {
      setIsRestoringBackup(true);
      try {
        // Восстанавливаем данные
        if (backup.data.productConfigs) {
          localStorage.setItem('calculator-product-configs', JSON.stringify(backup.data.productConfigs));
        }
        if (backup.data.printingPrices) {
          // Обновляем цены в конфигурации
          Object.keys(backup.data.printingPrices).forEach(paperType => {
            localStorage.setItem(`printing-prices-${paperType}`, JSON.stringify(backup.data.printingPrices[paperType]));
          });
        }
        if (backup.data.presets) {
          localStorage.setItem('printing-calculator-presets', JSON.stringify(backup.data.presets));
        }
        if (backup.data.settings) {
          localStorage.setItem('calculator-settings', JSON.stringify(backup.data.settings));
        }

        logger.info('Резервная копия восстановлена', { id: backup.id });
        toast.success('Резервная копия успешно восстановлена!');
        
        // Перезагружаем страницу для применения изменений
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        logger.error('Ошибка восстановления резервной копии', error);
        toast.error('Ошибка восстановления резервной копии');
      } finally {
        setIsRestoringBackup(false);
      }
    }
  };

  const deleteBackup = (backupId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту резервную копию?')) {
      const newHistory = backupHistory.filter(backup => backup.id !== backupId);
      setBackupHistory(newHistory);
      localStorage.setItem('calculator-backup-history', JSON.stringify(newHistory));
      logger.info('Резервная копия удалена', { id: backupId });
      toast.success('Резервная копия удалена');
    }
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (backupData.data) {
          restoreBackup(backupData);
        } else {
          // Старый формат - данные напрямую
          restoreBackup({ data: backupData });
        }
      } catch (error) {
        logger.error('Ошибка импорта резервной копии', error);
        toast.error('Ошибка импорта резервной копии. Проверьте формат файла.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllBackups = () => {
    if (window.confirm('Вы уверены, что хотите удалить ВСЕ резервные копии? Это действие нельзя отменить!')) {
      setBackupHistory([]);
      localStorage.removeItem('calculator-backup-history');
      logger.warn('Все резервные копии удалены');
      toast.success('Все резервные копии удалены');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="backup-tab">
      <div className="tab-header">
        <h3>💾 Резервное копирование</h3>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={createBackup}
            disabled={isCreatingBackup}
          >
            {isCreatingBackup ? '⏳ Создание...' : '💾 Создать копию'}
          </button>
          <label className="btn btn-outline">
            📥 Импорт
            <input
              type="file"
              accept=".json"
              onChange={importBackup}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="backup-sections">
        {/* Быстрые действия */}
        <div className="backup-section">
          <h4>⚡ Быстрые действия</h4>
          <div className="quick-actions">
            <button 
              className="btn btn-sm btn-primary"
              onClick={createBackup}
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? '⏳' : '💾'} Создать сейчас
            </button>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => document.getElementById('import-backup')?.click()}
            >
              📥 Импортировать
            </button>
            <button 
              className="btn btn-sm btn-danger"
              onClick={clearAllBackups}
              disabled={backupHistory.length === 0}
            >
              🗑️ Очистить все
            </button>
          </div>
          <input
            id="import-backup"
            type="file"
            accept=".json"
            onChange={importBackup}
            style={{ display: 'none' }}
          />
        </div>

        {/* История резервных копий */}
        <div className="backup-section">
          <h4>📚 История резервных копий</h4>
          {backupHistory.length === 0 ? (
            <div className="no-backups">
              <div className="no-backups-icon">📁</div>
              <h5>Резервных копий пока нет</h5>
              <p>Создайте первую резервную копию, чтобы защитить ваши настройки</p>
            </div>
          ) : (
            <div className="backup-list">
              {backupHistory.map((backup) => (
                <div key={backup.id} className="backup-item">
                  <div className="backup-info">
                    <div className="backup-header">
                      <h5>{backup.name}</h5>
                      <span className="backup-date">
                        {new Date(backup.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="backup-details">
                      <span className="backup-size">
                        📦 {formatFileSize(backup.size)}
                      </span>
                      <span className="backup-version">
                        🏷️ v{backup.version}
                      </span>
                      <span className="backup-products">
                        📦 {Object.keys(backup.data.productConfigs || {}).length} продуктов
                      </span>
                      <span className="backup-presets">
                        ⭐ {backup.data.presets?.length || 0} пресетов
                      </span>
                    </div>
                  </div>
                  <div className="backup-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => restoreBackup(backup)}
                      disabled={isRestoringBackup}
                      title="Восстановить"
                    >
                      {isRestoringBackup ? '⏳' : '🔄'}
                    </button>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        const dataStr = JSON.stringify(backup, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `calculator-backup-${backup.id}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      title="Скачать"
                    >
                      📥
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteBackup(backup.id)}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="backup-section">
          <h4>📊 Статистика</h4>
          <div className="backup-stats">
            <div className="stat-item">
              <strong>Всего копий:</strong>
              <span>{backupHistory.length}</span>
            </div>
            <div className="stat-item">
              <strong>Последняя копия:</strong>
              <span>
                {backupHistory.length > 0 
                  ? new Date(backupHistory[0].timestamp).toLocaleString()
                  : 'Никогда'
                }
              </span>
            </div>
            <div className="stat-item">
              <strong>Общий размер:</strong>
              <span>
                {formatFileSize(backupHistory.reduce((total, backup) => total + backup.size, 0))}
              </span>
            </div>
            <div className="stat-item">
              <strong>Средний размер:</strong>
              <span>
                {backupHistory.length > 0 
                  ? formatFileSize(backupHistory.reduce((total, backup) => total + backup.size, 0) / backupHistory.length)
                  : '0 Bytes'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
