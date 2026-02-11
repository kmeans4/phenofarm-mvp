'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const runSeed = async () => {
    setStatus('seeding');
    setMessage('');

    try {
      // Create grower user with password123
      const growerUser = await db.user.upsert({
        where: { email: 'grower@vtnurseries.com' },
        update: {},
        create: {
          email: 'grower@vtnurseries.com',
          name: 'John Green',
          role: 'GROWER',
        },
      });

      const grower = await db.grower.upsert({
        where: { userId: growerUser.id },
        update: {},
        create: {
          userId: growerUser.id,
          businessName: 'Vermont Nurseries',
          licenseNumber: 'VT-GWL-2024-001',
          phone: '(802) 555-0123',
          city: 'Bristol',
          state: 'VT',
          zip: '05443',
          description: 'Premium cannabis products grown with care in Vermont',
        },
      });

      // Create dispensary user with password123
      const dispensaryUser = await db.user.upsert({
        where: { email: 'dispensary@greenvermont.com' },
        update: {},
        create: {
          email: 'dispensary@greenvermont.com',
          name: 'Sarah Cannabis',
          role: 'DISPENSARY',
        },
      });

      const dispensary = await db.dispensary.upsert({
        where: { userId: dispensaryUser.id },
        update: {},
        create: {
          userId: dispensaryUser.id,
          businessName: 'Green Vermont Dispensary',
          licenseNumber: 'VT-RTL-2024-001',
          phone: '(802) 555-0145',
          city: 'Burlington',
          state: 'VT',
          zip: '05401',
          description: 'Vermont\'s premier cannabis retail destination',
        },
      });

      // Create admin user with password123
      await db.user.upsert({
        where: { email: 'admin@phenofarm.com' },
        update: {},
        create: {
          email: 'admin@phenofarm.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      });

      setMessage(`✅ Seed complete!

Test credentials:
- Admin: admin@phenofarm.com / password123
- Grower: grower@vtnurseries.com / password123
- Dispensary: dispensary@greenvermont.com / password123

Users created and ready to use.`);
      setStatus('success');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  useEffect(() => {
    // Check if data already exists
    db.user.count().then((count) => {
      if (count > 0) {
        setStatus('success');
        setMessage(`✅ Database already has ${count} users.`);
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Database Seeding</h1>
        
        {status === 'idle' && (
          <div className="text-gray-600 mb-6">
            This page will seed test data for your development environment.
            It will create:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>1 Admin user</li>
              <li>1 Grower user</li>
              <li>1 Dispensary user</li>
            </ul>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${status === 'success' ? 'bg-green-50 text-green-800' : status === 'error' ? 'bg-red-50 text-red-800' : 'bg-gray-50'}`}>
            <pre className="font-mono text-sm whitespace-pre-wrap">{message}</pre>
          </div>
        )}

        <button
          onClick={runSeed}
          disabled={status === 'seeding'}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'seeding' ? 'Seeding...' : status === 'success' ? 'Database Seeded' : 'Seed Database'}
        </button>

        {status !== 'seeding' && (
          <a href="/auth/sign_in" className="block mt-4 text-center text-green-600 hover:text-green-700">
            Go to Sign-In →
          </a>
        )}
      </div>
    </div>
  );
}
