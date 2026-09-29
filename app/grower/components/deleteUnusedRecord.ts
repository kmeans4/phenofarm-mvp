import { toast } from '@/app/hooks/useToast';
export async function deleteUnusedRecord(
  kind: 'strains' | 'batches',
  id: string,
  onChanged: () => void
) {
  try {
    const snapshotResponse = await fetch(`/api/${kind}/${id}`);
    if (!snapshotResponse.ok)
      throw new Error('Could not load this record. Retry.');
    const snapshot = await snapshotResponse.json();
    const response = await fetch(`/api/${kind}/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || 'Could not delete this record.');
    onChanged();
    toast.success(kind === 'strains' ? 'Strain deleted' : 'Batch deleted', {
      duration: 12000,
      action: {
        label: 'Undo',
        onClick: () => {
          void fetch(`/api/${kind}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snapshot),
          })
            .then(async (restored) => {
              if (!restored.ok) {
                const data = await restored.json();
                throw new Error(data.error || 'Could not restore the record.');
              }
              onChanged();
              toast.success('Restored');
            })
            .catch((error) => toast.error(error.message, { duration: 10000 }));
        },
      },
    });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Connection lost. Try again.'
    );
  }
}
