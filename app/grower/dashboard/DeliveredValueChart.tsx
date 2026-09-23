import { format, parseISO } from 'date-fns';

export function DeliveredValueChart({ days }: { days: { date: string; revenue: number }[] }) {
  const max = Math.max(...days.map(day => day.revenue), 1);
  const points = days.map((day, index) => `${(index / Math.max(days.length - 1, 1)) * 600},${140 - (day.revenue / max) * 120}`).join(' ');
  const total = days.reduce((sum, day) => sum + day.revenue, 0);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-base font-semibold">Delivered value</h2><p className="mt-1 text-xs text-pf-muted">Last 30 days · {format(parseISO(days[0].date), 'MMM d')}–{format(parseISO(days[days.length - 1].date), 'MMM d')}</p></div>
        <span className="text-xl font-semibold tabular-nums">${total.toLocaleString()}</span>
      </div>
      <div className="flex gap-2">
        <div className="flex h-40 shrink-0 flex-col justify-between py-1 text-[10px] tabular-nums text-pf-muted" aria-hidden="true"><span>${max >= 1000 ? `${(max / 1000).toFixed(1)}k` : max.toLocaleString()}</span><span>${Math.round(max / 2).toLocaleString()}</span><span>$0</span></div>
        <div className="min-w-0 flex-1">
          <svg className="h-40 w-full overflow-visible" viewBox="0 0 600 150" preserveAspectRatio="none" role="img" aria-label={`Delivered value over the last 30 days: $${total.toLocaleString()}. Daily high: $${max.toLocaleString()}.`}>
            <defs><linearGradient id="delivered-value-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".3" /><stop offset="100%" stopColor="#10b981" stopOpacity=".02" /></linearGradient></defs>
            {[20,80,140].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--color-pf-line)" strokeWidth="1" />)}
            <polygon points={`0,140 ${points} 600,140`} fill="url(#delivered-value-fill)" />
            <polyline points={points} fill="none" stroke="#10d69b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-pf-muted">{[0,7,14,21,29].map(index => <span key={index}>{format(parseISO(days[index].date), 'MMM d')}</span>)}</div>
        </div>
      </div>
      <details className="mt-3 text-xs text-pf-muted"><summary className="cursor-pointer py-2">Daily values</summary><div className="max-h-40 overflow-y-auto"><table className="text-left"><thead><tr><th className="py-2">Date</th><th className="text-right">Delivered value</th></tr></thead><tbody>{days.map(day => <tr key={day.date}><td className="py-1">{format(parseISO(day.date), 'MMM d')}</td><td className="text-right tabular-nums">${day.revenue.toLocaleString()}</td></tr>)}</tbody></table></div></details>
    </div>
  );
}
