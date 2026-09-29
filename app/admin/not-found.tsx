import { EmptyState } from '@/app/components/ui/EmptyState';
export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="It may have moved or no longer be available."
      action={{ label: 'Back to overview', href: '/admin/dashboard' }}
    />
  );
}
