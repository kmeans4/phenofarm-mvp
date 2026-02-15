'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';

interface Strain {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  strainId: string;
  strain: Strain;
  thc: number | null;
  cbd: number | null;
}

interface BatchSelectorProps {
  strainId?: string;
  batchId: string;
  onBatchChange: (batchId: string | null) => void;
}

// Consistent input styles - h-10 matches text inputs
const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";

export function BatchSelector({ strainId, batchId, onBatchChange }: BatchSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const url = strainId ? `/api/batches?strainId=${strainId}` : '/api/batches';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setBatches(data);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [strainId]);

  if (loading) {
    return (
      <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        No batches available. <a href="/grower/batches/add" className="text-green-600 hover:underline">Create a batch</a> first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={batchId}
        onChange={(e) => onBatchChange(e.target.value || null)}
        className={INPUT_CLASSES}
      >
        <option value="">Select a batch (optional)</option>
        {batches.map(batch => (
          <option key={batch.id} value={batch.id}>
            {batch.batchNumber} - {batch.strain?.name} {batch.thc ? `(THC: ${batch.thc}%)` : ''}
          </option>
        ))}
      </select>
      {batchId && (
        <a 
          href={`/grower/batches/${batchId}/edit`} 
          target="_blank"
          className="text-sm text-green-600 hover:underline"
        >
          View batch details →
        </a>
      )}
    </div>
  );
}
