import Link from 'next/link';

interface User {
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export default function Navbar({ user }: { user?: User }) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PhenoFarm</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  {user.businessName || `${user.firstName} ${user.lastName}`}
                </span>
                <Link
                  href={user.role === 'GROWER' ? '/grower/dashboard' : '/dispensary/dashboard'}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign_in" className="text-sm text-gray-700 hover:text-gray-900">
                  Sign In
                </Link>
                <Link
                  href="/auth/sign_up"
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
