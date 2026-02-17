'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExtendedUser, AuthSession } from '@/types';
import { Button } from '@/app/components/ui/Button';

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
  description: string | null;
  growerNotes: string | null;
  createdAt: string;
  _count: {
    products: number;
    batches: number;
  };
}

export default function StrainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Load view mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('strainViewMode');
    if (saved === 'card' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('strainViewMode', mode);
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }

    const user = (session as AuthSession).user;
    if (user.role !== 'GROWER') {
      router.push('/dashboard');
      return;
    }

    fetchStrains();
  }, [status, session, router]);

  const fetchStrains = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/strains');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setStrains(data);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch strains');
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteStrain = async (strainId: string) => {
    if (!confirm('Are you sure you want to delete this strain?')) return;
    try {
      const response = await fetch('/api/strains/' + strainId, { method: 'DELETE' });
      if (response.ok) {
        setStrains(strains.filter(s => s.id !== strainId));
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete strain');
      }
    } catch {
      console.error('Error deleting strain');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading strains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strain Management</h1>
          <p className="text-gray-600 mt-1">Manage your cannabis genetics library</p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/grower/strains/add">+ Add Strain</Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button variant="secondary" onClick={fetchStrains} className="mt-2">Retry</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Strains</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{strains.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Batches</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {strains.reduce((sum, s) => sum + s._count.batches, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {strains.reduce((sum, s) => sum + s._count.products, 0)}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleViewModeChange('card')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'card'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Card View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Strains Display */}
      {strains.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strains.map((strain) => (
              <div key={strain.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{strain.name}</h3>
                      {strain.genetics && (
                        <p className="text-sm text-gray-500 mt-1">{strain.genetics}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                      Strain
                    </span>
                  </div>

                  {strain.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{strain.description}</p>
                  )}

                  {strain.growerNotes && (
                    <p className="text-sm text-gray-500 mt-2 italic line-clamp-2">{strain.growerNotes}</p>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>{strain._count.batches} batches</span>
                    <span>{strain._count.products} products</span>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={'/grower/strains/' + strain.id + '/edit'}>Edit</Link>
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={'/grower/products/add?strainId=' + strain.id}>
                        + Product
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strain</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genetics</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {strains.map((strain) => (
                    <tr key={strain.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{strain.name}</div>
                        {strain.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{strain.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {strain.genetics || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {strain._count.batches}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {strain._count.products}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={'/grower/strains/' + strain.id + '/edit'}>Edit</Link>
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            asChild
                          >
                            <Link href={'/grower/products/add?strainId=' + strain.id}>
                              + Product
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No strains yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Start building your genetics library by adding your first strain.
          </p>
          <Button variant="primary" asChild>
            <Link href="/grower/strains/add">Add your first strain</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
