import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, ArrowUpRight } from "lucide-react";
import Seo from "@learn/components/Seo";
import blackrockLogo from "@learn/assets/partners/blackrock.png";
import superstateLogo from "@learn/assets/partners/superstate.png";
import wisdomtreeLogo from "@learn/assets/partners/wisdomtree.png";
import securitizeLogo from "@learn/assets/partners/securitize.png";
import fireblocksLogo from "@learn/assets/partners/fireblocks.png";
import stripeLogo from "@learn/assets/partners/stripe.png";
import leadLogo from "@learn/assets/partners/lead.png";
import atwLogo from "@learn/assets/partners/atw.png";
import polygonLogo from "@learn/assets/ecosystem/polygon.png";
import aaveLogo from "@learn/assets/ecosystem/aave.png";
import bridgeEcoLogo from "@learn/assets/ecosystem/bridge.png";
import curveLogo from "@learn/assets/ecosystem/curve.png";
import tempoLogo from "@learn/assets/ecosystem/tempo.png";

/* ─── design tokens ─── */
const colors = {
  black: "#000000",
  body: "#555555",
  caption: "#888888",
  border: "#E0E0E0",
  surface: "#FAFAF8",
  white: "#FFFFFF",
} as const;

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { duration: 0.5, ease },
};

const stagger = (delay: number) => ({
  ...fadeUp,
  transition: { duration: 0.5, ease, delay },
});

/* ─── micro-components ─── */
const Caption = ({ children }: { children: React.ReactNode }) => (
  <span
    className="text-[11px] uppercase tracking-[0.12em] block font-bold"
    style={{ color: colors.caption }}
  >
    {children}
  </span>
);

const SectionHeading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2
    className={`mt-3 font-bold ${className}`}
    style={{ fontSize: "clamp(24px, 3vw, 36px)", color: colors.black, letterSpacing: "-0.02em", lineHeight: 1.12 }}
  >
    {children}
  </h2>
);

const SupportText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`mt-4 text-[15px] leading-[1.7] max-w-[600px] ${className}`} style={{ color: colors.body }}>
    {children}
  </p>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5">
    <span className="w-1 h-1 rounded-full mt-[9px] shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.2)" }} />
    <span className="text-[14px] leading-[1.65]" style={{ color: colors.body }}>{children}</span>
  </li>
);

/* ─── expandable product card ─── */
export const ProductCard = ({
  caption, title, body, bullets, bottomTag, expandedContent, secondary = false,
}: {
  caption: string; title: string; body: string; bullets?: string[];
  bottomTag: string; expandedContent: string; secondary?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl border flex flex-col h-full transition-all duration-300 group relative overflow-hidden"
      style={{
        backgroundColor: colors.white,
        borderColor: expanded ? "rgba(0,0,0,0.12)" : colors.border,
        padding: secondary ? "24px" : "32px 28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)"; if (!expanded) e.currentTarget.style.borderColor = colors.border; }}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />

      <Caption>{caption}</Caption>
      <h3
        className={`mt-3 font-bold leading-[1.2] ${secondary ? "text-[17px]" : "text-[20px]"}`}
        style={{ color: colors.black, letterSpacing: "-0.01em" }}
      >
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: colors.body }}>{body}</p>
      {bullets && (
        <ul className="mt-4 space-y-2">
          {bullets.map((b) => <Bullet key={b}>{b}</Bullet>)}
        </ul>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p
              className="text-[14px] leading-[1.7] border-t"
              style={{ color: colors.body, borderColor: "rgba(0,0,0,0.06)", paddingTop: "16px", marginTop: "16px" }}
            >
              {expandedContent}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.06)", marginTop: "20px" }}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-md" style={{ color: colors.caption, backgroundColor: "rgba(0,0,0,0.03)" }}>
          {bottomTag}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[12px] flex items-center gap-1.5 transition-colors font-semibold hover:opacity-70"
          style={{ color: colors.black }}
        >
          {expanded ? <>Less <ChevronUp className="w-3.5 h-3.5" /></> : <>Details <ChevronDown className="w-3.5 h-3.5" /></>}
        </button>
      </div>
    </div>
  );
};

