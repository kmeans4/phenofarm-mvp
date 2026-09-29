import { Suspense } from 'react';
import { OrderForm } from '../components/OrderForm';
export default function AddOrderPage() {
  return (
    <Suspense fallback={<p>Loading order…</p>}>
      <OrderForm />
    </Suspense>
  );
}
