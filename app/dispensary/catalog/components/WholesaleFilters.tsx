'use client';
import type { FilterState } from '@/lib/catalog-filters';
export function WholesaleFilters({
  filters,
  onChange,
  growers,
  hideGrower = false,
}: {
  filters: FilterState;
  onChange: (value: FilterState) => void;
  growers: { id: string; name: string }[];
  hideGrower?: boolean;
}) {
  const select =
    'min-h-11 min-w-0 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-sm';
  return (
    <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!filters.inStock}
          onChange={(event) =>
            onChange({ ...filters, inStock: event.target.checked })
          }
        />
        In stock
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!filters.hasLabs}
          onChange={(event) =>
            onChange({ ...filters, hasLabs: event.target.checked })
          }
        />
        Has lab results
      </label>
      <select
        aria-label="Strain type"
        value={filters.strainType || ''}
        onChange={(event) =>
          onChange({ ...filters, strainType: event.target.value })
        }
        className={select}
      >
        <option value="">All strain types</option>
        <option value="INDICA">Indica</option>
        <option value="SATIVA">Sativa</option>
        <option value="HYBRID">Hybrid</option>
        <option value="INDICA_DOM_HYBRID">Indica-dominant hybrid</option>
        <option value="SATIVA_DOM_HYBRID">Sativa-dominant hybrid</option>
      </select>
      {!hideGrower && (
        <select
          aria-label="Grower"
          value={filters.growerId || ''}
          onChange={(event) =>
            onChange({ ...filters, growerId: event.target.value })
          }
          className={select}
        >
          <option value="">All growers</option>
          {growers.map((grower) => (
            <option key={grower.id} value={grower.id}>
              {grower.name}
            </option>
          ))}
        </select>
      )}
      <select
        aria-label="Price unit"
        value={filters.priceUnit || ''}
        onChange={(event) =>
          onChange({
            ...filters,
            priceUnit: event.target.value,
            priceRanges: [],
          })
        }
        className={select}
      >
        <option value="">Choose price unit</option>
        {['gram', 'lb', 'ounce', 'unit', 'each', 'pack'].map((unit) => (
          <option key={unit} value={unit}>
            Price per {unit}
          </option>
        ))}
      </select>
      {filters.priceRanges.length > 0 && !filters.priceUnit && (
        <p role="status" className="text-sm text-pf-warning">
          Choose a unit to compare prices.
        </p>
      )}
    </div>
  );
}
