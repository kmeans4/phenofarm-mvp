'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/Button';
import { toast } from '@/app/hooks/useToast';
import { STRAIN_TYPES, STRAIN_TYPE_LABELS, StrainTypeValue } from '@/lib/strain-types';

interface Strain {
  id: string;
  name: string;
  strainType: StrainTypeValue | null;
  genetics: string | null;
}

interface StrainSelectorProps {
  strainId: string;
  onStrainChange: (strainId: string | null, strainName?: string) => void;
}

// Consistent input styles - h-10 matches text inputs
const INPUT_CLASSES = "min-w-0 w-full h-10 px-3 py-2 text-base sm:px-4 border border-pf-line-strong rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const SMALL_INPUT_CLASSES = "min-h-10 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent";

export function StrainSelector({ strainId, onStrainChange }: StrainSelectorProps) {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStrainName, setNewStrainName] = useState('');
  const [newStrainType, setNewStrainType] = useState<StrainTypeValue | ''>('');
  const [newStrainGenetics, setNewStrainGenetics] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchStrains = async () => {
      try {
        const response = await fetch('/api/strains?summary=true', { signal: controller.signal });
        if (!isActive) return;

        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setStrains(data);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchStrains();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const pendingRef = useRef(false);
  const handleCreateStrain = async () => {
    if (!newStrainName.trim() || !newStrainType || pendingRef.current) return;
    pendingRef.current = true;
    
    try {
      setCreating(true);
      const response = await fetch('/api/strains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStrainName.trim(),
          strainType: newStrainType,
          genetics: newStrainGenetics.trim() || null
        })
      });

      if (response.ok) {
        const newStrain = await response.json();
        setStrains((current) => [...current, newStrain]);
        onStrainChange(newStrain.id, newStrain.name);
        setShowCreateForm(false);
        setNewStrainName('');
        setNewStrainType('');
        setNewStrainGenetics('');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create strain');
      }
    } catch (err) {
      console.error('Error creating strain:', err);
      toast.error('Network error creating strain');
    } finally {
      pendingRef.current = false;
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-10 bg-pf-surface animate-pulse rounded-lg"></div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          id="strainId"
          value={strainId}
          onChange={(e) => {
            const selectedValue = e.target.value || null;
            onStrainChange(selectedValue);
            if (selectedValue) {
              setShowCreateForm(false);
            }
          }}
          className={INPUT_CLASSES}
        >
          <option value="">Choose strain</option>
          {strains.map(strain => (
            <option key={strain.id} value={strain.id}>
              {strain.name}
              {strain.strainType ? ` • ${STRAIN_TYPE_LABELS[strain.strainType]}` : ''}
              {strain.genetics ? ` (${strain.genetics})` : ''}
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
        <div className="p-3 sm:p-4 bg-pf-canvas rounded-lg border border-pf-line space-y-3" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); void handleCreateStrain(); } }}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-pf-secondary">New strain</span>
            <button 
              type="button"
              onClick={() => setShowCreateForm(false)}
              aria-label="Close strain form"
              className="flex h-10 w-10 items-center justify-center text-xl text-pf-muted hover:text-pf-secondary"
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
          <select
            value={newStrainType}
            onChange={(e) => setNewStrainType(e.target.value as StrainTypeValue)}
            className={SMALL_INPUT_CLASSES}
          >
            <option value="">Select strain type *</option>
            {STRAIN_TYPES.map((type) => (
              <option key={type} value={type}>{STRAIN_TYPE_LABELS[type]}</option>
            ))}
          </select>
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
            disabled={!newStrainName.trim() || !newStrainType || creating}
          >
            {creating ? 'Creating...' : 'Add strain'}
          </Button>
        </div>
      )}
    </div>
  );
}
