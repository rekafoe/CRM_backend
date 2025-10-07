import React, { memo, useCallback } from 'react';
import { OrderItem as OrderItemComponent } from '../OrderItem';

interface MemoizedOrderItemProps {
  item: any;
  orderId: number;
  onUpdate: () => void;
}

export const MemoizedOrderItem = memo<MemoizedOrderItemProps>(({ item, orderId, onUpdate }) => {
  const handleUpdate = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  return (
    <OrderItemComponent 
      key={item.id} 
      item={item} 
      orderId={orderId} 
      onUpdate={handleUpdate} 
    />
  );
});

MemoizedOrderItem.displayName = 'MemoizedOrderItem';

