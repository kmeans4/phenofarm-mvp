'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { toast } from '@/app/hooks/useToast';
export function DeleteCustomerButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        setPending(true);
        timer.current = setTimeout(async () => {
          timer.current = null;
          try {
            const r = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.error || 'Could not remove customer.');
            router.push('/grower/customers');
            router.refresh();
          } catch (e) {
            setPending(false);
            toast.error(
              e instanceof Error ? e.message : 'Could not remove customer.'
            );
          }
        }, 8000);
        toast.info('Customer will be removed', {
          duration: 8000,
          action: {
            label: 'Undo',
            onClick: () => {
              if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
                setPending(false);
                toast.success('Customer kept');
              }
            },
          },
        });
      }}
    >
      {pending ? 'Removing…' : 'Delete customer'}
    </Button>
  );
}
