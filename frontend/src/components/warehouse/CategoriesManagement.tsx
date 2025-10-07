import React from 'react';

interface CategoriesManagementProps {
  onRefresh: () => void;
}

export const CategoriesManagement: React.FC<CategoriesManagementProps> = ({ onRefresh }) => {
  return (
    <div className="categories-management">
      <div className="coming-soon">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">🏷️</div>
          <h3>Управление категориями</h3>
          <p>Функционал в разработке</p>
          <p>Здесь будет управление категориями материалов</p>
        </div>
      </div>
    </div>
  );
};
