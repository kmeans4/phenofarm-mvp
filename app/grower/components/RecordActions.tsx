'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';

type RecordAction = { label: string; href?: string; onSelect?: () => void; destructive?: boolean };

export function RecordActions({ name, actions }: { name: string; actions: RecordAction[] }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" size="sm" aria-label={`More actions for ${name}`} onClick={() => setOpen(true)}>More</Button>
    <Modal open={open} onClose={() => setOpen(false)} title="More actions" className="max-w-sm">
      <p className="mb-3 break-words text-sm text-pf-muted">{name}</p>
      <div className="grid gap-2">
        {actions.map((action) => action.href ? (
          <Button key={action.label} asChild variant="outline" className="w-full justify-start"><Link href={action.href} onClick={() => setOpen(false)}>{action.label}</Link></Button>
        ) : (
          <Button key={action.label} type="button" variant={action.destructive ? 'destructive' : 'outline'} className="w-full justify-start" onClick={() => { setOpen(false); action.onSelect?.(); }}>{action.label}</Button>
        ))}
      </div>
    </Modal>
  </>;
}
