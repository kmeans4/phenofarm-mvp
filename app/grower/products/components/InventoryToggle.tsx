'use client';

import { Badge } from '@/app/components/ui/Badge';

interface InventoryToggleProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function InventoryToggle({ isChecked, onChange, label = 'Availability' }: InventoryToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div>
        <label className="text-sm font-medium text-gray-700">{label} Status</label>
        <p className="text-sm text-gray-600">Make product available for purchase</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!isChecked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isChecked ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isChecked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <Badge variant={isChecked ? 'success' : 'error'}>
        {isChecked ? 'Available' : 'Unavailable'}
      </Badge>
    </div>
  );
}
