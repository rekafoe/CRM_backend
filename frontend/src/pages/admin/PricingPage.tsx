import React, { useState } from 'react';
import { AdminPageLayout } from '../../components/admin/AdminPageLayout';
import { DynamicPricingManager } from '../../components/calculator/DynamicPricingManager';
import { PaperTypesManager } from '../../components/PaperTypesManager';
import { CostCalculation } from '../../components/warehouse/CostCalculation';
import '../../styles/admin-cards.css';

interface PricingPageProps {
  onBack: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const [activeModal, setActiveModal] = useState<'pricing' | 'paper-types' | null>(null);

  return (
    <AdminPageLayout
      title="Ценообразование"
      icon="💰"
      onBack={onBack}
      className="pricing-page"
    >
      <div className="pricing-content">
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>💰 Динамическое управление ценами</h3>
            <p>Полное управление ценами, скидками, коэффициентами и минимальными заказами</p>
            <div className="pricing-card-content">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveModal('pricing')}
              >
                Открыть менеджер цен
              </button>
            </div>
          </div>
          
          <div className="pricing-card">
            <h3>📄 Управление типами бумаги</h3>
            <p>Настройка типов бумаги и цен на печать</p>
            <div className="pricing-card-content">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveModal('paper-types')}
              >
                Открыть менеджер бумаги
              </button>
            </div>
          </div>
          
          <div className="pricing-card">
            <h3>📊 Расчет себестоимости</h3>
            <p>Анализ затрат и прибыльности товаров</p>
            <div className="pricing-card-content">
              <CostCalculation />
            </div>
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      {activeModal === 'pricing' && (
        <DynamicPricingManager
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'paper-types' && (
        <PaperTypesManager
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </AdminPageLayout>
  );
};