/* ─── FAQ accordion item ─── */
const FAQItem = ({ question, answer, isLast }: { question: string; answer: string; isLast?: boolean }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: isLast ? undefined : `1px solid ${colors.border}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between cursor-pointer" style={{ padding: "20px 0" }}>
        <span className="text-[17px] font-semibold text-left leading-[1.3]" style={{ color: colors.black }}>{question}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 ml-4">
          <ChevronDown className="w-5 h-5" style={{ color: colors.caption }} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
            <p className="text-[14px] leading-[1.7] font-sans font-extralight" style={{ color: colors.body, paddingBottom: "20px" }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Marquee bar ─── */
const MarqueeBar = () => {
  const logos = [
    { src: blackrockLogo, alt: "BlackRock" },
    { src: superstateLogo, alt: "Superstate" },
    { src: wisdomtreeLogo, alt: "WisdomTree" },
    { src: securitizeLogo, alt: "Securitize" },
    { src: fireblocksLogo, alt: "Fireblocks" },
    { src: stripeLogo, alt: "Stripe" },
    { src: leadLogo, alt: "Lead" },
    { src: atwLogo, alt: "ATW Partners" },
  ];
  const items = [...logos, ...logos];

  return (
    <div className="overflow-hidden py-12 md:py-16 relative" aria-label="Infrastructure partners">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10" style={{ background: `linear-gradient(to right, ${colors.surface}, transparent)` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10" style={{ background: `linear-gradient(to left, ${colors.surface}, transparent)` }} />
      <div className="flex items-center gap-16 md:gap-24 whitespace-nowrap animate-marquee will-change-transform">
        {items.map((logo, i) => (
          <img
            key={`${logo.alt}-${i}`}
            src={logo.src}
            alt={`${logo.alt} partner logo`}
            loading="lazy"
            decoding="async"
            width={120}
            height={56}
            className="h-10 md:h-14 w-auto object-contain shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-300 select-none"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 1: HERO
   ═══════════════════════════════════════════════════════ */
const HeroSection = () => {
  const prefersReduced = useReducedMotion();

  return (
    <section
      className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center relative"
      style={{ backgroundColor: colors.surface }}
    >
      <motion.div {...(prefersReduced ? {} : stagger(0))}>
        <Caption>FOR INSTITUTIONS &amp; ENTERPRISES</Caption>
      </motion.div>

      <motion.h1
        {...(prefersReduced ? {} : stagger(0.1))}
        className="mt-6 font-bold max-w-[680px] mx-auto"
        style={{ fontSize: "clamp(36px, 5vw, 56px)", color: colors.black, letterSpacing: "-0.025em", lineHeight: 1.1 }}
      >
        Financial infrastructure for digital dollars.
      </motion.h1>

      <motion.p
        {...(prefersReduced ? {} : stagger(0.2))}
        className="mt-7 text-[16px] max-w-[540px] mx-auto"
        style={{ color: colors.body, lineHeight: 1.75 }}
      >
        Run payments, treasury, FX, and stablecoin issuance on one unified system, built for regulated environments.
      </motion.p>

      <motion.div
        {...(prefersReduced ? {} : stagger(0.3))}
        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <a
          href="https://form.typeform.com/to/m4iMPgYk?typeform-source=frax.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg font-semibold text-[15px] transition-colors duration-150"
          style={{ backgroundColor: colors.black, color: colors.white, padding: "14px 32px" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.black; }}
        >
          Talk to Sales
        </a>
        <a
          href="https://docs.frax.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg font-semibold text-[15px] transition-colors duration-150"
          style={{ backgroundColor: "transparent", color: colors.black, padding: "14px 32px", border: `1px solid ${colors.border}` }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
        >
          View Technical Docs
        </a>
      </motion.div>

      <motion.div
        {...(prefersReduced ? {} : stagger(0.4))}
        className="mt-14 w-full max-w-[1120px]"
      >
        <div className="text-center mb-2">
          <Caption>BACKED BY REGULATED ASSET MANAGERS</Caption>
        </div>
        <MarqueeBar />
      </motion.div>

      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div animate={prefersReduced ? undefined : { y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
          <ChevronDown className="w-6 h-6" style={{ color: "#CCC" }} />
        </motion.div>
      </motion.div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 2: ECOSYSTEM BAR + METRICS
   ═══════════════════════════════════════════════════════ */
export const ProblemSection = () => {
  const points = [
    "Payments, liquidity, custody, and compliance are disconnected across different systems.",
    "Stablecoins lack native yield and regulatory clarity.",
    "Cross-border settlement remains slow, expensive, and operationally complex.",
  ];
  return (
    <section style={{ backgroundColor: colors.white, padding: "112px 24px" }}>
      <div className="max-w-[760px] mx-auto text-center">
        <motion.div {...fadeUp}>
          <Caption>THE PROBLEM</Caption>
          <SectionHeading className="mx-auto">Financial infrastructure is fragmented.</SectionHeading>
        </motion.div>
        <motion.ul {...stagger(0.1)} className="mt-12 space-y-5 text-left max-w-[620px] mx-auto">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full mt-[10px] shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />
              <span className="text-[15px] leading-[1.7]" style={{ color: colors.body }}>{p}</span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
};


const MetricsSection = () => {
  const stats = [
    { value: "100%", label: "Reserve backed" },
    { value: "20+", label: "Chains live" },
    { value: "ZERO", label: "SECURITY INCIDENTS" },
  ];

  return (
    <section style={{ backgroundColor: colors.white, padding: "72px 24px 64px" }}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div {...stagger(0)} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border text-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, padding: "28px 16px" }}
            >
              <div className="font-bold tabular-nums" style={{ fontSize: "clamp(26px, 3vw, 36px)", color: colors.black }}>
                {s.value}
              </div>
              <div className="text-[11px] mt-1.5 font-semibold uppercase tracking-[0.08em]" style={{ color: colors.caption }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
        <motion.p {...stagger(0.3)} className="text-center mt-4 text-[12px] font-light" style={{ color: "#AAAAAA" }}>
          Infrastructure used across stablecoins, liquidity, lending, and settlement. Figures as of Frax biweekly updates, mid-2026.
        </motion.p>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 3: PRODUCT STACK
   ═══════════════════════════════════════════════════════ */
type FlipSection = { label: string; items: (string | { name: string; note?: string })[] };
type CardCta = { label: string; href: string; external?: boolean };
const CoreProductCard = ({
  caption, title, body, bullets, cta, expanded,
}: {
  caption: string; title: string; body: string; bullets: string[]; cta: CardCta;
  bottomTag?: string;
  expanded: { heading: string; sections: FlipSection[] };
}) => {
  const [flipped, setFlipped] = useState(false);
  const btnStyle: React.CSSProperties = {
    backgroundColor: colors.black,
    color: colors.white,
    borderRadius: 24,
    fontSize: 14,
    padding: "12px 16px",
  };
  const cardFace: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    backgroundColor: colors.white,
    borderRadius: 24,
    border: `1px solid ${colors.border}`,
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.04)",
  };
  return (
    <div
      className="group h-full"
      style={{ perspective: "1600px", minHeight: 560 }}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: 560,
        }}
      >
        {/* FRONT */}
        <div style={cardFace} aria-hidden={flipped} className="justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div style={{ paddingTop: 8 }}>
                <Caption>{caption}</Caption>
              </div>
              <button
                onClick={() => setFlipped(true)}
                className="text-[12px] flex items-center gap-1 font-semibold hover:opacity-70 mt-1"
                style={{ color: colors.black }}
              >
                Details <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>
            <h3 className="mt-4 font-bold leading-[1.1]" style={{ color: colors.black, letterSpacing: "-0.02em", fontSize: "clamp(28px, 3vw, 36px)" }}>
              {title}
            </h3>
            <p className="mt-4 text-[15px] leading-[1.7]" style={{ color: colors.body }}>{body}</p>

            <ul className="mt-6 space-y-3">
              {bullets.map((b) => <Bullet key={b}>{b}</Bullet>)}
            </ul>
          </div>

          <div className="mt-8">
            {cta.external ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block w-full text-center font-semibold transition-colors duration-150"
                style={btnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.black; }}
              >
                {cta.label}
              </a>
            ) : (
              <Link
                to={cta.href}
                onClick={(e) => e.stopPropagation()}
                className="block w-full text-center font-semibold transition-colors duration-150"
                style={btnStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = colors.black; }}
              >
                {cta.label}
              </Link>
            )}
          </div>
        </div>

        {/* BACK */}
        <div
          style={{ ...cardFace, transform: "rotateY(180deg)", padding: "32px", overflowY: "auto" }}
          aria-hidden={!flipped}
        >
          <div className="flex items-start justify-between">
            <div>
              <Caption>{caption}</Caption>
              <h3 className="mt-2 font-bold leading-[1.1]" style={{ color: colors.black, letterSpacing: "-0.02em", fontSize: "22px" }}>
                {title}
              </h3>
            </div>
            <button
              onClick={() => setFlipped(false)}
              className="text-[12px] flex items-center gap-1 font-semibold hover:opacity-70 shrink-0 mt-1"
              style={{ color: colors.black }}
            >
              <ChevronUp className="w-3.5 h-3.5 -rotate-90" /> Back
            </button>
          </div>

          <div className="mt-5 pt-5 border-t space-y-4 flex-1" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            {expanded.sections.map((sec, idx) => (
              <div key={sec.label} style={{ paddingTop: idx === 0 ? 0 : 12, borderTop: idx === 0 ? "none" : "1px dashed rgba(0,0,0,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: colors.caption }}>{sec.label}</p>
                <ul className="space-y-1.5">
                  {sec.items.map((it) => {
                    const isObj = typeof it !== "string";
                    const name = isObj ? it.name : it;
                    const note = isObj ? it.note : undefined;
                    return (
                      <li key={name} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full mt-[8px] shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
                        <span className="text-[13px] leading-[1.55]" style={{ color: colors.body }}>
                          <span className="font-semibold" style={{ color: colors.black }}>{name}</span>
                          {note && <span>, {note}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductStack = () => {
const frxUSD = {
    caption: "THE DIGITAL DOLLAR",
    title: "frxUSD",
    body: "Institutional-grade digital dollar. Works everywhere, anytime.",
    bullets: [
      "Fully collateralized",
      "Always redeemable 1:1 for U.S. dollars",
      "Transparent, on-chain verifiable reserves",
      "GENIUS Act-aligned payment stablecoin structure",
    ],
    bottomTag: "View reserves → frax.com/transparency",
    expanded: {
      heading: "frxUSD details",
      sections: [
        {
          label: "WHAT IT IS",
          items: [
            "Digital dollars that can work everywhere",
            "Always redeemable 1:1 for U.S. dollars",
            "Transparent, on-chain verifiable reserves, auditable at any time",
            "GENIUS Act-aligned payment stablecoin structure",
          ],
        },
        {
          label: "BACKED BY",
          items: [
            { name: "BlackRock BUIDL", note: "Tokenized U.S. Treasury fund" },
            { name: "Superstate USTB", note: "Short-duration Treasury fund" },
            { name: "WisdomTree WTGXX", note: "Government money market fund" },
            { name: "Bridge USDB", note: "Treasury-backed dollar" },
          ],
        },
        {
          label: "CROSS-CHAIN",
          items: [
            "Live on 20+ chains via the LayerZero OFT standard",
            "Frax operates its own routing and verifier network, no dependency on external operators",
            "Ethereum, Arbitrum, Optimism, Polygon, Base, Avalanche, BSC, Sonic",
          ],
        },
        {
          label: "BUILT FOR",
          items: [
            "Payments & treasury management",
            "Lending, settlement, and clearing",
            "Branded stablecoin issuance (white-label)",
          ],
        },
      ],
    },
  };

  const fraxNet = {
    caption: "THE INFRASTRUCTURE LAYER",
    title: "FraxNet",
    body: "A complete banking infrastructure stack for institutions and enterprises operating in the digital economy.",
    bullets: [
      "Banking rails, ACH, wire, USD on/off-ramp",
      "Mint & redeem, frxUSD ↔ USDC / USDT / fiat",
      "Cross-chain, frxUSD across 20+ chains",
      "Stablecoin-as-a-Service, white-label, backed 1:1 by frxUSD",
    ],
    bottomTag: "Enterprise interface",
    expanded: {
      heading: "FraxNet details",
      sections: [
        {
          label: "ONBOARDING & COMPLIANCE",
          items: [
            "KYC / KYB / AML, full identity verification for individuals and businesses",
            "Institutional account setup and management",
            "Mint and redemption flows with compliance controls built in",
          ],
        },
        {
          label: "BANKING RAILS",
          items: [
            "ACH transfers, domestic bank payments",
            "Wire transfers, domestic and international",
            "Direct USD on/off-ramp, move between fiat and digital dollars without intermediaries",
            "Virtual Accounts, assign unique account numbers per client or use case",
          ],
        },
        {
          label: "MINT & REDEEM",
          items: [
            "Direct conversion between frxUSD and USDC / USDT",
            "Mint frxUSD from fiat, wire in, receive digital dollars",
            "Redeem frxUSD back to USD, fully liquid, no lock-up",
          ],
        },
        {
          label: "CROSS-CHAIN TRANSFER",
          items: [
            "Transfer frxUSD across 20+ chains natively",
            "Bridge between networks in a single interface",
            "Frax-operated routing, no reliance on third-party bridge infrastructure",
          ],
        },
        {
          label: "TRADING & FX",
          items: [
            "On-chain trade execution between supported digital assets",
            "Cross-currency FX settlement via digital dollars on-chain",
          ],
        },
        {
          label: "STABLECOIN-AS-A-SERVICE",
          items: [
            "Launch your own branded stablecoin backed 1:1 by frxUSD",
            "Issuance, compliance, and multi-chain distribution handled end-to-end",
            "Full white-label stack, your brand on Frax infrastructure",
          ],
        },
      ],
    },
  };

  return (
    <section style={{ backgroundColor: colors.surface, padding: "96px 24px" }}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Caption>CORE PRODUCTS</Caption>
          <SectionHeading className="mx-auto">Two products. One unified stack.</SectionHeading>
          <SupportText className="mx-auto text-center">
            frxUSD is the digital dollar. FraxNet is the infrastructure that connects it to the real world.
          </SupportText>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          <motion.div {...stagger(0)} className="h-full">
            <CoreProductCard {...frxUSD} cta={{ label: "Check it out →", href: "/learn/explore-better-money" }} />
          </motion.div>
          <motion.div {...stagger(0.1)} className="h-full">
            <CoreProductCard {...fraxNet} cta={{ label: "Check it out →", href: "https://net.frax.com", external: true }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 4: USE CASES
   ═══════════════════════════════════════════════════════ */
const UseCaseFlipCard = ({ title, problem, solution }: { title: string; problem: string; solution: string }) => {
  const [flipped, setFlipped] = useState(false);
  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    backgroundColor: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: "24px 26px",
    display: "flex",
    flexDirection: "column",
  };
  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      className="block w-full text-left"
      style={{ perspective: "1400px", height: 200 }}
      aria-label={`${title}, tap to reveal solution`}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT, problem */}
        <div style={face} aria-hidden={flipped}>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#C44" }}>Problem</span>
          <h3 className="mt-2 text-[15px] font-semibold leading-[1.3]" style={{ color: colors.black }}>{title}</h3>
          <p className="mt-3 text-[14px] leading-[1.65]" style={{ color: colors.body }}>{problem}</p>
          <span className="mt-auto text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: colors.caption }}>
            Hover for solution →
          </span>
        </div>
        {/* BACK, solution */}
        <div style={{ ...face, transform: "rotateY(180deg)", backgroundColor: colors.black, borderColor: colors.black }} aria-hidden={!flipped}>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#16a34a" }}>FRAX SOLUTION</span>
          <h3 className="mt-2 text-[15px] font-semibold leading-[1.3]" style={{ color: colors.white }}>{title}</h3>
          <p className="mt-3 text-[14px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.78)" }}>{solution}</p>
        </div>
      </div>
    </button>
  );
};

const UseCases = () => {
  const cases = [
    {
      title: "Payments & global money movement",
      problem: "Sending money is slow, expensive, and limited by banks.",
      solution: "Instant, low-cost global payments with easy integrations.",
    },
    {
      title: "Financial infrastructure",
      problem: "Financial systems are fragmented, manual, and slow.",
      solution: "Assets and payments move together automatically in one system, in real time.",
    },
    {
      title: "Cash management & yield",
      problem: "Money sits idle, is hard to track, and earns little.",
      solution: "Money can earn returns, be tracked instantly, and used more efficiently.",
    },
    {
      title: "Banking infrastructure",
      problem: "Building payment systems is complex and expensive.",
      solution: "Ready-to-use digital dollars that are easy to integrate.",
    },
    {
      title: "Transparency & auditability",
      problem: "Audits are slow, expensive, and hard to verify.",
      solution: "All transactions are recorded on-chain and can be verified instantly in real time.",
    },
  ];

  return (
    <section style={{ backgroundColor: colors.white, padding: "80px 24px" }}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Caption>USE CASES</Caption>
          <SectionHeading className="mx-auto">Run financial operations on a unified system.</SectionHeading>
          <SupportText className="mx-auto text-center">
            Each use case is already powered by frxUSD and FraxNet today.
          </SupportText>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, i) => (
            <motion.div key={c.title} {...stagger(i * 0.06)}>
              <UseCaseFlipCard title={c.title} problem={c.problem} solution={c.solution} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 5: LIVE SIGNALS / PARTNERSHIPS
   ═══════════════════════════════════════════════════════ */
type LiveSignal = {
  tag: string;
  title: string;
  copy: string;
  bottom: string;
  href: string;
  internal?: boolean;
};

const LIVE_SIGNALS: LiveSignal[] = [
  {
    tag: 'LENDING',
    title: 'frxUSD on Aave V4',
    copy: 'frxUSD is live as a core borrowable stablecoin on Aave V4. Deposits grew about 50% month over month in July 2026.',
    bottom: 'Institutional credit rails, already in use.',
    href: 'https://news.frax.com/p/frax-finance-biweekly-project-update-64b',
  },
  {
    tag: 'INSTITUTIONAL CAPITAL',
    title: 'ATW Partners × BitGo',
    copy: 'ATW Partners committed $50M to frxUSD with custody at BitGo. Treasury capital stays liquid, with no lock-ups or redemption queues.',
    bottom: 'Regulated custody meets onchain dollars.',
    href: 'https://www.prnewswire.com/news-releases/atw-partners-agrees-to-invest-50-million-in-fraxs-frxusd-stablecoin-custodied-by-bitgo-302661520.html',
  },
  {
    tag: 'FX MARKETS',
    title: 'Onchain FX on Polygon',
    copy: 'Polygon Labs, Frax, Curve, and DFB launched FX pools with frxUSD as the dollar anchor for BRZ, IDRX, tGBP, AUDF, KRWQ, and USDT. Swaps settle in seconds for about $0.002.',
    bottom: 'Cross-border settlement, priced onchain.',
    href: 'https://polygon.technology/blog/polygon-labs-frax-and-curve-finance-launch-onchain-fx-markets',
  },
  {
    tag: 'BRANDED CURRENCY',
    title: 'KRWQ · Korean Won',
    copy: 'The first multi-chain Korean won stablecoin, built on Frax infrastructure and trading against frxUSD in Curve Polygon FX pools.',
    bottom: 'Non-USD currencies on the same rails.',
    href: 'https://blog.iqai.com/krwq-goes-live-in-onchain-fx-markets-on-polygon-via-curve-and-frax/',
  },
  {
    tag: 'BRANDED CURRENCY',
    title: 'USDso · Somnia',
    copy: 'Somnia native ecosystem stablecoin, issued and operated by Frax on frxUSD architecture. Backed 1:1 by frxUSD in a Frax vault, with 90% of reserve yield routed back to Somnia DeFi.',
    bottom: 'A chain-native dollar, run by Frax.',
    href: 'https://somnia.network/usdso-stablecoin',
  },
  {
    tag: 'BRANDED CURRENCY',
    title: 'USSD · Sonic',
    copy: 'Sonic Labs USSD runs on Frax infrastructure, a white-label dollar for Sonic, backed by the same Treasury-grade reserves as frxUSD.',
    bottom: 'FraxNet as the issuance layer.',
    href: 'https://www.soniclabs.com/ussd',
  },
  {
    tag: 'REAL ESTATE',
    title: "BTC Home with Christie's",
    copy: "Luxury listings priced in Bitcoin, settled through Frax compliant crypto-to-real-estate infrastructure, launched with Christie's International Real Estate Southern California.",
    bottom: 'From onchain dollars to property closings.',
    href: 'https://frax.com/btc-home',
  },
  {
    tag: 'PAYMENTS',
    title: 'Cloudflare Wallets',
    copy: 'frxUSD is supported in Cloudflare Wallets, stablecoin infrastructure for AI agent payments, so software can pay software in onchain dollars.',
    bottom: 'Built for the agentic economy.',
    href: 'https://news.frax.com/p/frax-finance-biweekly-project-update-64b',
  },
  {
    tag: 'DEFI TREASURY',
    title: 'Curve DAO holds sfrxUSD',
    copy: 'Curve DAO allocated part of its stablecoin treasury to sfrxUSD to earn reserve yield. Llamalend V2 launched on Ethereum with sfrxUSD as day-one collateral.',
    bottom: 'Curve chose Frax yield for treasury reserves.',
    href: 'https://news.frax.com/p/frax-finance-biweekly-project-update-64b',
  },
  {
    tag: 'LIQUIDITY',
    title: 'PegKeeper Family on Curve',
    copy: '30 partner stablecoins use frxUSD as their default liquidity pair. PegKeeper pools cleared more than $200M in trading volume in June 2026 alone.',
    bottom: 'Explore the live family.',
    href: '/pegkeeper',
    internal: true,
  },
];

const VISIBLE_SIGNALS = 2;
const SIGNAL_ROTATE_MS = 10_000;

const LiveSignals = () => {
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(() => {
      setOffset((o) => (o + VISIBLE_SIGNALS) % LIVE_SIGNALS.length);
    }, SIGNAL_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion]);

  const pageCount = Math.ceil(LIVE_SIGNALS.length / VISIBLE_SIGNALS);
  const activePage = Math.floor(offset / VISIBLE_SIGNALS) % pageCount;

  const visible = Array.from({ length: VISIBLE_SIGNALS }, (_, i) => {
    const signal = LIVE_SIGNALS[(offset + i) % LIVE_SIGNALS.length]!;
    return { signal, slot: i, key: `${signal.title}-${offset}-${i}` };
  });

  return (
    <section className="live-signals" style={{ backgroundColor: colors.surface, padding: '80px 24px' }}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Caption>ALREADY IN USE</Caption>
          <SectionHeading className="mx-auto">Already operating at scale.</SectionHeading>
          <SupportText className="mx-auto text-center">
            Frax infrastructure is already live across lending, custody, branded stablecoins, real estate, payments, and onchain FX.
          </SupportText>
        </motion.div>

        <div
          className="live-signals__deck"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map(({ signal: s, slot, key }) => (
                <motion.div
                  key={reduceMotion ? `${s.title}-${slot}` : key}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease }}
                  className="rounded-xl border relative h-full flex flex-col justify-center live-signals__card"
                  style={{ backgroundColor: colors.white, borderColor: colors.border, padding: '32px' }}
                >
                {s.internal ? (
                  <Link
                    to={s.href}
                    className="absolute top-[32px] right-[32px] inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors"
                    style={{ color: "#AAAAAA" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = colors.black; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#AAAAAA"; }}
                  >
                    Learn more <ArrowUpRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-[32px] right-[32px] inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors"
                    style={{ color: "#AAAAAA" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = colors.black; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#AAAAAA"; }}
                  >
                    Learn more <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                <span
                  className="inline-block text-[10px] font-medium uppercase tracking-[0.1em] mb-3"
                  style={{ color: "#AAAAAA" }}
                >
                  {s.tag}
                </span>
                <h3 className="text-[17px] font-semibold leading-[1.3] pr-16" style={{ color: colors.black }}>{s.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: colors.body }}>{s.copy}</p>
                <p className="mt-3 text-[12px] font-semibold" style={{ color: colors.caption }}>{s.bottom}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          </div>

          {!reduceMotion && (
            <div className="live-signals__dots" aria-hidden>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show page ${i + 1}`}
                  onClick={() => setOffset((i * VISIBLE_SIGNALS) % LIVE_SIGNALS.length)}
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: i === activePage ? colors.black : '#D4D4D4',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <motion.div
          {...stagger(0.2)}
          className="rounded-xl border live-signals__action"
          style={{ backgroundColor: colors.white, borderColor: colors.border, padding: '28px' }}
        >
            <span
              className="inline-block text-[10px] font-medium uppercase tracking-[0.1em] mb-3"
              style={{ color: "#AAAAAA" }}
            >
              BRANDED STABLECOINS
            </span>
            <h3 className="text-[17px] font-semibold leading-[1.3]" style={{ color: colors.black }}>
              Branded Stablecoins by Frax in action.
            </h3>
            <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: colors.body }}>
              FraxNet already powers live branded stablecoins, USSD on Sonic, USDso on Somnia, and KRWQ for Korean won, all built on frxUSD infrastructure.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://www.soniclabs.com/ussd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg font-semibold text-[13px] transition-colors duration-150"
                style={{ backgroundColor: colors.black, color: colors.white, padding: "10px 20px" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.black; }}
              >
                Explore USSD
              </a>
              <a
                href="https://somnia.network/usdso-stablecoin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg font-semibold text-[13px] transition-colors duration-150"
                style={{ backgroundColor: colors.black, color: colors.white, padding: "10px 20px" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.black; }}
              >
                Explore USDso
              </a>
              <a
                href="https://www.krwq.cash/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg font-semibold text-[13px] transition-colors duration-150"
                style={{ backgroundColor: colors.black, color: colors.white, padding: "10px 20px" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.black; }}
              >
                Explore KRWQ
              </a>
            </div>
            <p className="mt-3 text-[12px] font-semibold" style={{ color: colors.caption }}>
              Multi-currency stablecoin issuance, in production.
            </p>
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION: ECOSYSTEM PARTNERS
   ═══════════════════════════════════════════════════════ */
