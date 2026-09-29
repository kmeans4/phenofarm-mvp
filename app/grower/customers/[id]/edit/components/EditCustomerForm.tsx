'use client';
import {
  CustomerForm,
  type CustomerData,
} from '../../../components/CustomerForm';
import { PageHeader } from '@/app/components/ui/PageHeader';
export default function EditCustomerForm({
  customer,
}: {
  customer: CustomerData;
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        title={
          customer.isPlatformManaged ? 'Customer details' : 'Edit customer'
        }
      />
      <CustomerForm customer={customer} />
    </div>
  );
}
