'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
}

interface StrainSelectorProps {
  strainId: string;
  onStrainChange: (strainId: string | null, strainName?: string) => void;
}

// Consistent input styles - h-10 matches text inputs
const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const SMALL_INPUT_CLASSES = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent";

export function StrainSelector({ strainId, onStrainChange }: StrainSelectorProps) {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStrainName, setNewStrainName] = useState('');
  const [newStrainGenetics, setNewStrainGenetics] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchStrains = async () => {
      try {
        const response = await fetch('/api/strains');
        if (response.ok) {
          const data = await response.json();
          setStrains(data);
        }
      } catch (err) {
        console.error('Error fetching strains:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStrains();
  }, []);

  const handleCreateStrain = async () => {
    if (!newStrainName.trim()) return;
    
    try {
      setCreating(true);
      const response = await fetch('/api/strains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStrainName.trim(),
          genetics: newStrainGenetics.trim() || null
        })
      });

      if (response.ok) {
        const newStrain = await response.json();
        setStrains([...strains, newStrain]);
        onStrainChange(newStrain.id, newStrain.name);
        setShowCreateForm(false);
        setNewStrainName('');
        setNewStrainGenetics('');
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to create strain');
      }
    } catch (err) {
      console.error('Error creating strain:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={strainId}
          onChange={(e) => onStrainChange(e.target.value || null)}
          className={INPUT_CLASSES}
        >
          <option value="">Select a strain (optional)</option>
          {strains.map(strain => (
            <option key={strain.id} value={strain.id}>
              {strain.name} {strain.genetics ? `(${strain.genetics})` : ''}
            </option>
          ))}
        </select>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + New
        </Button>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Create New Strain</span>
            <button 
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={newStrainName}
            onChange={(e) => setNewStrainName(e.target.value)}
            placeholder="Strain name *"
            className={SMALL_INPUT_CLASSES}
          />
          <input
            type="text"
            value={newStrainGenetics}
            onChange={(e) => setNewStrainGenetics(e.target.value)}
            placeholder="Genetics (optional)"
            className={SMALL_INPUT_CLASSES}
          />
          <Button 
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCreateStrain}
            disabled={!newStrainName.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create Strain'}
          </Button>
        </div>
      )}
    </div>
  );
}
