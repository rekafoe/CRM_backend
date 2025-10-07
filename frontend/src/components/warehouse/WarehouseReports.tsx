import React from 'react';
import { Material } from '../../types/shared';

interface WarehouseReportsProps {
  materials: Material[];
  stats: {
    totalMaterials: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    categories: number;
    suppliers: number;
    alerts: number;
  };
}

export const WarehouseReports: React.FC<WarehouseReportsProps> = ({ materials, stats }) => {
  return (
    <div className="warehouse-reports">
      <div className="coming-soon">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">📊</div>
          <h3>Отчеты склада</h3>
          <p>Функционал в разработке</p>
          <p>Здесь будет аналитика и отчетность по складу</p>
        </div>
      </div>
    </div>
  );
};
