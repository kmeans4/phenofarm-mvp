import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Layout from '@/app/components/Layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string };
  const role = user.role as string;

  // Determine role-based navigation
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Inventory', href: '/dashboard/inventory' },
    { name: 'Orders', href: '/dashboard/orders' },
  ];

  if (role === 'ADMIN') {
    navItems.push({ name: 'Admin Panel', href: '/dashboard/admin' });
  }

  return (
    <Layout>
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 pt-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 px-2">
              {user.businessName || `${user.firstName} ${user.lastName}`}
            </h2>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-4">
          {children}
        </div>
      </div>
    </Layout>
  );
}
