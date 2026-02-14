'use client';

import { Button } from '@/app/components/ui/Button';

interface EditButtonProps {
  onClick: () => void;
}

export function EditButton({ onClick }: EditButtonProps) {
  return (
    <Button 
      variant="default" 
      onClick={onClick}
      className="text-sm"
    >
      Edit
    </Button>
  );
}
