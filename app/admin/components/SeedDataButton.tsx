'use client';

import { useState } from 'react';

export function SeedDataButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setStatus('loading');
    setMessage('Creating demo accounts...');
    
    try {
      const response = await fetch('/api/admin/seed');
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        const created = data.created?.length || 0;
        setMessage(`✅ Created ${created} demo accounts! Refresh the page to see them.`);
      } else {
        setStatus('error');
        setMessage(`❌ Error: ${data.error || 'Failed to seed data'}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage('❌ Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSeed}
        disabled={status === 'loading' || status === 'success'}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          status === 'success' 
            ? 'bg-green-600 text-white cursor-default' 
            : status === 'error'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {status === 'loading' ? 'Creating...' : 
         status === 'success' ? '✓ Done!' : 
         'Seed Demo Data'}
      </button>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
