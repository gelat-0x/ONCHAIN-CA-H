import type { TokenMarketData } from '../../types';
import { formatPrice } from './chartTheme';
import { SimpleBarChart } from './SimpleBarChart';
import { chartBarTarget, downsampleChartPoints, chartRangeLabel } from '../../lib/chartDownsample';

interface LivePriceChartProps {
  token: TokenMarketData;
  range?: string;
}

export function LivePriceChart({ token, range = '30' }: LivePriceChartProps) {
  const isStable = token.type === 'stablecoin';
  const raw = (token.history ?? [])
    .map((h) => ({ value: h.price }))
    .filter((p) => Number.isFinite(p.value));

  const target = chartBarTarget(range, raw.length);
  const primary = downsampleChartPoints(raw, target);

  const prices = primary.map((p) => p.value);
  const min = prices.length ? Math.min(...prices) : token.price;
  const max = prices.length ? Math.max(...prices) : token.price;

  const yMin = isStable ? 0.998 : undefined;
  const yMax = isStable ? 1.002 : undefined;

  const lineColor = token.color && token.color !== '#ffffff' ? token.color : '#ffffff';
  const hasLiveHistory = primary.length >= 2;

  return (
    <div className="live-chart">
      <div className="live-chart__head">
        <div>
          <div className="live-chart__symbol" style={{ color: lineColor }}>{token.symbol}</div>
          <div className="live-chart__name">{token.name}</div>
        </div>
        <div className="live-chart__price-block">
          <div className="live-chart__price tabular-nums">{formatPrice(token.price, token.type)}</div>
          <div className={`live-chart__change tabular-nums ${(token.change24h ?? 0) >= 0 ? 'val-green' : 'val-red'}`}>
            {(token.change24h ?? 0) >= 0 ? '+' : ''}{(token.change24h ?? 0).toFixed(2)}% 24h
          </div>
        </div>
      </div>

      <div className="live-chart__canvas">
        {hasLiveHistory ? (
          <SimpleBarChart
            key={`${token.id}-${range}-${primary.length}-${primary[primary.length - 1]?.value}`}
            data={primary}
            height={320}
            color={lineColor}
            yMin={yMin}
            yMax={yMax}
          />
        ) : (
          <div className="live-chart__empty">No chart data, check backend is running (npm run dev:all)</div>
        )}
      </div>

      {hasLiveHistory && (
        <div className="live-chart__foot">
          <span className="live-chart__range tabular-nums">
            {formatPrice(min, token.type)}, {formatPrice(max, token.type)}
          </span>
          <span className="live-chart__range-label">{chartRangeLabel(range)}</span>
        </div>
      )}
    </div>
  );
}
