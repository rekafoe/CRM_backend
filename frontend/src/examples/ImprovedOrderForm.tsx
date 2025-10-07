import React from 'react';
import { useForm, useApi } from '../hooks/useApi';
import { orderValidators } from '../utils/validation';
import { LoadingButton, LoadingState } from '../components/LoadingSpinner';
import { ApiErrorDisplay, ValidationErrorDisplay } from '../components/ErrorBoundary';
import { Order } from '../types';

interface OrderFormProps {
  initialData?: Partial<Order>;
  onSubmit: (data: Order) => Promise<void>;
  onCancel: () => void;
}

export const ImprovedOrderForm: React.FC<OrderFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
}) => {
  const { execute, loading, error, ErrorDisplay } = useApi();

  const {
    data,
    errors,
    isDirty,
    isSubmitting,
    updateField,
    validate,
    submit,
    reset,
    getFieldError,
  } = useForm<Order>(
    {
      id: 0,
      number: '',
      status: 1,
      createdAt: new Date().toISOString(),
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      prepaymentAmount: 0,
      paymentMethod: 'online',
      items: [],
      ...initialData,
    },
    (data) => orderValidators.createOrder.validate(data)
  );

  const handleSubmit = async () => {
    const isValid = validate();
    if (!isValid) return;

    await submit(async (formData) => {
      await execute(async () => {
        await onSubmit(formData);
      });
    });
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Создание заказа</h2>
      
      <ErrorDisplay />
      
      <ValidationErrorDisplay 
        errors={errors} 
        onDismiss={() => {}} 
      />

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Номер заказа *
          </label>
          <input
            type="text"
            value={data.number}
            onChange={(e) => updateField('number', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${getFieldError('number') ? '#f44336' : '#ddd'}`,
              borderRadius: '4px',
            }}
            placeholder="ORD-0001"
          />
          {getFieldError('number') && (
            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
              {getFieldError('number')}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Имя клиента *
          </label>
          <input
            type="text"
            value={data.customerName || ''}
            onChange={(e) => updateField('customerName', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${getFieldError('customerName') ? '#f44336' : '#ddd'}`,
              borderRadius: '4px',
            }}
            placeholder="Иван Иванов"
          />
          {getFieldError('customerName') && (
            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
              {getFieldError('customerName')}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Телефон
          </label>
          <input
            type="tel"
            value={data.customerPhone || ''}
            onChange={(e) => updateField('customerPhone', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${getFieldError('customerPhone') ? '#f44336' : '#ddd'}`,
              borderRadius: '4px',
            }}
            placeholder="+375291234567"
          />
          {getFieldError('customerPhone') && (
            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
              {getFieldError('customerPhone')}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Email
          </label>
          <input
            type="email"
            value={data.customerEmail || ''}
            onChange={(e) => updateField('customerEmail', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${getFieldError('customerEmail') ? '#f44336' : '#ddd'}`,
              borderRadius: '4px',
            }}
            placeholder="ivan@example.com"
          />
          {getFieldError('customerEmail') && (
            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
              {getFieldError('customerEmail')}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Способ оплаты
          </label>
          <select
            value={data.paymentMethod || 'online'}
            onChange={(e) => updateField('paymentMethod', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="online">Онлайн</option>
            <option value="offline">Оффлайн</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Предоплата (BYN)
          </label>
          <input
            type="number"
            value={data.prepaymentAmount || 0}
            onChange={(e) => updateField('prepaymentAmount', Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${getFieldError('prepaymentAmount') ? '#f44336' : '#ddd'}`,
              borderRadius: '4px',
            }}
            min="0"
            step="0.01"
          />
          {getFieldError('prepaymentAmount') && (
            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
              {getFieldError('prepaymentAmount')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty}
            style={{
              padding: '10px 20px',
              backgroundColor: isDirty ? '#ff9800' : '#f5f5f5',
              color: isDirty ? 'white' : '#666',
              border: 'none',
              borderRadius: '4px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
            }}
          >
            Сбросить
          </button>

          <LoadingButton
            type="submit"
            loading={loading || isSubmitting}
            loadingText="Создание..."
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Создать заказ
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

// Пример использования улучшенного списка заказов
export const ImprovedOrderList: React.FC = () => {
  const {
    items: orders,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  } = useApi<Order>('/orders', [], { cache: true });

  const [showForm, setShowForm] = React.useState(false);

  const handleCreateOrder = async (orderData: Order) => {
    await create(orderData);
    setShowForm(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Заказы</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Новый заказ
        </button>
      </div>

      <LoadingState loading={loading} text="Загрузка заказов...">
        <div style={{ display: 'grid', gap: '16px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{order.number}</h3>
                  <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                    Клиент: {order.customerName || 'Не указан'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                    Телефон: {order.customerPhone || 'Не указан'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                    Email: {order.customerEmail || 'Не указан'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                    Статус: {order.status}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                    Предоплата: {order.prepaymentAmount || 0} BYN
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => update(order.id, { status: order.status + 1 })}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Обновить статус
                  </button>
                  <button
                    onClick={() => remove(order.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </LoadingState>

      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90%',
            overflowY: 'auto',
          }}>
            <ImprovedOrderForm
              onSubmit={handleCreateOrder}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};


