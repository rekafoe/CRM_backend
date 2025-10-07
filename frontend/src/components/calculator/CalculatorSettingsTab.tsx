import React, { useState } from 'react';
import { useLogger } from '../../utils/logger';
import { useToastNotifications } from '../Toast';

interface CalculatorSettingsTabProps {
  settings: {
    autoSave: boolean;
    showAdvancedOptions: boolean;
    defaultCurrency: string;
    roundingPrecision: number;
    enableNotifications: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export const CalculatorSettingsTab: React.FC<CalculatorSettingsTabProps> = ({
  settings,
  onSettingsChange
}) => {
  const logger = useLogger('CalculatorSettingsTab');
  const toast = useToastNotifications();

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
    logger.debug('Настройка изменена', { key, value });
  };

  const resetToDefaults = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      const defaultSettings = {
        autoSave: true,
        showAdvancedOptions: false,
        defaultCurrency: 'BYN',
        roundingPrecision: 2,
        enableNotifications: true
      };
      onSettingsChange(defaultSettings);
      logger.info('Настройки сброшены к значениям по умолчанию');
      toast.success('Настройки сброшены к значениям по умолчанию');
    }
  };

  const clearAllData = () => {
    if (window.confirm('ВНИМАНИЕ! Это действие удалит ВСЕ данные калькулятора (продукты, цены, пресеты). Продолжить?')) {
      if (window.confirm('Вы действительно уверены? Это действие нельзя отменить!')) {
        localStorage.removeItem('calculator-product-configs');
        localStorage.removeItem('printing-calculator-presets');
        localStorage.removeItem('calculator-settings');
        logger.warn('Все данные калькулятора очищены');
        toast.success('Все данные калькулятора очищены');
        window.location.reload();
      }
    }
  };

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h3>⚙️ Настройки калькулятора</h3>
        <div className="header-actions">
          <button className="btn btn-sm btn-outline" onClick={resetToDefaults}>
            🔄 Сбросить
          </button>
          <button className="btn btn-sm btn-danger" onClick={clearAllData}>
            🗑️ Очистить все
          </button>
        </div>
      </div>

      <div className="settings-sections">
        {/* Общие настройки */}
        <div className="settings-section">
          <h4>🔧 Общие настройки</h4>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
                <span className="setting-text">
                  <strong>Автосохранение</strong>
                  <small>Автоматически сохранять изменения в настройках</small>
                </span>
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.showAdvancedOptions}
                  onChange={(e) => handleSettingChange('showAdvancedOptions', e.target.checked)}
                />
                <span className="setting-text">
                  <strong>Расширенные опции</strong>
                  <small>Показывать дополнительные параметры в интерфейсе</small>
                </span>
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                />
                <span className="setting-text">
                  <strong>Уведомления</strong>
                  <small>Показывать уведомления о действиях</small>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Настройки расчетов */}
        <div className="settings-section">
          <h4>🧮 Настройки расчетов</h4>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <span className="setting-text">
                  <strong>Валюта по умолчанию</strong>
                  <small>Основная валюта для отображения цен</small>
                </span>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                  className="setting-input"
                >
                  <option value="BYN">BYN Белорусский рубль</option>
                  <option value="USD">$ Доллар (USD)</option>
                  <option value="EUR">€ Евро (EUR)</option>
                </select>
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="setting-text">
                  <strong>Точность округления</strong>
                  <small>Количество знаков после запятой в ценах</small>
                </span>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={settings.roundingPrecision}
                  onChange={(e) => handleSettingChange('roundingPrecision', parseInt(e.target.value))}
                  className="setting-input"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Настройки интерфейса */}
        <div className="settings-section">
          <h4>🎨 Настройки интерфейса</h4>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <span className="setting-text">
                  <strong>Тема оформления</strong>
                  <small>Цветовая схема интерфейса</small>
                </span>
                <select
                  value="default"
                  onChange={() => {}}
                  className="setting-input"
                  disabled
                >
                  <option value="default">По умолчанию</option>
                  <option value="dark" disabled>Темная (скоро)</option>
                  <option value="light" disabled>Светлая (скоро)</option>
                </select>
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="setting-text">
                  <strong>Размер шрифта</strong>
                  <small>Размер текста в интерфейсе</small>
                </span>
                <select
                  value="medium"
                  onChange={() => {}}
                  className="setting-input"
                  disabled
                >
                  <option value="small">Мелкий</option>
                  <option value="medium">Средний</option>
                  <option value="large">Крупный</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Информация о системе */}
        <div className="settings-section">
          <h4>ℹ️ Информация о системе</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Версия калькулятора:</strong>
              <span>1.0.0</span>
            </div>
            <div className="info-item">
              <strong>Последнее обновление:</strong>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <strong>Количество продуктов:</strong>
              <span>{Object.keys(JSON.parse(localStorage.getItem('calculator-product-configs') || '{}')).length}</span>
            </div>
            <div className="info-item">
              <strong>Количество пресетов:</strong>
              <span>{JSON.parse(localStorage.getItem('printing-calculator-presets') || '[]').length}</span>
            </div>
            <div className="info-item">
              <strong>Размер данных:</strong>
              <span>{Math.round(((localStorage.getItem('calculator-product-configs')?.length || 0) + 
                     (localStorage.getItem('printing-calculator-presets')?.length || 0) + 
                     (localStorage.getItem('calculator-settings')?.length || 0)) / 1024)} KB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
