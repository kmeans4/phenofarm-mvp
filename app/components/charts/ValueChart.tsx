'use client';

import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import {
  valueAxisMaximum,
  valueDateLabel,
  type ValueBucket,
  type ValuePoint,
} from '@/lib/chart-values';

const WIDTH = 720;
const HEIGHT = 188;
const TOP = 12;
const BASELINE = 176;

const axisMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 2,
  }).format(value);

export function ValueChart({
  title,
  points,
  description,
  periodLabel,
  variant = 'bar',
  bucket = 'day',
  dayRanges,
  emptyMessage = 'No order value in this period.',
}: {
  title: string;
  points: ValuePoint[];
  description: string;
  periodLabel?: string;
  variant?: 'bar' | 'area';
  bucket?: ValueBucket;
  dayRanges?: number[];
  emptyMessage?: string;
}) {
  const id = useId();
  const [range, setRange] = useState(dayRanges?.[dayRanges.length - 1]);
  const [selectedDate, setSelectedDate] = useState('');
  const data = range ? points.slice(-range) : points;
  const chosenIndex = data.findIndex((point) => point.date === selectedDate);
  const index = chosenIndex < 0 ? Math.max(0, data.length - 1) : chosenIndex;
  const selected = data[index];
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const hasValue = data.some((point) => point.value > 0);
  const max = valueAxisMaximum(data.map((point) => point.value));
  const slot = WIDTH / Math.max(data.length, 1);
  const x = (position: number) => slot * (position + 0.5);
  const y = (value: number) => BASELINE - (value / max) * (BASELINE - TOP);
  const line = data
    .map((point, position) => `${x(position)},${y(point.value)}`)
    .join(' ');
  const labelIndexes = [
    ...new Set(
      Array.from({ length: Math.min(data.length, 4) }, (_, i) =>
        Math.round(
          (i * (data.length - 1)) / Math.max(Math.min(data.length, 4) - 1, 1)
        )
      )
    ),
  ];
  const period = range ? `Last ${range} days` : periodLabel;
  const select = (position: number) => {
    if (data.length)
      setSelectedDate(
        data[Math.max(0, Math.min(data.length - 1, position))].date
      );
  };
  const selectAtPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    select(
      Math.floor(((event.clientX - bounds.left) / bounds.width) * data.length)
    );
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const positions: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      Home: 0,
      End: data.length - 1,
    };
    const next = positions[event.key];
    if (next !== undefined) {
      event.preventDefault();
      select(next);
    }
  };

  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={`${id}-title`}
            className="text-base font-semibold text-pf-text"
          >
            {title}
          </h2>
          {period && <p className="mt-1 text-sm text-pf-muted">{period}</p>}
        </div>
        {dayRanges && (
          <div
            className="flex shrink-0 gap-1 rounded-lg border border-pf-line bg-pf-canvas p-1"
            role="group"
            aria-label={`${title} period`}
          >
            {dayRanges.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={range === days}
                onClick={() => {
                  setRange(days);
                  setSelectedDate('');
                }}
                className={`min-h-11 rounded-md px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-pf-accent ${range === days ? 'bg-pf-accent-bg text-pf-accent' : 'text-pf-muted hover:text-pf-text'}`}
              >
                {days} days
              </button>
            ))}
          </div>
        )}
      </div>
      <p
        className="mt-3 break-words text-2xl font-semibold tabular-nums tracking-tight text-pf-text"
        data-chart-total
      >
        {formatMoney(total)}
      </p>
      <p className="mt-1 text-sm text-pf-muted">{description}</p>

      {hasValue ? (
        <>
          <div className="mt-5 flex gap-2">
            <div
              className="relative h-[188px] w-12 shrink-0 text-xs tabular-nums text-pf-muted sm:w-14"
              aria-hidden="true"
            >
              {[4, 3, 2, 1, 0].map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 -translate-y-1/2"
                  style={{ top: `${(y((max * tick) / 4) / HEIGHT) * 100}%` }}
                >
                  {axisMoney((max * tick) / 4)}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div
                role="slider"
                tabIndex={0}
                aria-label={`Select ${bucket} in ${title.toLowerCase()}`}
                aria-valuemin={1}
                aria-valuemax={data.length}
                aria-valuenow={index + 1}
                aria-valuetext={`${valueDateLabel(selected.date, bucket, true)}: ${formatMoney(selected.value)}`}
                aria-orientation="horizontal"
                aria-describedby={`${id}-hint`}
                onKeyDown={onKeyDown}
                onPointerMove={(event) => {
                  if (event.pointerType === 'mouse') selectAtPointer(event);
                }}
                onPointerDown={(event) => {
                  selectAtPointer(event);
                  event.currentTarget.focus({ preventScroll: true });
                }}
                className="relative h-[188px] cursor-crosshair rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pf-accent"
                style={{ touchAction: 'pan-y' }}
              >
                <svg
                  viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id={`${id}-area`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-pf-accent)"
                        stopOpacity=".3"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-pf-accent)"
                        stopOpacity=".015"
                      />
                    </linearGradient>
                    <linearGradient
                      id={`${id}-bar`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="var(--color-pf-accent)" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3, 4].map((tick) => (
                    <line
                      key={tick}
                      x1="0"
                      x2={WIDTH}
                      y1={y((max * tick) / 4)}
                      y2={y((max * tick) / 4)}
                      stroke="var(--color-pf-line)"
                      strokeDasharray={tick ? '3 5' : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  <rect
                    x={slot * index}
                    y={TOP}
                    width={slot}
                    height={BASELINE - TOP}
                    fill="var(--color-pf-accent)"
                    opacity=".055"
                  />
                  {variant === 'area' ? (
                    <>
                      <polygon
                        points={`${x(0)},${BASELINE} ${line} ${x(data.length - 1)},${BASELINE}`}
                        fill={`url(#${id}-area)`}
                      />
                      <polyline
                        points={line}
                        fill="none"
                        stroke="var(--color-pf-accent)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <line
                        x1={x(index)}
                        x2={x(index)}
                        y1={TOP}
                        y2={BASELINE}
                        stroke="var(--color-pf-accent)"
                        strokeDasharray="3 4"
                        opacity=".65"
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  ) : (
                    data.map((point, position) => (
                      <rect
                        key={point.date}
                        x={x(position) - Math.min(slot * 0.64, 80) / 2}
                        y={y(point.value)}
                        width={Math.min(slot * 0.64, 80)}
                        height={Math.max(0, BASELINE - y(point.value))}
                        rx="4"
                        fill={
                          position === index
                            ? `url(#${id}-bar)`
                            : 'var(--color-pf-accent)'
                        }
                        opacity={position === index ? 1 : 0.6}
                      />
                    ))
                  )}
                </svg>
                {variant === 'area' && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pf-surface bg-pf-accent"
                    style={{
                      left: `${(x(index) / WIDTH) * 100}%`,
                      top: `${(y(selected.value) / HEIGHT) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div
                className={`mt-1 flex gap-1 text-xs tabular-nums text-pf-muted ${data.length === 1 ? 'justify-center' : 'justify-between'}`}
                aria-hidden="true"
              >
                {labelIndexes.map((position) => (
                  <span key={data[position].date}>
                    {valueDateLabel(data[position].date, bucket)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex min-w-0 items-center justify-between gap-2 rounded-lg border border-pf-line bg-pf-canvas px-3 py-2">
            <div className="min-w-0" data-chart-selection>
              <p className="text-xs text-pf-muted">
                {valueDateLabel(selected.date, bucket, true)}
              </p>
              <p className="break-words text-lg font-semibold tabular-nums text-pf-accent">
                {formatMoney(selected.value)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                aria-label={`Previous ${bucket}`}
                disabled={index === 0}
                onClick={() => select(index - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-pf-line text-pf-secondary hover:bg-pf-raised disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pf-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Next ${bucket}`}
                disabled={index === data.length - 1}
                onClick={() => select(index + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-pf-line text-pf-secondary hover:bg-pf-raised disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pf-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p id={`${id}-hint`} className="mt-2 text-xs text-pf-muted">
            Hover or tap to inspect. Use arrow keys to move between{' '}
            {bucket === 'day' ? 'days' : 'months'}.
          </p>
        </>
      ) : (
        <p className="mt-5 flex min-h-32 items-center justify-center rounded-lg border border-dashed border-pf-line px-4 text-center text-sm text-pf-muted">
          {emptyMessage}
        </p>
      )}

      {data.length > 0 && (
        <details className="mt-3 border-t border-pf-line text-sm">
          <summary className="min-h-11 cursor-pointer py-3 text-pf-muted hover:text-pf-text">
            {bucket === 'day' ? 'Daily values' : 'Monthly values'}
          </summary>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                {title}: exact {bucket === 'day' ? 'daily' : 'monthly'} values
              </caption>
              <thead>
                <tr className="text-pf-muted">
                  <th scope="col" className="py-2 font-medium">
                    {bucket === 'day' ? 'Date' : 'Month'}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Order value
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((point) => (
                  <tr key={point.date} className="border-t border-pf-line">
                    <th scope="row" className="py-2 font-normal">
                      {valueDateLabel(point.date, bucket, true)}
                    </th>
                    <td className="py-2 text-right tabular-nums">
                      {formatMoney(point.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
