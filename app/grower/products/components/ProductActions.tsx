'use client';

import { EditButton } from './EditButton';
import { DeleteButton } from './DeleteButton';

interface ProductActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ProductActions({ onEdit, onDelete, disabled }: ProductActionsProps) {
  return (
    <div className="flex gap-2">
      <EditButton onClick={onEdit} />
      <DeleteButton onClick={onDelete} disabled={disabled} />
    </div>
  );
}
