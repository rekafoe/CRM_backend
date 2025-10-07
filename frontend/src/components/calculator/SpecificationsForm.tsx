import React from 'react';
import { ProductSpecs } from '../../types/shared';

interface SpecificationsFormProps {
  specs: ProductSpecs;
  onSpecsChange: (updates: Partial<ProductSpecs>) => void;
  productConfig: any;
  validationErrors: Record<string, string>;
  isCustomFormat: boolean;
  customFormat: { width: string; height: string };
  onCustomFormatChange: (format: { width: string; height: string }) => void;
  onCustomFormatToggle: (isCustom: boolean) => void;
  formatValidation: { isValid: boolean; message: string };
}

const PAPER_DENSITIES = {
  'semi-matte': [
    { value: 80, label: '80 г/м²' },
    { value: 90, label: '90 г/м²' },
    { value: 120, label: '120 г/м²' },
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 160, label: '160 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' },
    { value: 350, label: '350 г/м²' }
  ],
  'glossy': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 170, label: '170 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' }
  ],
  'office': [
    { value: 80, label: '80 г/м²' },
    { value: 100, label: '100 г/м²' },
    { value: 120, label: '120 г/м²' }
  ],
  'coated': [
    { value: 130, label: '130 г/м²' },
    { value: 150, label: '150 г/м²' },
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' }
  ],
  'designer': [
    { value: 200, label: '200 г/м²' },
    { value: 250, label: '250 г/м²' },
    { value: 300, label: '300 г/м²' },
    { value: 350, label: '350 г/м²' }
  ]
};

export const SpecificationsForm: React.FC<SpecificationsFormProps> = ({
  specs,
  onSpecsChange,
  productConfig,
  validationErrors,
  isCustomFormat,
  customFormat,
  onCustomFormatChange,
  onCustomFormatToggle,
  formatValidation
}) => {
  const availableDensities = PAPER_DENSITIES[specs.paperType as keyof typeof PAPER_DENSITIES] || [];

  return (
    <div className="form-section compact">
      <h3>⚙️ Параметры</h3>
      <div className="params-grid compact">
        {/* Формат */}
        <div className="param-group">
          <label>Формат</label>
          {isCustomFormat ? (
            <div className="custom-format-inputs">
              <input
                type="number"
                placeholder="Ширина"
                value={customFormat.width}
                onChange={(e) => onCustomFormatChange({ ...customFormat, width: e.target.value })}
                className={!formatValidation.isValid ? 'error' : ''}
              />
              <span>×</span>
              <input
                type="number"
                placeholder="Высота"
                value={customFormat.height}
                onChange={(e) => onCustomFormatChange({ ...customFormat, height: e.target.value })}
                className={!formatValidation.isValid ? 'error' : ''}
              />
              <span>мм</span>
            </div>
          ) : (
            <select
              value={specs.format}
              onChange={(e) => onSpecsChange({ format: e.target.value })}
              className={validationErrors.format ? 'error' : ''}
            >
              {productConfig?.formats?.map((format: string) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => onCustomFormatToggle(!isCustomFormat)}
          >
            {isCustomFormat ? 'Стандартные' : 'Произвольный'}
          </button>
          {validationErrors.format && (
            <span className="error-message">{validationErrors.format}</span>
          )}
        </div>

        {/* Количество */}
        <div className="param-group">
          <label>Количество</label>
          <input
            type="number"
            value={specs.quantity}
            onChange={(e) => onSpecsChange({ quantity: parseInt(e.target.value) || 0 })}
            className={validationErrors.quantity ? 'error' : ''}
            min="1"
          />
          {validationErrors.quantity && (
            <span className="error-message">{validationErrors.quantity}</span>
          )}
        </div>

        {/* Стороны */}
        <div className="param-group">
          <label>Стороны</label>
          <select
            value={specs.sides}
            onChange={(e) => onSpecsChange({ sides: parseInt(e.target.value) as 1 | 2 })}
          >
            {productConfig?.sides?.map((side: number) => (
              <option key={side} value={side}>{side} сторона{side > 1 ? 'ы' : ''}</option>
            ))}
          </select>
        </div>

        {/* Тип бумаги */}
        <div className="param-group">
          <label>Тип бумаги</label>
          <select
            value={specs.paperType}
            onChange={(e) => onSpecsChange({ paperType: e.target.value })}
          >
            <option value="semi-matte">Полуматовая</option>
            <option value="glossy">Глянцевая</option>
            <option value="office">Офисная</option>
            <option value="coated">Мелованная</option>
            <option value="designer">Дизайнерская</option>
          </select>
        </div>

        {/* Плотность бумаги */}
        <div className="param-group">
          <label>Плотность</label>
          <select
            value={specs.paperDensity}
            onChange={(e) => onSpecsChange({ paperDensity: parseInt(e.target.value) })}
          >
            {availableDensities.map((density) => (
              <option key={density.value} value={density.value}>
                {density.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ламинация */}
        <div className="param-group">
          <label>Ламинация</label>
          <select
            value={specs.lamination}
            onChange={(e) => onSpecsChange({ lamination: e.target.value as 'none' | 'matte' | 'glossy' })}
          >
            <option value="none">Без ламинации</option>
            <option value="matte">Матовая</option>
            <option value="glossy">Глянцевая</option>
          </select>
        </div>

        {/* Тип цены */}
        <div className="param-group">
          <label>Тип цены</label>
          <select
            value={specs.priceType}
            onChange={(e) => onSpecsChange({ priceType: e.target.value as any })}
          >
            <option value="standard">Стандарт</option>
            <option value="urgent">Срочно</option>
            <option value="superUrgent">Супер-срочно</option>
            <option value="online">Онлайн</option>
            <option value="promo">Промо</option>
            <option value="express">Экспресс</option>
          </select>
        </div>

        {/* Тип клиента */}
        <div className="param-group">
          <label>Тип клиента</label>
          <select
            value={specs.customerType}
            onChange={(e) => onSpecsChange({ customerType: e.target.value as 'regular' | 'vip' })}
          >
            <option value="regular">Обычный</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      {/* Дополнительные опции */}
      <div className="additional-options">
        <h4>Дополнительные услуги</h4>
        <div className="options-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={specs.magnetic || false}
              onChange={(e) => onSpecsChange({ magnetic: e.target.checked })}
            />
            Магнит
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={specs.cutting || false}
              onChange={(e) => onSpecsChange({ cutting: e.target.checked })}
            />
            Резка
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={specs.folding || false}
              onChange={(e) => onSpecsChange({ folding: e.target.checked })}
            />
            Фальцовка
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={specs.roundCorners || false}
              onChange={(e) => onSpecsChange({ roundCorners: e.target.checked })}
            />
            Скругление углов
          </label>
        </div>
      </div>
    </div>
  );
};
