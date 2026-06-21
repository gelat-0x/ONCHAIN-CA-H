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
        const spark = (t.history ?? []).slice(-24).map((h) => h.price);
        const change = t.change24h ?? 0;
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
            <div className={`token-card__change tabular-nums ${change >= 0 ? 'val-green' : 'val-red'}`}>
              {formatChange(change)}
            </div>
            {spark.length > 2 && (
              <div className="token-card__spark">
                <MiniSparkline data={spark} color={t.color} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
