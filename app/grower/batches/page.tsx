'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExtendedUser } from '@/types';
import { Button } from '@/app/components/ui/Button';

interface Strain {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  lotNumber: string | null;
  harvestDate: string;
  strainId: string;
  strain: Strain;
  thc: number | null;
  cbd: number | null;
  totalCannabinoids: number | null;
  coaDocumentUrl: string | null;
  _count: {
    products: number;
  };
}

export default function BatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStrain, setFilterStrain] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }

    const user = (session as any).user as ExtendedUser;
    if (user.role !== 'GROWER') {
      router.push('/dashboard');
      return;
    }

    fetchBatches();
  }, [status, session, router]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = filterStrain ? `/api/batches?strainId=${filterStrain}` : '/api/batches';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setBatches(data);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch batches');
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      const response = await fetch('/api/batches/' + batchId, { method: 'DELETE' });
      if (response.ok) {
        setBatches(batches.filter(b => b.id !== batchId));
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete batch');
      }
    } catch {
      console.error('Error deleting batch');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600 mt-1">Manage your harvest batches and lab results</p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/grower/batches/add">+ Add Batch</Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button variant="secondary" onClick={fetchBatches} className="mt-2">Retry</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Batches</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{batches.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {batches.reduce((sum, b) => sum + b._count.products, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Avg. THC</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {batches.filter(b => b.thc).length > 0
              ? (batches.reduce((sum, b) => sum + (b.thc || 0), 0) / batches.filter(b => b.thc).length).toFixed(1)
              : 'N/A'}%
          </p>
        </div>
      </div>

      {/* Batches Table */}
      {batches.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Batch #</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Strain</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Harvest Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">THC</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">CBD</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Products</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{batch.batchNumber}</span>
                      {batch.lotNumber && (
                        <span className="text-gray-500 text-sm ml-2">Lot: {batch.lotNumber}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{batch.strain?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(batch.harvestDate)}</td>
                    <td className="px-4 py-3">
                      {batch.thc ? (
                        <span className="text-green-600 font-medium">{batch.thc.toFixed(1)}%</span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {batch.cbd ? (
                        <span className="text-blue-600 font-medium">{batch.cbd.toFixed(1)}%</span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{batch._count.products}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={'/grower/batches/' + batch.id + '/edit'}>Edit</Link>
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          asChild
                        >
                          <Link href={'/grower/products/add?strainId=' + batch.strainId + '&batchId=' + batch.id}>
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
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No batches yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first batch to track harvest data and lab results.
          </p>
          <Button variant="primary" asChild>
            <Link href="/grower/batches/add">Create your first batch</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
