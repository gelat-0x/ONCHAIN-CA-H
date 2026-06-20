import { useMemo, useState } from 'react';
import type { PoolData } from '../types';

type SortKey = 'tvl' | 'debt' | 'volume' | 'partner';

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface PoolsTableProps {
  pools: PoolData[];
  totalTvl: number;
}

export function PoolsTable({ pools, totalTvl }: PoolsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tvl');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const list = [...pools];
    list.sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === 'tvl') { av = a.tvl; bv = b.tvl; }
      if (sortKey === 'debt') { av = a.pegKeeperDebt; bv = b.pegKeeperDebt; }
      if (sortKey === 'volume') { av = a.volume24h; bv = b.volume24h; }
      if (sortKey === 'partner') {
        return sortAsc
          ? a.partner.localeCompare(b.partner)
          : b.partner.localeCompare(a.partner);
      }
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [pools, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortMark = (key: SortKey) => (sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '');

  return (
    <div className="table-wrap pools-table">
      <div className="table-header-bar">
        <span className="pools-table__hint">
          All frxUSD PegKeeper pools · sorted by {sortKey.toUpperCase()}
        </span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Partner stablecoin</th>
            <th onClick={() => handleSort('partner')}>Protocol{sortMark('partner')}</th>
            <th onClick={() => handleSort('tvl')}>Pool TVL{sortMark('tvl')}</th>
            <th>Share</th>
            <th onClick={() => handleSort('debt')}>frxUSD debt{sortMark('debt')}</th>
            <th onClick={() => handleSort('volume')}>24h vol{sortMark('volume')}</th>
            <th>Status</th>
            <th>Since</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((pool, i) => {
            const share = totalTvl > 0 ? (pool.tvl / totalTvl) * 100 : 0;
            return (
              <tr key={pool.id}>
                <td className="tabular-nums val-muted">{i + 1}</td>
                <td className="pools-table__coin">{pool.stablecoin ?? pool.name.split('/')[1]?.trim()}</td>
                <td>{pool.partner}</td>
                <td className="tabular-nums">{fmtUsd(pool.tvl)}</td>
                <td className="tabular-nums val-muted">{share.toFixed(1)}%</td>
                <td className="tabular-nums">{fmtUsd(pool.pegKeeperDebt)}</td>
                <td className="tabular-nums">{fmtUsd(pool.volume24h)}</td>
                <td>
                  <span className={`pill pill--${pool.status.toLowerCase()}`}>{pool.status}</span>
                </td>
                <td className="val-muted">{pool.since ?? '—'}</td>
                <td>
                  <a href={pool.curveUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
                    Curve ↗
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
