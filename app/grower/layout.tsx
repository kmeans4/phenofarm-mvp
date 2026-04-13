import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { MobileNav } from "./components/MobileNav";
import { ClientNav } from "./components/ClientNav";
import { SearchDialog } from "@/app/components/SearchDialog";
import { ChatDrawer } from "@/app/components/messaging/ChatDrawer";

export default async function GrowerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { id: string; role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const navLinks = [
    { name: 'Dashboard', href: '/grower/dashboard' },
    { name: 'Products', href: '/grower/products' },
    { name: 'Strains', href: '/grower/strains' },
    { name: 'Batches', href: '/grower/batches' },
    { name: 'Orders', href: '/grower/orders' },
    { name: 'Customers', href: '/grower/customers' },
    { name: 'Inventory', href: '/grower/inventory' },
    { name: 'Reports', href: '/grower/reports' },
    { name: 'Settings', href: '/grower/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-green-600">PhenoFarm</h1>
            <div className="flex items-center gap-2">
              <SearchDialog variant="icon" />
              {/* MobileNav includes hamburger button - placed on right */}
              <MobileNav links={navLinks} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-stretch">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:grid lg:grid-rows-[auto,minmax(0,1fr)] flex-shrink-0 min-h-screen lg:min-h-screen lg:sticky lg:top-0 overflow-hidden self-stretch">
          <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-xl font-bold text-green-600">PhenoFarm</h1>
            <p className="text-sm text-gray-500">Grower Portal</p>
            <div className="mt-3">
              <SearchDialog />
            </div>
          </div>
          
          <div className="min-h-0 overflow-y-auto py-1">
            <ClientNav links={navLinks} />
          </div>
          
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-20 lg:pt-0 w-full min-w-0 min-h-screen bg-gray-50">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>

      <ChatDrawer
        currentUserId={user.id}
        currentRole="GROWER"
      />
    </div>
  );
}