const EcosystemPartners = () => {
  const logos = [
    { src: polygonLogo, alt: "Polygon" },
    { src: aaveLogo, alt: "Aave" },
    { src: bridgeEcoLogo, alt: "Bridge" },
    { src: curveLogo, alt: "Curve" },
    { src: tempoLogo, alt: "Tempo" },
  ];
  const items = [...logos, ...logos];

  return (
    <section style={{ backgroundColor: colors.white, padding: "72px 24px 80px" }}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-10">
          <Caption>INFRASTRUCTURE INTEGRATIONS</Caption>
          <SectionHeading className="mx-auto">Live across the onchain economy.</SectionHeading>
          <SupportText className="mx-auto text-center">
            Integrated across liquidity, lending, settlement, and cross-chain venues.
          </SupportText>
        </motion.div>

        <div className="overflow-hidden py-8 relative" aria-label="Ecosystem partners">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10" style={{ background: `linear-gradient(to right, ${colors.white}, transparent)` }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10" style={{ background: `linear-gradient(to left, ${colors.white}, transparent)` }} />
          <div className="flex items-center gap-16 md:gap-24 whitespace-nowrap animate-marquee will-change-transform">
            {items.map((logo, i) => (
              <img
                key={`${logo.alt}-${i}`}
                src={logo.src}
                alt={`${logo.alt} ecosystem logo`}
                loading="lazy"
                decoding="async"
                width={120}
                height={56}
                className="h-10 md:h-14 w-auto object-contain shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-300 select-none"
                draggable={false}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 7: FAQ
   ═══════════════════════════════════════════════════════ */
const FAQ = () => {
  const faqs = [
    { q: "What is frxUSD?", a: "frxUSD is a fully collateralized digital dollar, always redeemable 1:1 for U.S. dollars, with no algorithmic exposure. It is backed by tokenized U.S. Treasury funds from regulated managers including BlackRock BUIDL, Superstate USTB, WisdomTree WTGXX, and Bridge USDB. Designed as a GENIUS Act-aligned payment stablecoin, frxUSD is live on 20+ blockchains and built for payments, treasury management, lending, and settlement across both DeFi and traditional finance." },
    { q: "How does minting and redemption work?", a: "Verified institutions on FraxNet can mint frxUSD from supported stablecoins (USDC, USDT) or directly from fiat via ACH and wire. Redemption works the same way, frxUSD converts back to USD through the same banking rails. Full KYC/KYB/AML compliance is required." },
    { q: "How does frxUSD stay fully backed?", a: "Every frxUSD is backed 1:1 by tokenized U.S. Treasury funds held through regulated managers: BlackRock BUIDL, Superstate USTB, WisdomTree WTGXX, and Bridge USDB. Reserves are ring-fenced, publicly reported, and verifiable onchain at any time via frax.com/transparency." },
    { q: "What is the difference between frxUSD and sfrxUSD?", a: "frxUSD is the base payment stablecoin, it does not carry yield by design, keeping it compliant as a payment instrument. sfrxUSD is the separate yield-bearing token: deposit frxUSD, receive sfrxUSD, and earn T-bill yield from the underlying reserve assets." },
    { q: "Can institutions integrate FraxNet directly?", a: "Yes. FraxNet provides a compliance-ready infrastructure for institutions to onboard via KYC/KYB/AML, mint and redeem frxUSD through ACH and wire rails, manage virtual accounts, and launch branded stablecoins. Direct API access and custody partner integrations are available." },
    { q: "What are the compliance requirements?", a: "FraxNet applies KYC, KYB, and AML controls across all minting, redemption, and institutional account features. frxUSD is structured as a GENIUS Act-aligned payment stablecoin, non-yield-bearing at the base layer, with yield access available separately through sfrxUSD for verified users." },
    { q: "Which chains does frxUSD support?", a: "frxUSD is live on more than 20 chains including Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC, Sonic, and more. Cross-chain transfers use the LayerZero OFT standard with Frax-operated routing and DVN infrastructure." },
    { q: "Can we launch a branded stablecoin on Frax?", a: "Yes. FraxNet's Stablecoin-as-a-Service allows any institution to launch a branded stablecoin backed 1:1 by frxUSD. Issuance, compliance, and multi-chain distribution are handled end-to-end. KRWQ, the first multi-chain Korean Won stablecoin, is a live example built on this infrastructure." },
  ];

  return (
    <section style={{ backgroundColor: colors.surface, padding: "80px 24px" }}>
      <div className="max-w-[720px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Caption>FAQ</Caption>
          <SectionHeading className="mx-auto">Common questions.</SectionHeading>
        </motion.div>

        <div>
          {faqs.map((faq, i) => (
            <motion.div key={faq.q} {...stagger(i * 0.05)}>
              <FAQItem question={faq.q} answer={faq.a} isLast={i === faqs.length - 1} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION 8: CLOSING CTA
   ═══════════════════════════════════════════════════════ */
const ClosingCTA = () => (
  <section className="text-center" style={{ backgroundColor: colors.black, padding: "72px 24px" }}>
    <motion.div {...fadeUp} className="max-w-[620px] mx-auto">
      <h2
        className="font-bold"
        style={{ fontSize: "clamp(30px, 4vw, 44px)", color: colors.white, letterSpacing: "-0.025em", lineHeight: 1.12 }}
      >
        Built for the future of finance. Ready today.
      </h2>
      <p className="mt-4 text-[15px]" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
        Frax provides the infrastructure layer for digital dollars across payments, treasury, settlement, and issuance.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="https://form.typeform.com/to/m4iMPgYk?typeform-source=frax.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg font-semibold text-[15px] transition-colors duration-150"
          style={{ backgroundColor: colors.white, color: colors.black, padding: "14px 32px" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F0F0F0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.white; }}
        >
          Talk to Sales
        </a>
      </div>
    </motion.div>
  </section>
);

/* ─── page footer ─── */
const PageFooter = () => (
  <footer className="text-center" style={{ backgroundColor: colors.surface, padding: "36px 24px" }}>
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[12px] font-semibold" style={{ color: colors.caption, letterSpacing: "0.06em" }}>
      <a href="https://docs.frax.com" target="_blank" rel="noopener noreferrer" className="hover:underline">docs.frax.com</a>
      <span>·</span>
      <a href="https://frax.com/transparency" target="_blank" rel="noopener noreferrer" className="hover:underline">frax.com/transparency</a>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
const TheBusiness = () => (
  <div style={{ backgroundColor: colors.surface }}>
    <Seo
      title="The Business, Regulated digital dollar infrastructure"
      description="For institutions, enterprises, and builders exploring regulated digital dollar infrastructure on the Frax stack."
      path="/learn/the-business"
    />
    <HeroSection />
    <ProductStack />
    <UseCases />
    <LiveSignals />
    <MetricsSection />
    <EcosystemPartners />
    <ClosingCTA />
    <FAQ />
    <PageFooter />
  </div>
);

export default TheBusiness;
