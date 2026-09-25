import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { PieChart, Pie, Cell, Sector } from "recharts";
import {
  Shield, ChevronDown, ChevronUp, ExternalLink, RefreshCw,
} from "lucide-react";
import { useFrxUsdLive } from "@learn/hooks/useFrxUsdLive";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONSTANTS & TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ASSET_COLORS: Record<string, string> = {
  BUIDL: "#2A2A2E",
  USTB: "#D4A843",
  USCC: "#6B8F71",
  WTGXX: "#4A90D9",
  USDB: "#4CAF50",
  USDC: "#B0B0B0",
  EREBOR_USD: "#5C7A6B",
  Other: "#B0B0B0",
};

const ASSET_GLOW: Record<string, string> = {
  BUIDL: "rgba(42,42,46,0.5)",
  USTB: "rgba(212,168,67,0.4)",
  USCC: "rgba(107,143,113,0.35)",
  WTGXX: "rgba(74,144,217,0.4)",
  USDB: "rgba(76,175,80,0.4)",
  USDC: "rgba(176,176,176,0.3)",
  EREBOR_USD: "rgba(92,122,107,0.4)",
  Other: "rgba(176,176,176,0.3)",
};

const FUND_META: Record<string, { name: string; desc: string; details: Record<string, string>; url: string }> = {
  BUIDL: {
    name: "BUIDL",
    desc: "Managed fund backed by U.S. assets.",
    details: { admin: "BlackRock", custodian: "BNY Mellon", agent: "Securitize", auditor: "PwC" },
    url: "https://securitize.io/buidl",
  },
  USTB: {
    name: "USTB",
    desc: "Short-term U.S. Treasury fund from Superstate.",
    details: { admin: "Superstate", custodian: "UMB Financial", agent: "Superstate", auditor: "Ernst & Young" },
    url: "https://superstate.co",
  },
  USCC: {
    name: "USCC",
    desc: "Cash-equivalent reserve asset held in regulated custody.",
    details: { admin: "Reserve manager", custodian: "Regulated custodian", agent: "Transfer agent", auditor: "Independent auditor" },
    url: "https://frax.com/Transparency",
  },
  WTGXX: {
    name: "WTGXX",
    desc: "Government money market fund.",
    details: { admin: "WisdomTree", custodian: "State Street", agent: "WisdomTree", auditor: "KPMG" },
    url: "https://wisdomtree.com",
  },
  USDB: {
    name: "USDB",
    desc: "Backed 1:1 by cash and short-term funds.",
    details: { admin: "Bridge", custodian: "Bridge Financial", agent: "Bridge", auditor: "Deloitte" },
    url: "https://bridge.xyz",
  },
  USDC: {
    name: "USDC",
    desc: "Digital dollar backed 1:1 by cash.",
    details: { admin: "Circle", custodian: "Multiple", agent: "Circle", auditor: "Deloitte" },
    url: "https://circle.com",
  },
  EREBOR_USD: {
    name: "Erebor USD",
    desc: "Segregated FDIC-insured reserve account at Erebor Bank, N.A., backing frxUSD.",
    details: {
      bank: "Erebor Bank, N.A.",
      insurance: "FDIC member bank",
      account: "FBO frxUSD Reserve",
      note: "More reserve details are being added as disclosures become available.",
    },
    url: "https://frax.com/Transparency",
  },
};

interface ReserveAsset {
  ticker: string;
  value: number;        // USD
  pct: number;          // percentage
  color: string;
  glow: string;
}

