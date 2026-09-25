import type { TokenMarketData } from '../types';
import { formatChange, formatPrice } from './charts/chartTheme';
import { MiniSparkline } from './charts/MiniSparkline';

interface TokenPriceGridProps {
  tokens: TokenMarketData[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TokenPriceGrid({ tokens, selectedId, onSelect }: TokenPriceGridProps) {
  return (
    <div className="token-grid">
      {tokens.map((t) => {
        const active = t.id === selectedId;
        const hist = (t.history ?? []).slice(-32);
        const spark = hist.map((h) => h.price);
        const series = hist.map((h) => ({
          ts: h.ts ?? new Date(h.date).getTime(),
          value: h.price,
        }));
        return (
          <button
            key={t.id}
            type="button"
            className={`token-card cult-shadow ${active ? 'token-card--active' : ''}`}
            onClick={() => onSelect(t.id)}
          >
            <div className="token-card__top">
              <span className="token-card__symbol" style={{ color: t.color }}>{t.symbol}</span>
              <span className={`token-card__badge token-card__badge--${t.type}`}>
                {t.type === 'stablecoin' ? 'STABLE' : t.type === 'governance' ? 'GOV' : 'VOLATILE'}
              </span>
            </div>
            <div className="token-card__price tabular-nums">{formatPrice(t.price, t.type)}</div>
            <div className={`token-card__change tabular-nums ${(t.change24h ?? 0) >= 0 ? 'val-green' : 'val-red'}`}>
              {formatChange(t.change24h ?? 0)}
            </div>
            {spark.length > 2 && (
              <div className="token-card__spark">
                <MiniSparkline data={spark} series={series} color={t.color} theme="terminal" height={32} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
