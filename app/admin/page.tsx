import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redirect /admin to /admin/dashboard for consistency with grower/dispensary routes
  redirect('/admin/dashboard');
}
