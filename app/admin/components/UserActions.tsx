'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
export function UserActions({
  id,
  verified,
  suspended,
  admin,
}: {
  id: string;
  verified: boolean;
  suspended: boolean;
  admin: boolean;
}) {
  const router = useRouter();
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function run(value: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: value }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Error(data?.error || 'Action failed.');
      toast.success(data.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusy(false);
      setConfirm(false);
      setAction('');
    }
  }
  return (
    <>
      <select
        aria-label="Account actions"
        value={action}
        disabled={busy}
        className="max-w-full rounded-lg border px-2 py-2 text-sm"
        onChange={(event) => {
          const value = event.target.value;
          setAction(value);
          if (value === 'suspend') setConfirm(true);
          else if (value) void run(value);
        }}
      >
        <option value="">Account actions</option>
        <option value="reset-password">Send password reset</option>
        {!verified && (
          <option value="resend-verification">Resend verification</option>
        )}
        {!admin && (
          <>
            <option value="sign-out">Sign out everywhere</option>
            <option value={suspended ? 'resume' : 'suspend'}>
              {suspended ? 'Resume account' : 'Pause account'}
            </option>
          </>
        )}
      </select>
      <ConfirmDialog
        open={confirm}
        title="Pause account?"
        description="The account owner will be signed out and cannot sign in until you resume their account."
        confirmLabel="Pause account"
        intent="danger"
        loading={busy}
        onConfirm={() => run('suspend')}
        onCancel={() => {
          setConfirm(false);
          setAction('');
        }}
      />
    </>
  );
}
