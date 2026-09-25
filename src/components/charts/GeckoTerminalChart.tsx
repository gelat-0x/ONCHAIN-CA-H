import type { TokenMarketData } from '../../types';
import type { ChartRangeId } from '../../../shared/constants/chartRanges';
import {
  buildGeckoTerminalEmbedUrl,
  geckoTerminalEmbedForToken,
  geckoTerminalPageUrl,
} from '../../../shared/constants/geckoTerminal';
import { formatPrice } from './chartTheme';
import { chartRangeLabel } from '../../lib/chartDownsample';

interface GeckoTerminalChartProps {
  token: TokenMarketData;
  range: ChartRangeId;
}

export function GeckoTerminalChart({ token, range }: GeckoTerminalChartProps) {
  const embed = geckoTerminalEmbedForToken(token.id);

  if (!embed) {
    return (
      <div className="live-chart">
        <div className="live-chart__empty">No GeckoTerminal chart configured for {token.symbol}.</div>
      </div>
    );
  }

  const src = buildGeckoTerminalEmbedUrl(embed, range);
  const pageUrl = geckoTerminalPageUrl(embed);
  const iframeTitle = embed.iframeTitle ?? `${embed.title}, live chart`;
  const lineColor = token.color && token.color !== '#ffffff' ? token.color : '#ffffff';

  return (
    <div className="live-chart live-chart--gecko">
      <div className="live-chart__head">
        <div>
          <div className="live-chart__symbol" style={{ color: lineColor }}>
            {token.symbol}
          </div>
          <div className="live-chart__name">
            {embed.title} · GeckoTerminal · {chartRangeLabel(range)}
          </div>
        </div>
        <div className="live-chart__price-block">
          <div className="live-chart__price tabular-nums">{formatPrice(token.price, token.type)}</div>
          <div
            className={`live-chart__change tabular-nums ${(token.change24h ?? 0) >= 0 ? 'val-green' : 'val-red'}`}
          >
            {(token.change24h ?? 0) >= 0 ? '+' : ''}
            {(token.change24h ?? 0).toFixed(2)}% 24h
          </div>
        </div>
      </div>

      <div className="gecko-terminal-wrap">
        <iframe
          key={src}
          id="geckoterminal-embed"
          className="gecko-terminal-embed"
          title={iframeTitle}
          src={src}
          frameBorder={0}
          allow="clipboard-write"
          allowFullScreen
        />
      </div>

      <div className="live-chart__foot">
        <span className="live-chart__source">Live · GeckoTerminal</span>
        <a
          className="live-chart__external"
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on GeckoTerminal ↗
        </a>
      </div>
    </div>
  );
}
