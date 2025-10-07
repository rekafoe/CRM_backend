import React, { useState } from 'react';
import { Alert, PriceIndicator, StatusBadge, Modal, Button, FormField } from '../common';
import '../../styles/utilities.css';

export const NewStyleExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ id: number; type: 'success' | 'warning' | 'error' | 'info'; message: string }>>([]);

  const addAlert = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message }]);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">
        🎨 Пример новой системы стилей
      </h1>

      {/* Алерты */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Уведомления</h2>
        <div className="space-y-3">
          {alerts.map(alert => (
            <Alert 
              key={alert.id} 
              type={alert.type} 
              onClose={() => removeAlert(alert.id)}
            >
              {alert.message}
            </Alert>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="success" 
            size="sm"
            onClick={() => addAlert('success', 'Операция выполнена успешно!')}
          >
            Успех
          </Button>
          <Button 
            variant="warning" 
            size="sm"
            onClick={() => addAlert('warning', 'Внимание! Проверьте данные.')}
          >
            Предупреждение
          </Button>
          <Button 
            variant="error" 
            size="sm"
            onClick={() => addAlert('error', 'Произошла ошибка!')}
          >
            Ошибка
          </Button>
          <Button 
            variant="info" 
            size="sm"
            onClick={() => addAlert('info', 'Полезная информация.')}
          >
            Информация
          </Button>
        </div>
      </div>

      {/* Индикаторы цен */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Индикаторы изменений цен</h2>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <div className="text-sm text-muted mb-1">Рост цены</div>
            <PriceIndicator percent={15.5} />
          </div>
          <div className="text-center">
            <div className="text-sm text-muted mb-1">Снижение цены</div>
            <PriceIndicator percent={-8.2} />
          </div>
          <div className="text-center">
            <div className="text-sm text-muted mb-1">Без изменений</div>
            <PriceIndicator percent={0} />
          </div>
        </div>
      </div>

      {/* Статусные бейджи */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Статусные бейджи</h2>
        <div className="flex gap-3 flex-wrap">
          <StatusBadge status="Активен" color="success" />
          <StatusBadge status="В ожидании" color="warning" />
          <StatusBadge status="Ошибка" color="error" />
          <StatusBadge status="Информация" color="info" />
          <StatusBadge status="Нейтральный" color="neutral" />
        </div>
      </div>

      {/* Кнопки */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Кнопки</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="primary">Основная</Button>
          <Button variant="secondary">Вторичная</Button>
          <Button variant="success">Успех</Button>
          <Button variant="warning">Предупреждение</Button>
          <Button variant="error">Ошибка</Button>
          <Button variant="info">Информация</Button>
        </div>
        <div className="flex gap-3 flex-wrap mt-3">
          <Button size="sm">Маленькая</Button>
          <Button size="md">Средняя</Button>
          <Button size="lg">Большая</Button>
        </div>
        <div className="flex gap-3 flex-wrap mt-3">
          <Button disabled>Отключена</Button>
          <Button loading>Загрузка</Button>
        </div>
      </div>

      {/* Форма */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Форма</h2>
        <div className="card max-w-md">
          <FormField label="Имя пользователя" required>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Введите имя"
            />
          </FormField>
          <FormField label="Email" required error="Некорректный email">
            <input 
              type="email" 
              className="form-control" 
              placeholder="Введите email"
            />
          </FormField>
          <FormField label="Комментарий" help="Необязательное поле">
            <textarea 
              className="form-control" 
              rows={3}
              placeholder="Введите комментарий"
            />
          </FormField>
          <div className="flex gap-3 mt-4">
            <Button type="submit" variant="primary">Сохранить</Button>
            <Button type="button" variant="secondary">Отмена</Button>
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Модальное окно</h2>
        <Button onClick={() => setShowModal(true)}>
          Открыть модальное окно
        </Button>
        
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          title="Пример модального окна"
          size="md"
        >
          <p className="text-primary mb-4">
            Это пример модального окна, созданного с использованием новой системы стилей.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setShowModal(false)}>
              Закрыть
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
          </div>
        </Modal>
      </div>

      {/* Утилитарные классы */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Утилитарные классы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-primary mb-2">Flexbox</h3>
            <div className="flex justify-between items-center gap-4 p-4 bg-secondary rounded">
              <span>Элемент 1</span>
              <span>Элемент 2</span>
              <span>Элемент 3</span>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-primary mb-2">Отступы и размеры</h3>
            <div className="p-4 m-2 bg-info text-white rounded">
              <p className="text-sm">Маленький текст</p>
              <p className="text-base">Обычный текст</p>
              <p className="text-lg font-bold">Большой жирный текст</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
