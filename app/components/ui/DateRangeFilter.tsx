'use client';


export type DateRange = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'all';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const options: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'all', label: 'All Time' },
];

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return <select aria-label="Date range" value={value} onChange={(event) => onChange(event.target.value as DateRange)} className="rounded-lg border border-gray-300 bg-white min-h-10 px-3 py-2 text-base sm:text-sm text-gray-700 focus:ring-2 focus:ring-green-500">
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const now = new Date();
  const checkDate = new Date(date);
  
  switch (range) {
    case 'today': {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const checkDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      return checkDay.getTime() === today.getTime();
    }
    
    case 'last7days': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return checkDate >= sevenDaysAgo && checkDate <= now;
    }
    
    case 'last30days': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      return checkDate >= thirtyDaysAgo && checkDate <= now;
    }
    
    case 'thisMonth': {
      return checkDate.getMonth() === now.getMonth() && 
             checkDate.getFullYear() === now.getFullYear();
    }
    
    case 'lastMonth': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return checkDate.getMonth() === lastMonth.getMonth() && 
             checkDate.getFullYear() === lastMonth.getFullYear();
    }
    
    case 'all':
    default:
      return true;
  }
}