interface TransparencyData {
  circulation: number;
  reserves: number;
  assets: ReserveAsset[];
  updatedAt: Date;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DEFAULT DATA (from frax.com/Transparency)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const DEFAULT_DATA: TransparencyData = {
  circulation: 133_590_000,
  reserves: 137_280_000,
  assets: [
    { ticker: "USTB", value: 60_030_000, pct: 43.7, color: ASSET_COLORS.USTB, glow: ASSET_GLOW.USTB },
    { ticker: "WTGXX", value: 59_480_000, pct: 43.3, color: ASSET_COLORS.WTGXX, glow: ASSET_GLOW.WTGXX },
    { ticker: "BUIDL", value: 15_610_000, pct: 11.4, color: ASSET_COLORS.BUIDL, glow: ASSET_GLOW.BUIDL },
    { ticker: "USDB", value: 2_000_000, pct: 1.5, color: ASSET_COLORS.USDB, glow: ASSET_GLOW.USDB },
    { ticker: "USDC", value: 166_930, pct: 0.1, color: ASSET_COLORS.USDC, glow: ASSET_GLOW.USDC },
  ],
  updatedAt: new Date(),
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FORMAT HELPERS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function formatCollateralValue(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}m`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}k`;
  return `$${usd.toFixed(0)}`;
}

function displayTicker(ticker: string): string {
  if (ticker === "EREBOR_USD") return "Erebor USD";
  return ticker;
}

function formatPct(pct: number): string {
  if (pct < 0.01) return `${pct.toFixed(4)}%`;
  if (pct < 0.1) return `${pct.toFixed(3)}%`;
  return `${pct.toFixed(1)}%`;
}

export const AnimNum = ({ value, prefix = "$", duration = 1400 }: { value: number; prefix?: string; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(eased * value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value, duration]);

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}m`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toFixed(2);
  };

  return (
    <motion.span ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
      className="font-mono tabular-nums">
      {prefix}{fmt(display)}
    </motion.span>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DONUT CHART
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  const glow = ASSET_GLOW[payload.ticker] || "rgba(255,255,255,0.2)";
  return (
    <g>
      <defs>
        <filter id={`glow-${payload.ticker}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor={glow} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <text x={cx} y={cy - 16} textAnchor="middle" fill="hsl(0,0%,95%)" className="text-sm font-bold">
        {payload.ticker}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(0,0%,70%)" className="text-xs">
        {formatPct(payload.pct)}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="hsl(0,0%,50%)" className="text-[10px]">
        {formatCollateralValue(payload.value)}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
        filter={`url(#glow-${payload.ticker})`} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 1}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.5} />
    </g>
  );
};

