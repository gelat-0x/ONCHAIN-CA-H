import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDown, Landmark, Lock, SlidersHorizontal, CheckCircle } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import Seo from "@learn/components/Seo";

const SECTION_COUNT = 5;

/* ── Data ── */
const stablecoinTypes = [
  {
    icon: Landmark,
    title: "Cash-backed",
    bullets: [
      "Backed by real dollars in a bank",
      "Made by regulated companies",
      "You can always swap it back to real money",
    ],
  },
  {
    icon: Lock,
    title: "Crypto-backed",
    bullets: [
      "Backed by other crypto assets",
      "Holds extra reserves to stay safe",
      "Runs on automatic smart contracts",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "Algorithmic",
    bullets: [
      "Backed by code and rules",
      "Supply goes up or down automatically",
      "Higher risk, still experimental",
    ],
  },
];

const trustChecklist = [
  { title: "Issuer", description: "Who made it? Are they trusted and transparent?" },
  { title: "Where you can use it", description: "Is it accepted on major platforms?" },
  { title: "Redemption", description: "Can you always turn it back into real dollars?" },
  { title: "Reserves transparency", description: "Can you check the backing yourself? Are audits public?" },
];

/* ── Shared components ── */
const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-[11px] flex-shrink-0" />
    <span className="text-[16px] leading-[1.7] text-neutral-600">{children}</span>
  </li>
);

