import { Link } from 'react-router-dom';
import { ChainDistributionChart } from './charts/ChainDistributionChart';
import type { ChainDistribution } from '../types';

interface FrxUsdCardProps {
  chainDistribution: ChainDistribution[];
  cached?: boolean;
  marketCap?: number;
  totalVolume?: number;
}

const SEGMENTS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 12V4l6-2 6 2v8l-6 2-6-2z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 2v12M2 4l6 2 6-2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    name: 'Dynamic Metrics Open',
    desc: 'Live onchain metrics and market pulse at show open.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 6h12M5 9h6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    name: 'General News Roundup',
    desc: 'Macro, crypto, and policy headlines that matter.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2l6 3v5c0 2.5-2.5 4-6 4S2 12.5 2 10V5l6-3z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    name: 'FUD Watch',
    desc: 'Separating signal from noise in the fear cycle.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 13V6l5-3 5 3v7" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 13V9h4v4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    name: 'DeFi Report / Farming of the Week',
    desc: 'Yield opportunities and protocol deep dives.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
    name: 'Charmander Segment',
    desc: 'Community favorite — unfiltered takes.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 4h8v8H4z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    name: 'Frax News & Ecosystem Update',
    desc: 'frxUSD, FXS, and Frax ecosystem developments.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M9 2L4 9h4l-1 5 5-7H8l1-5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
    name: 'Alpha Call',
    desc: 'High-conviction trade ideas and early signals.',
  },
];

export function FrxUsdCard({ chainDistribution, cached, marketCap = 116793422, totalVolume }: FrxUsdCardProps) {
  const mcM = Math.round((marketCap || 116793422) / 1e6);
  const volM = totalVolume ? Math.round(totalVolume / 1e6) : 500;
  return (
    <div className="frxusd-card">
      <div>
        <h2 className="section-heading">frxUSD — The Digital Dollar</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 520 }}>
          A payment stablecoin backed by real-world assets. Transparent reserves,
          redeemable onchain, and built to work everywhere in DeFi — from Curve pools
          to institutional settlement rails.
        </p>
        {cached && <span className="cached-label">⚠ Cached</span>}

        <div className="frxusd-facts">
          <div>
            <div className="fact-label">Backed by</div>
            <div className="fact-value">BlackRock BUIDL + U.S. Treasuries</div>
          </div>
          <div>
            <div className="fact-label">Market Cap</div>
            <div className="fact-value">~${mcM}M</div>
          </div>
          <div>
            <div className="fact-label">Chains</div>
            <div className="fact-value">Ethereum, Fraxtal, Sonic, Base, Polygon, Solana +more</div>
          </div>
          <div>
            <div className="fact-label">PegKeeper Partners</div>
            <div className="fact-value">17+ protocols</div>
          </div>
          <div>
            <div className="fact-label">Volume Processed</div>
            <div className="fact-value">${volM}M+ (4 months)</div>
          </div>
          <div>
            <div className="fact-label">Proof of Reserves</div>
            <div className="fact-value">Chaos Labs</div>
          </div>
        </div>
      </div>

      <ChainDistributionChart data={chainDistribution} />
    </div>
  );
}

export function ShowSection() {
  return (
    <div className="show-split">
      <div className="episode-card">
        <div className="episode-thumb">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
            <circle cx="24" cy="24" r="22" stroke="var(--faint)" strokeWidth="1" />
            <path d="M20 16l16 8-16 8V16z" fill="var(--accent)" />
          </svg>
        </div>
        <div className="episode-body">
          <h3 className="episode-title">Episode 24 — PegKeeper Wars</h3>
          <p className="episode-meta">Jun 14, 2026 · 1h 42m</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
            Deep dive into frxUSD PegKeeper mechanics, new partner integrations,
            and the $500M volume milestone.
          </p>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Watch Now ↗
          </a>
        </div>
      </div>

      <div>
        <h3 className="section-heading" style={{ fontSize: 20, marginBottom: 16 }}>Show Segments</h3>
        {SEGMENTS.map((seg) => (
          <div key={seg.name} className="segment-row">
            <div className="segment-icon">{seg.icon}</div>
            <div>
              <div className="segment-name">{seg.name}</div>
              <div className="segment-desc">{seg.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobileWatchCta() {
  return (
    <div className="mobile-watch-cta">
      <Link to="/show" className="btn btn-primary">
        Watch Show
      </Link>
    </div>
  );
}