const ReserveDonut = ({ assets, activeIndex, setActiveIndex }: {
  assets: ReserveAsset[]; activeIndex: number; setActiveIndex: (i: number) => void;
}) => {
  // Pie segments must reflect EXACT real proportions — no minimum-size flooring.
  const displayAssets = assets.map((a) => ({ ...a, displayValue: a.value }));

  return (
  <div className="flex flex-col items-center">
    <PieChart width={300} height={300}>
      <Pie
        data={displayAssets}
        cx={150}
        cy={150}
        innerRadius={75}
        outerRadius={115}
        dataKey="displayValue"
        onMouseEnter={(_, i) => setActiveIndex(i)}
        animationBegin={200}
        animationDuration={1200}
        animationEasing="ease-out"
        {...({
          activeIndex,
          activeShape: renderActiveShape,
        } as Record<string, unknown>)}
      >
        {displayAssets.map((a, i) => <Cell key={i} fill={a.color} stroke="hsl(0,0%,4%)" strokeWidth={2} />)}
      </Pie>
    </PieChart>
    {/* Legend */}
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3">
      {assets.map((a, i) => (
        <button key={a.ticker} onClick={() => setActiveIndex(i)}
          className={`flex items-center gap-1.5 text-xs transition-all ${activeIndex === i ? "text-[hsl(0,0%,95%)] scale-105" : "text-[hsl(0,0%,50%)]"}`}>
          <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ background: a.color }} />
          {a.ticker}
        </button>
      ))}
    </div>
  </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUPPLY vs BACKING BAR
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const SupplyVsBacking = ({ circulation, reserves, assets }: {
  circulation: number; reserves: number; assets: ReserveAsset[];
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const maxVal = Math.max(circulation, reserves);
  const collateralRatio = ((reserves / circulation) * 100).toFixed(1);

  return (
    <div ref={ref} className="mt-8 space-y-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-[0.15em] text-[hsl(0,0%,50%)] font-medium">More backing than dollars</p>
        <span className="text-xs font-mono text-[hsl(0,0%,70%)]">{collateralRatio}% backed</span>
      </div>
      <p className="text-xs text-[hsl(0,0%,55%)] leading-relaxed -mt-1 mb-2">
        There is more money backing the system than dollars in use.
      </p>

      {/* Circulation bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-[hsl(0,0%,60%)]">Dollars in use</span>
          <span className="text-sm font-mono text-[hsl(0,0%,90%)]">${(circulation / 1_000_000).toFixed(2)}m</span>
        </div>
        <div className="h-3 bg-[hsl(0,0%,10%)] rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }}
            animate={isInView ? { width: `${(circulation / maxVal) * 100}%` } : {}}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-[hsl(0,0%,35%)] to-[hsl(0,0%,50%)]" />
        </div>
      </div>

      {/* Reserves bar (stacked by asset) */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-[hsl(0,0%,60%)]">Backing</span>
          <span className="text-sm font-mono text-[hsl(0,0%,90%)]">${(reserves / 1_000_000).toFixed(2)}m</span>
        </div>
        <div className="h-3 bg-[hsl(0,0%,10%)] rounded-full overflow-hidden flex">
          {assets.map((a, i) => (
            <motion.div key={a.ticker}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${(a.value / maxVal) * 100}%` } : {}}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 + i * 0.08 }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ background: a.color }}
              title={`${a.ticker}: ${formatCollateralValue(a.value)} (${formatPct(a.pct)})`} />
          ))}
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {assets.map((a) => (
            <span key={a.ticker} className="flex items-center gap-1 text-[10px] text-[hsl(0,0%,45%)]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
              {a.ticker}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ASSET CARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const AssetCard = ({ asset }: { asset: ReserveAsset }) => {
  const [open, setOpen] = useState(false);
  const meta = FUND_META[asset.ticker];
  if (!meta) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-[hsl(0,0%,14%)]/40 bg-[hsl(0,0%,7%)]/40 
        shadow-[0_0_24px_rgba(255,255,255,0.03)] hover:shadow-[0_0_36px_rgba(255,255,255,0.06)]
        hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left group">
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 rounded-full" style={{ background: asset.color, boxShadow: `0 0 12px ${asset.glow}` }} />
          <div>
            <span className="text-sm font-semibold text-[hsl(0,0%,95%)]">{displayTicker(asset.ticker)}</span>
            <span className="text-xs text-[hsl(0,0%,50%)] ml-2 hidden sm:inline">{meta.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-[hsl(0,0%,80%)]">{formatCollateralValue(asset.value)}</span>
          <span className="font-mono text-xs text-[hsl(0,0%,50%)]">{formatPct(asset.pct)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-[hsl(0,0%,50%)]" /> : <ChevronDown className="w-4 h-4 text-[hsl(0,0%,50%)]" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-[hsl(0,0%,14%)]/30">
              <p className="text-sm text-[hsl(0,0%,55%)] leading-relaxed mt-4 mb-4">{meta.desc}</p>
              <p className="text-xs text-[hsl(0,0%,45%)] leading-relaxed mb-4 italic">
                More reserve details are being added as disclosures become available.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(meta.details).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)]/60">
                      {key === "agent" ? "Transfer Agent" : key === "admin" ? "Fund Admin" : key.charAt(0).toUpperCase() + key.slice(1)}
                    </p>
                    <p className="text-xs text-[hsl(0,0%,90%)]">{val}</p>
                  </div>
                ))}
              </div>
              <a href={meta.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,95%)] transition-colors inline-flex items-center gap-1">
                Learn more <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TIME AGO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const useTimeAgo = (date: Date) => {
  const [ago, setAgo] = useState("");
  useEffect(() => {
    const update = () => {
      const s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) setAgo(`${s}s ago`);
      else if (s < 3600) setAgo(`${Math.floor(s / 60)}m ago`);
      else setAgo(`${Math.floor(s / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [date]);
  return ago;
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN SECTION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TransparencyReserves = () => {
  const live = useFrxUsdLive();
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  // Map live assets to the visualisation shape (color + glow).
  const data: TransparencyData = {
    circulation: live.circulation,
    reserves: live.reserves,
    assets: live.assets.map((a) => ({
      ticker: a.ticker,
      value: a.value,
      pct: a.pct,
      color: ASSET_COLORS[a.ticker] ?? ASSET_COLORS.Other,
      glow: ASSET_GLOW[a.ticker] ?? ASSET_GLOW.Other,
    })),
    updatedAt: live.updatedAt ?? new Date(),
  };
  const loading = live.loading;
  const fetchData = live.refresh;
  const timeAgo = useTimeAgo(data.updatedAt);

  return (
    <section id="transparency-reserves" className="py-28 px-6 lg:px-8 relative">
      {/* Divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-[hsl(0,0%,14%)] to-transparent" />

      {/* Subtle gradient glow behind section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(74,144,217,0.04) 0%, rgba(212,168,67,0.03) 40%, transparent 70%)" }} />

      <div className="max-w-6xl mx-auto relative" ref={sectionRef}>
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(0,0%,55%)] font-medium mb-4">
            Reserves
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[hsl(0,0%,95%)] mb-4">
            Real money behind it
          </h2>
          <p className="text-sm text-[hsl(0,0%,55%)] leading-relaxed max-w-2xl mb-3">
            Every dollar is backed by real money you can check.
          </p>
          <p className="text-sm text-[hsl(0,0%,70%)] leading-relaxed max-w-2xl">
            The money is held in safe, short-term U.S. government assets.
          </p>
        </div>

        {/* Loading shimmer */}
        {loading && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 border-2 border-[hsl(0,0%,30%)] border-t-[hsl(0,0%,70%)] rounded-full animate-spin" />
            <span className="text-xs text-[hsl(0,0%,50%)]">Fetching reserve data…</span>
          </div>
        )}

        {/* Main grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"
        >
          {/* LEFT, Visualizations */}
          <div>
            <div className="rounded-2xl border border-[hsl(0,0%,14%)]/40 bg-[hsl(0,0%,7%)]/40 p-8
              shadow-[0_0_30px_rgba(255,255,255,0.03),0_0_60px_rgba(74,144,217,0.02)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-[hsl(0,0%,95%)]">Reserve Composition</h3>
                  <p className="text-xs text-[hsl(0,0%,50%)] mt-1">Hover segments for details</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[hsl(0,0%,40%)] font-mono">Updated {timeAgo}</span>
                  <button onClick={fetchData} className="p-1 rounded-md hover:bg-[hsl(0,0%,12%)] transition-colors"
                    title="Refresh data">
                    <RefreshCw className={`w-3 h-3 text-[hsl(0,0%,50%)] ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <ReserveDonut assets={data.assets} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />

              <SupplyVsBacking circulation={data.circulation} reserves={data.reserves} assets={data.assets} />
            </div>
          </div>

          {/* RIGHT, Asset Cards */}
          <div className="space-y-3 lg:self-center">
            <p className="text-xs uppercase tracking-[0.15em] text-[hsl(0,0%,50%)] font-medium mb-4">
              Reserve Asset Breakdown
            </p>
            {data.assets.map((a) => (
              <AssetCard key={a.ticker} asset={a} />
            ))}

            {/* Proof of reserves link */}
            <a href="https://oracles.chaoslabs.xyz/por-feeds/frxusd_por" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-4 p-4 rounded-2xl border border-[hsl(0,0%,14%)]/30 bg-[hsl(0,0%,7%)]/20 
                text-xs text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,95%)] hover:bg-[hsl(0,0%,7%)]/50 transition-all">
              <Shield className="w-3.5 h-3.5" />
              Independent Proof of Reserves (Chaos Labs) →
            </a>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <a href="https://frax.com/Transparency" target="_blank" rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-sm text-[hsl(0,0%,70%)] hover:text-[hsl(0,0%,95%)] transition-colors">
            <span className="relative">
              View Full Transparency
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[hsl(0,0%,95%)] group-hover:w-full transition-all duration-300" />
            </span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default TransparencyReserves;