const ProgressDots = ({ active, total }: { active: number; total: number }) => (
  <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full border border-white/30"
        animate={{
          backgroundColor: i === active ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.2)",
          scale: i === active ? 1.3 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    ))}
  </div>
);

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] w-full snap-start snap-always flex flex-col items-center justify-center px-5 md:px-6 shrink-0 overflow-hidden ${className}`}>
    {children}
  </section>
);

/* ── Volatility Demo ── */
const VolatilityDemo = () => {
  const [isStable, setIsStable] = useState(false);
  const volatilePath = "M0,40 L15,25 L30,50 L45,15 L60,45 L75,10 L90,55 L105,20 L120,48 L135,8 L150,35 L165,52 L180,18 L195,42 L210,30 L225,55 L240,12 L255,45 L270,28 L285,50 L300,20";
  const stablePath = "M0,35 L15,36 L30,35 L45,34 L60,35 L75,36 L90,35 L105,35 L120,34 L135,35 L150,36 L165,35 L180,35 L195,34 L210,35 L225,36 L240,35 L255,35 L270,34 L285,35 L300,35";

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="rounded-xl border-2 border-black bg-white p-5 md:p-10">
        <div className="flex items-center justify-center gap-3 mb-5 md:mb-7">
          <button
            onClick={() => setIsStable(false)}
            className={`px-4 py-2 rounded-lg text-[14px] font-bold transition-all duration-200 border-2 ${
              !isStable
                ? "border-black bg-black text-white shadow-[2px_2px_0_0_hsl(0_0%_0%)]"
                : "border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300"
            }`}
          >
            Volatile
          </button>
          <button
            onClick={() => setIsStable(true)}
            className={`px-4 py-2 rounded-lg text-[14px] font-bold transition-all duration-200 border-2 ${
              isStable
                ? "border-black bg-black text-white shadow-[2px_2px_0_0_hsl(0_0%_0%)]"
                : "border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300"
            }`}
          >
            Stable
          </button>
        </div>
        <div className="relative h-[80px] md:h-[96px] w-full overflow-hidden">
          <svg viewBox="0 0 300 65" className="w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="35" x2="300" y2="35" stroke="hsl(0 0% 85%)" strokeWidth="1" strokeDasharray="4 4" />
            <AnimatePresence mode="wait">
              <motion.path
                key={isStable ? "stable" : "volatile"}
                d={isStable ? stablePath : volatilePath}
                fill="none"
                stroke="hsl(0 0% 0%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </AnimatePresence>
            <text x="4" y="12" fontSize="9" fill="hsl(0 0% 60%)" fontFamily="inherit">Price</text>
            <text x="260" y="60" fontSize="9" fill="hsl(0 0% 60%)" fontFamily="inherit">Time →</text>
          </svg>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={isStable ? "s" : "v"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-center text-[13px] font-medium text-neutral-400 mt-3"
          >
            {isStable ? "Stablecoin, price stays the same" : "Crypto, price moves a lot"}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const WhatIsStablecoins = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    setActiveSection(Math.min(index, SECTION_COUNT - 1));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        const next = Math.min(activeSection + 1, SECTION_COUNT - 1);
        el.scrollTo({ top: next * el.clientHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeSection - 1, 0);
        el.scrollTo({ top: prev * el.clientHeight, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSection]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <Seo
        title="What is a Stablecoin? Types and trust explained"
        description="Discover what stablecoins are, the main types (fiat-backed, crypto-backed, algorithmic), and what makes a stablecoin trustworthy."
        path="/learn/what-is-stablecoins"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is a Stablecoin?",
          description: "Types of stablecoins and what makes them trustworthy.",
        }}
      />
      <ProgressDots active={activeSection} total={SECTION_COUNT} />

      {/* Section 1, Hero */}
      <Section>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[16px] text-neutral-400 uppercase tracking-[0.1em] mb-6"
        >
          Beginner path
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 45, damping: 20 }}
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-white text-center"
        >
          What is a Stablecoin?
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6 max-w-2xl space-y-3 text-center"
          style={{ maxWidth: "72ch" }}
        >
          <p className="text-[18px] leading-[1.7] text-neutral-300">
            Crypto like Bitcoin goes up and down in price, sometimes a lot.
          </p>
          <p className="text-[18px] leading-[1.7] text-neutral-300">
            A stablecoin is a type of crypto that <span className="font-bold text-white">stays at the same price.</span>
          </p>
          <p className="text-[18px] leading-[1.7] text-neutral-300">
            It's as fast as crypto, but as steady as regular money.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 0.6, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
          className="mt-10"
        >
          <ArrowDown className="w-5 h-5 text-neutral-400" />
        </motion.div>
      </Section>

      {/* Section 2, Volatility + Goal (merged) */}
      <Section className="justify-center pt-6 md:pt-0">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="max-w-[640px] w-full mx-auto">
            <VolatilityDemo />
          </div>
          <h2 className="text-2xl md:text-[3.25rem] font-bold tracking-tight leading-[1.1] text-white mt-6 md:mt-10 mb-2 md:mb-3">
            The goal is simple.
          </h2>
          <p className="text-[16px] md:text-[18px] leading-[1.7] text-neutral-300">
            1 stablecoin = 1 dollar.{" "}
            <span className="font-black text-white">Always.</span>
          </p>
        </div>
      </Section>

      {/* Section 3, Three Types */}
      <Section className="justify-center pt-6 md:pt-0">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-xl md:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-white text-center mb-6 md:mb-10">
            The three types of stablecoins
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
            {stablecoinTypes.map((type) => (
              <div key={type.title} className="rounded-lg border-2 border-black bg-white p-4 md:p-5">
                <div className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center mb-3">
                  <type.icon className="w-4 h-4 text-black" />
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-black mb-2">{type.title}</h3>
                <ul className="space-y-1.5">
                  {type.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-[11px] flex-shrink-0" />
                      <span className="text-[13px] md:text-[15px] leading-[1.7] text-neutral-500">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 4, Trust Checklist */}
      <Section className="justify-center pt-6 md:pt-0">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-xl md:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-white text-center mb-6 md:mb-10">
            What makes a stablecoin trustworthy?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            {trustChecklist.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:p-5 flex items-start gap-3 md:gap-4 transition-all duration-200 hover:border-black hover:-translate-y-1"
              >
                <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[14px] md:text-[15px] font-bold text-black mb-1">{item.title}</h3>
                  <p className="text-[13px] md:text-[15px] leading-[1.6] text-neutral-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 5, frxUSD Example */}
      <Section className="justify-center pt-6 md:pt-0">
        <div className="max-w-3xl w-full mx-auto">
          <div className="rounded-lg border-2 border-black bg-neutral-50 p-5 md:p-10 shadow-[4px_4px_0_0_hsl(0_0%_0%)]">
            <span className="text-[13px] text-neutral-400 uppercase tracking-[0.15em]">Example</span>
            <h2 className="text-[1.5rem] md:text-[2.25rem] font-bold tracking-tight leading-[1.1] text-black mt-2 mb-3 md:mb-4">
              Where frxUSD fits in
            </h2>
            <p className="text-[13px] md:text-[15px] leading-[1.7] text-neutral-500 mb-4 md:mb-5">
              frxUSD is a stablecoin by Frax. It's fully backed, transparent, and works across DeFi and traditional finance.
            </p>
            <ul className="space-y-2 mb-6 md:mb-8">
              <Bullet>Backed by U.S. Treasury Bills and high-quality reserves</Bullet>
              <Bullet>Proof of reserves you can check on-chain</Bullet>
              <Bullet>Built for both spending and saving</Bullet>
              <Bullet>Designed to meet regulations</Bullet>
            </ul>
            <Link
              to="/learn/what-is-frax"
              className="inline-block rounded-xl border-2 border-black bg-black px-5 md:px-7 py-3 md:py-3.5 text-[15px] md:text-[18px] font-bold text-white hover:bg-neutral-900 hover:scale-[1.02] hover:-translate-y-0.5 transition-all"
            >
              Next: What is Frax?
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default WhatIsStablecoins;
