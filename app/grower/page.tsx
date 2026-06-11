import { redirect } from 'next/navigation';

export default function GrowerRootPage() {
  // Redirect /grower to /grower/dashboard for consistency with admin/dispensary routes
  redirect('/grower/dashboard');
}
