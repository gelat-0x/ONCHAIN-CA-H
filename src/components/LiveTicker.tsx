import type { TickerItem } from '../types';
import { formatPrice } from './charts/chartTheme';
import { TokenLogo } from './TokenLogo';

interface LiveTickerProps {
  items: TickerItem[];
}

function formatTickerPrice(item: TickerItem): string {
  const kind = item.type === 'stablecoin' ? 'stablecoin' : 'volatile';
  return formatPrice(item.price, kind);
}

function directionFromChange(pct: number | undefined): 'up' | 'down' | 'flat' {
  if (pct == null || !Number.isFinite(pct)) return 'flat';
  if (pct > 0) return 'up';
  if (pct < 0) return 'down';
  return 'flat';
}

function arrow(dir: 'up' | 'down' | 'flat') {
  if (dir === 'up') return <span className="ticker-arrow ticker-arrow--up">↑</span>;
  if (dir === 'down') return <span className="ticker-arrow ticker-arrow--down">↓</span>;
  return <span className="ticker-arrow ticker-arrow--flat">→</span>;
}

export function LiveTicker({ items }: LiveTickerProps) {
  const visible = items.filter((item) => item.type !== 'metric' && item.type !== 'stablecoin');
  const doubled = [...visible, ...visible];

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((item, i) => {
          const dir = directionFromChange(item.change24h);
          const changeClass =
            dir === 'up' ? 'ticker-change--up' : dir === 'down' ? 'ticker-change--down' : 'ticker-change--flat';

          return (
            <span key={`${item.symbol}-${i}`} className="ticker-item tabular-nums">
              <TokenLogo
                symbol={item.logoSymbol ?? item.symbol}
                size="xs"
                className="ticker-token-logo"
              />
              <span className="symbol">{item.symbol}</span>
              {formatTickerPrice(item)}
              {item.change24h != null && (
                <span className={`ticker-change ${changeClass}`}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                </span>
              )}
              {arrow(dir)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
