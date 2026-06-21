import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import type { TokenMarketData } from '../../types';
import { baseChartOptions, formatPrice } from './chartTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  annotationPlugin,
);

interface LivePriceChartProps {
  token: TokenMarketData;
  compare?: TokenMarketData | null;
}

export function LivePriceChart({ token, compare }: LivePriceChartProps) {
  const isStable = token.type === 'stablecoin';
  const history = token.history ?? [];
  const labels = history.map((h) => h.date);

  const datasets = [
    {
      label: token.symbol,
      data: history.map((h) => h.price),
      borderColor: token.color,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: isStable,
      backgroundColor: isStable ? `${token.color}18` : 'transparent',
      tension: 0.25,
    },
  ];

  const compareHistory = compare?.history ?? [];
  if (compare && compareHistory.length) {
    datasets.push({
      label: compare.symbol,
      data: compareHistory.map((h) => h.price),
      borderColor: compare.color,
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: false,
      backgroundColor: 'transparent',
      tension: 0.25,
    });
  }

  const prices = history.map((h) => h.price);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  const yMin = isStable ? 0.995 : undefined;
  const yMax = isStable ? 1.005 : undefined;
  const yFormat = (v: number) => formatPrice(v, token.type);

  const options = {
    ...baseChartOptions({ yFormat, yMin, yMax, showLegend: !!compare }),
    plugins: {
      ...baseChartOptions({ yFormat, yMin, yMax, showLegend: !!compare }).plugins,
      annotation: isStable
        ? {
            annotations: {
              pegLine: {
                type: 'line' as const,
                yMin: 1.0,
                yMax: 1.0,
                borderColor: 'rgba(255,255,255,0.35)',
                borderWidth: 1,
                borderDash: [6, 4],
              },
            },
          }
        : undefined,
    },
  };

  const rangeLabel = history.length > 1
    ? `${formatPrice(min, token.type)} — ${formatPrice(max, token.type)}`
    : '—';

  const change = token.change24h ?? 0;

  return (
    <div className="live-chart cult-shadow-deep">
      <div className="live-chart__head">
        <div>
          <div className="live-chart__symbol" style={{ color: token.color }}>{token.symbol}</div>
          <div className="live-chart__name">{token.name}</div>
        </div>
        <div className="live-chart__price-block">
          <div className="live-chart__price tabular-nums">{formatPrice(token.price, token.type)}</div>
          <div className={`live-chart__change tabular-nums ${change >= 0 ? 'val-green' : 'val-red'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}% 24h
          </div>
        </div>
      </div>

      <div className="live-chart__canvas">
        <Line data={{ labels, datasets }} options={options} />
      </div>

      <div className="live-chart__foot">
        <span className="live-chart__range">{rangeLabel}</span>
        <span className="live-chart__source">CoinGecko · live</span>
      </div>
    </div>
  );
}
