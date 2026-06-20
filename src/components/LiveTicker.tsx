import type { TickerItem } from '../types';
import { formatPrice } from './charts/chartTheme';

interface LiveTickerProps {
  items: TickerItem[];
}

function formatTickerPrice(item: TickerItem): string {
  if (item.symbol === 'TVL') return `$${(item.price / 1_000_000).toFixed(1)}M`;
  return formatPrice(item.price, item.type === 'stablecoin' ? 'stablecoin' : 'volatile');
}

function arrow(change: TickerItem['change']) {
  if (change === 'up') return <span className="arrow-up">↑</span>;
  if (change === 'down') return <span className="arrow-down">↓</span>;
  return <span className="arrow-flat">→</span>;
}

export function LiveTicker({ items }: LiveTickerProps) {
  const doubled = [...items, ...items];

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={`${item.symbol}-${i}`} className="ticker-item tabular-nums">
            <span className="symbol">{item.symbol}</span>
            {formatTickerPrice(item)}
            {item.change24h != null && item.type !== 'metric' && (
              <span className={`ticker-change ${item.change24h >= 0 ? 'ticker-change--up' : 'ticker-change--down'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </span>
            )}
            {arrow(item.change)}
          </span>
        ))}
      </div>
    </div>
  );
}
