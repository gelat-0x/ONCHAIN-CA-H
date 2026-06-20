import { useMemo, useState } from 'react';
import type { PartnerProtocol } from '../types';
import { useIntersection } from '../hooks/useIntersection';

interface PartnersTableProps {
  partners: PartnerProtocol[];
}

type SortKey = 'protocol' | 'tvl' | 'apr' | 'status';
type FilterKey = 'ALL' | 'ACTIVE' | 'ALERT';

function parseTvl(tvl: string): number {
  if (tvl === '—') return 0;
  const match = tvl.match(/\$?([\d.]+)(M|K)?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (match[2] === 'M') return num * 1_000_000;
  if (match[2] === 'K') return num * 1_000;
  return num;
}

function parseApr(apr: string): number {
  if (apr === '—') return 0;
  return parseFloat(apr.replace(/[^0-9.]/g, '')) || 0;
}

function TableRow({ partner, index }: { partner: PartnerProtocol; index: number }) {
  const { ref, visible } = useIntersection<HTMLTableRowElement>(0.05);

  return (
    <tr
      ref={ref}
      className={`fade-in ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <td>{partner.protocol}</td>
      <td>{partner.pool}</td>
      <td>{partner.tvl}</td>
      <td>{partner.apr}</td>
      <td>{partner.chain}</td>
      <td>
        <span className={`status-badge status-${partner.status.toLowerCase()}`}>
          {partner.status}
        </span>
      </td>
      <td>{partner.since}</td>
    </tr>
  );
}

export function PartnersTable({ partners }: PartnersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tvl');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const sorted = useMemo(() => {
    let list = [...partners];
    if (filter !== 'ALL') {
      list = list.filter((p) => p.status === filter);
    }
    list.sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === 'protocol') {
        return sortAsc ? a.protocol.localeCompare(b.protocol) : b.protocol.localeCompare(a.protocol);
      }
      if (sortKey === 'tvl') { av = parseTvl(a.tvl); bv = parseTvl(b.tvl); }
      if (sortKey === 'apr') { av = parseApr(a.apr); bv = parseApr(b.apr); }
      if (sortKey === 'status') {
        return sortAsc ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [partners, sortKey, sortAsc, filter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="table-wrap">
      <div className="table-header-bar">
        <div className="table-filters">
          {(['ALL', 'ACTIVE', 'ALERT'] as FilterKey[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--faint)' }}>Last updated: {now}</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('protocol')}>Protocol {sortKey === 'protocol' ? (sortAsc ? '↑' : '↓') : ''}</th>
            <th>Pool</th>
            <th onClick={() => handleSort('tvl')}>TVL {sortKey === 'tvl' ? (sortAsc ? '↑' : '↓') : ''}</th>
            <th onClick={() => handleSort('apr')}>APR {sortKey === 'apr' ? (sortAsc ? '↑' : '↓') : ''}</th>
            <th>Chain</th>
            <th onClick={() => handleSort('status')}>Status {sortKey === 'status' ? (sortAsc ? '↑' : '↓') : ''}</th>
            <th>Since</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <TableRow key={p.protocol} partner={p} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
