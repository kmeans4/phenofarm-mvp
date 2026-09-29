'use client';
import { OrderForm, type EditableOrder } from '../../../components/OrderForm';
export default function EditOrderForm({ order }: { order: EditableOrder }) {
  return <OrderForm order={order} />;
}
