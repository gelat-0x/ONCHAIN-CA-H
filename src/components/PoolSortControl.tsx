import type { PoolSortKey } from '../lib/poolFilters';

interface PoolSortControlProps {
  sort: PoolSortKey;
  onSortChange: (s: PoolSortKey) => void;
}

const SORTS: { key: PoolSortKey; label: string }[] = [
  { key: 'apr', label: 'APR' },
  { key: 'tvl', label: 'TVL' },
  { key: 'volume', label: 'Volume' },
  { key: 'since', label: 'Age' },
];

export function PoolSortControl({ sort, onSortChange }: PoolSortControlProps) {
  return (
    <div className="pool-sort">
      <span className="pool-sort__label">Sort by</span>
      <div className="pool-sort__seg" role="group" aria-label="Sort pools">
        {SORTS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`pool-sort__btn ${sort === key ? 'pool-sort__btn--active' : ''}`}
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
