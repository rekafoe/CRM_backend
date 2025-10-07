import { Item } from './Item'

export interface Order {
  id: number;
  number: string;
  status: number;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  prepaymentAmount?: number;
  prepaymentStatus?: string;
  paymentUrl?: string;
  paymentId?: string;
  paymentMethod?: 'online' | 'offline' | 'telegram';
  userId?: number;
  items: Item[];
}
