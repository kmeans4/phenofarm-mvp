import { PageHeader } from '@/app/components/ui/PageHeader';
import { CustomerForm } from '../components/CustomerForm';
export default function AddCustomerPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Add customer" />
      <CustomerForm />
    </div>
  );
}
