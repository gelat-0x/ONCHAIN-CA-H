import type { PoolFilterKey, PoolSortKey } from '../lib/poolFilters';

interface PoolFilterBarProps {
  filter: PoolFilterKey;
  sort: PoolSortKey;
  total: number;
  shown: number;
  onFilterChange: (f: PoolFilterKey) => void;
  onSortChange: (s: PoolSortKey) => void;
}

const FILTERS: { key: PoolFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'boosted', label: 'Boosted' },
  { key: 'high-apr', label: 'APR > 10%' },
  { key: 'on-curve', label: 'On Curve' },
  { key: 'tvl100k', label: 'TVL > $100K' },
  { key: 'active', label: 'Active' },
  { key: 'alert', label: 'Low TVL' },
];

const SORTS: { key: PoolSortKey; label: string }[] = [
  { key: 'tvl', label: 'TVL' },
  { key: 'apr', label: 'APR' },
  { key: 'volume', label: 'Volume' },
  { key: 'boost', label: 'Only boost' },
];

export function PoolFilterBar({
  filter,
  sort,
  total,
  shown,
  onFilterChange,
  onSortChange,
}: PoolFilterBarProps) {
  return (
    <div className="pool-filter-bar">
      <div className="pool-filter-bar__left">
        <span className="pool-filter-bar__count tabular-nums">
          {shown} / {total}
        </span>
        <div className="pool-filter-bar__chips" role="group" aria-label="Filter pools">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => onFilterChange(key)}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pool-sort-seg" role="group" aria-label="Sort pools">
        <span className="pool-sort-seg__label">Sort</span>
        {SORTS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`pool-sort-seg__btn ${sort === key ? 'active' : ''}`}
            onClick={() => onSortChange(key)}
            aria-pressed={sort === key}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
