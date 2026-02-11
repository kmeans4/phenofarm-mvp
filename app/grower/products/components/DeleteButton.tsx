'use client';

import { Button } from '@/app/components/ui/Button';

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function DeleteButton({ onClick, disabled }: DeleteButtonProps) {
  return (
    <Button 
      variant="danger" 
      onClick={onClick} 
      disabled={disabled}
      className="text-sm"
    >
      Delete
    </Button>
  );
}
