import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import frxUSDLogo from "@learn/assets/frxUSD-2.png";
import sfrxUSDLogo from "@learn/assets/sFrxUSD.png";
import Seo from "@learn/components/Seo";

const SECTION_COUNT = 4;

/* ── Transaction data for Spend animation ── */
const transactions = [
  { fromCity: "New York", fromFlag: "\u{1F1FA}\u{1F1F8}", fromName: "Alex Carter", toCity: "Nairobi", toFlag: "\u{1F1F0}\u{1F1EA}", toName: "David Mwangi", amount: "250.00" },
  { fromCity: "Berlin", fromFlag: "\u{1F1E9}\u{1F1EA}", fromName: "Lukas Weber", toCity: "S\u00e3o Paulo", toFlag: "\u{1F1E7}\u{1F1F7}", toName: "Ana Silva", amount: "120.00" },
  { fromCity: "Tokyo", fromFlag: "\u{1F1EF}\u{1F1F5}", fromName: "Yuki Tanaka", toCity: "London", toFlag: "\u{1F1EC}\u{1F1E7}", toName: "James Carter", amount: "480.00" },
  { fromCity: "Dubai", fromFlag: "\u{1F1E6}\u{1F1EA}", fromName: "Omar Hassan", toCity: "Mumbai", toFlag: "\u{1F1EE}\u{1F1F3}", toName: "Ravi Patel", amount: "90.00" },
];

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 45, damping: 20 } },
};
const cardContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/* ── Shared components ── */
const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-[11px] flex-shrink-0" />
    <span className="text-[17px] leading-[1.65] text-muted-foreground">{children}</span>
  </li>
);

const CtaArrow = ({ onClick, label = "Next" }: { onClick: () => void; label?: string }) => (
  <motion.button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    aria-label={label}
    className="absolute bottom-5 right-5 w-10 h-10 rounded-xl border-2 border-border bg-muted/50 flex items-center justify-center text-muted-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.95 }}
  >
    <ArrowRight className="w-4 h-4" />
  </motion.button>
);

const InfoCard = ({ title, desc }: { title: string; desc: string }) => (
  <motion.div
    className="rounded-xl border border-border/80 bg-card p-6 md:p-7 h-full flex flex-col shadow-[inset_0_1px_0_0_hsl(var(--background)/0.6)]"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
  >
    <h4 className="text-[17px] font-bold tracking-tight text-foreground mb-2">{title}</h4>
    <p className="text-[14px] leading-[1.75] text-muted-foreground/80">{desc}</p>
  </motion.div>
);

/* ── Progress Dots ── */
const ProgressDots = ({ active, total }: { active: number; total: number }) => (
  <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full border border-foreground/30"
        animate={{
          backgroundColor: i === active ? "hsl(var(--foreground))" : "hsl(var(--background))",
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

/* ── Transaction Animation (Spend Mode) ── */
const TransactionAnimation = () => {
  const [txIdx, setTxIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTxIdx((prev) => (prev + 1) % transactions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tx = transactions[txIdx];

  return (
    <div className="w-[240px] rounded-xl border-2 border-foreground bg-card overflow-hidden shadow-[3px_3px_0_0_hsl(var(--foreground)/0.08)]">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="text-[11px] text-muted-foreground ml-1.5">Send</span>
      </div>
      <div className="p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={txIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{tx.fromCity} {tx.fromFlag}</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {"\u2192"}
              </motion.span>
              <span>{tx.toCity} {tx.toFlag}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span>{tx.fromName}</span>
              <span>{tx.toName}</span>
            </div>
            <div className="text-center">
              <span className="text-[22px] font-bold text-foreground">${tx.amount}</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60">
              <span>${tx.amount} sent</span>
              <span>=</span>
              <span>${tx.amount} received</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/40 pt-0.5">
              <span>instant</span>
              <span>&middot;</span>
              <span>global</span>
              <span>&middot;</span>
              <span>same value</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Save Balance Animation ── */
const SaveAnimation = () => {
  const [balance, setBalance] = useState(1000.00);
  const [earned, setEarned] = useState(0.00);

  useEffect(() => {
    const interval = setInterval(() => {
      const increment = +(Math.random() * 0.8 + 0.3).toFixed(2);
      setBalance((prev) => +(prev + increment).toFixed(2));
      setEarned((prev) => +(prev + increment).toFixed(2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((earned / 50) * 100, 100);

  return (
    <div className="w-[240px] rounded-xl border-2 border-foreground bg-card overflow-hidden shadow-[3px_3px_0_0_hsl(var(--foreground)/0.08)]">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="text-[11px] text-muted-foreground ml-1.5">Savings</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-[11px] text-muted-foreground">Balance</div>
        <motion.div
          className="text-[22px] font-bold text-foreground"
          key={balance.toFixed(2)}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.div>
        <div className="rounded-lg bg-muted/50 border border-border p-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Earned</div>
          <motion.div
            className="text-[16px] font-bold text-foreground"
            key={earned.toFixed(2)}
            initial={{ opacity: 0.7, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            +${earned.toFixed(2)}
          </motion.div>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Spend Card ── */
const SpendCard = () => {
  const [page, setPage] = useState(1);
  return (
    <div className="rounded-xl border-2 border-foreground bg-card p-5 md:p-10 relative overflow-hidden shadow-[4px_4px_0_0_hsl(var(--foreground)/0.05),inset_0_1px_0_0_hsl(var(--background)/0.5)] min-h-[280px] md:min-h-[320px] pb-14 md:pb-10">
      <AnimatePresence mode="wait">
        {page === 1 ? (
          <motion.div key="spend-1" variants={cardContentVariants} initial="hidden" animate="visible" exit="exit">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1">
                <img src={frxUSDLogo} alt="frxUSD digital dollar logo" width={44} height={44} loading="lazy" decoding="async" className="w-11 h-11 mb-3" />
                <h3 className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-foreground mb-1.5">frxUSD</h3>
                <p className="text-[15px] md:text-[17px] leading-[1.6] text-muted-foreground mb-3">Use dollars online.</p>
                <ul className="space-y-1.5 mb-4">
                  <Bullet>Always worth $1</Bullet>
                  <Bullet>Send anywhere, instantly</Bullet>
                  <Bullet>No bank account needed</Bullet>
                  <Bullet>Works 24/7, no weekends</Bullet>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <TransactionAnimation />
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setPage(2); }}
              className="absolute bottom-5 left-5 inline-flex items-center gap-2 text-[14px] font-medium text-muted-foreground/70 hover:text-foreground hover:underline underline-offset-4 cursor-pointer transition-all duration-200"
            >
              How it stays at $1 <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <CtaArrow onClick={() => setPage(2)} />
          </motion.div>
        ) : (
          <motion.div key="spend-2" variants={cardContentVariants} initial="hidden" animate="visible" exit="exit">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-[1.1] text-foreground mb-2">How it stays at $1</h3>
            <p className="text-[15px] leading-[1.7] text-muted-foreground/80 mb-6">Every dollar is backed by real assets you can verify.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { title: "Real-world backing", desc: "Every frxUSD is backed by real assets like short-term U.S. government bonds." },
                { title: "Always redeemable", desc: "You can always exchange it back for $1 worth of underlying value." },
                { title: "Transparent reserves", desc: "The system shows what backs it, so users can verify it at any time." },
              ].map((item, i) => (
                <motion.div key={item.title} className="h-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.25 }}>
                  <InfoCard {...item} />
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button onClick={() => setPage(1)} className="inline-flex items-center gap-2 text-[15px] text-muted-foreground hover:text-foreground transition-colors duration-200">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <Link to="/learn/explore-better-money" className="inline-flex items-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                See more on Better Money page <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Save Card ── */
const SaveCard = () => {
  const [page, setPage] = useState(1);
  return (
    <div className="rounded-xl border-2 border-foreground bg-card p-5 md:p-10 relative overflow-hidden shadow-[4px_4px_0_0_hsl(var(--foreground)/0.05),inset_0_1px_0_0_hsl(var(--background)/0.5)] min-h-[280px] md:min-h-[320px] pb-14 md:pb-10">
      <AnimatePresence mode="wait">
        {page === 1 ? (
          <motion.div key="save-1" variants={cardContentVariants} initial="hidden" animate="visible" exit="exit">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1">
                <img src={sfrxUSDLogo} alt="sfrxUSD savings token logo" width={44} height={44} loading="lazy" decoding="async" className="w-11 h-11 mb-3" />
                <h3 className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-foreground mb-1.5">sfrxUSD</h3>
                <p className="text-[15px] md:text-[17px] leading-[1.6] text-muted-foreground mb-3">Let your dollars grow over time.</p>
                <ul className="space-y-1.5 mb-4">
                  <Bullet>Deposit frxUSD, receive sfrxUSD</Bullet>
                  <Bullet>Your balance slowly grows</Bullet>
                  <Bullet>Withdraw anytime</Bullet>
                  <Bullet>Earnings come from real sources</Bullet>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <SaveAnimation />
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setPage(2); }}
              className="absolute bottom-5 left-5 inline-flex items-center gap-2 text-[14px] font-medium text-muted-foreground/70 hover:text-foreground hover:underline underline-offset-4 cursor-pointer transition-all duration-200"
            >
              Where does my extra money come from? <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <CtaArrow onClick={() => setPage(2)} />
          </motion.div>
        ) : (
          <motion.div key="save-2" variants={cardContentVariants} initial="hidden" animate="visible" exit="exit">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-[1.1] text-foreground mb-2">Where your extra money comes from</h3>
            <p className="text-[15px] leading-[1.7] text-muted-foreground/80 mb-6">Your dollars are put to work in real, reliable ways.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { title: "Government bonds", desc: "Your dollars earn steady interest from short-term U.S. government bonds, the safest investment that exists." },
                { title: "Lending to others", desc: "Some dollars are lent out to borrowers. They pay interest fees, and a part of those fees comes back to you." },
                { title: "Earning from traders", desc: "Some dollars collect small fees that traders pay to hold their positions open. No price risk, just steady fees." },
              ].map((item, i) => (
                <motion.div key={item.title} className="h-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.25 }}>
                  <InfoCard {...item} />
                </motion.div>
              ))}
            </div>
            <p className="text-[14px] leading-[1.7] text-muted-foreground/70 mb-4 max-w-3xl">
              Frax automatically picks whichever of the three earns the most right now, and switches quietly in the background. You don't do anything.
            </p>
            <button onClick={() => setPage(1)} className="inline-flex items-center gap-2 text-[15px] text-muted-foreground hover:text-foreground transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main Page ── */
const WhatIsFrax = () => {
  const [mode, setMode] = useState<"spend" | "save">("spend");
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
        title="What is Frax? Digital dollars for the internet era"
        description="Explore Frax's digital dollar (frxUSD) and savings token (sfrxUSD), built for spending, saving, and the internet era."
        path="/learn/what-is-frax"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is Frax?",
          description: "Frax's digital dollar, built for spending and saving on the internet.",
        }}
      />
      <ProgressDots active={activeSection} total={SECTION_COUNT} />

      {/* Section 1, Hero */}
      <Section>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.p variants={itemVariants} className="text-[15px] text-muted-foreground uppercase tracking-[0.1em] mb-4">
            Beginner path
          </motion.p>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
            Digital dollars for the internet era
          </motion.h1>
          <motion.div variants={itemVariants} className="mt-4 max-w-2xl mx-auto space-y-2" style={{ maxWidth: "72ch" }}>
            <p className="text-[17px] leading-[1.65] text-muted-foreground">
              <span className="font-bold text-foreground">Frax built a digital dollar that can work perfectly in the internet era.</span>
            </p>
            <p className="text-[17px] leading-[1.65] text-muted-foreground">
              A stablecoin you can use in two modes: <span className="font-bold text-foreground">Spend Mode</span> or <span className="font-bold text-foreground">Save Mode</span>.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="mt-8"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowDown className="w-5 h-5 text-muted-foreground mx-auto" />
          </motion.div>
        </motion.div>
      </Section>

      {/* Section 2, Two Modes: Spend */}
      <Section>
        <div className="max-w-4xl w-full mx-auto md:-mt-24">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-foreground text-center mb-6 md:mb-10">
            Two modes. One dollar.
          </h2>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-xl border-[2.5px] border-foreground overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 w-1/2 bg-foreground rounded-lg"
                animate={{ x: mode === "spend" ? 0 : "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setMode("spend")}
                className={`relative z-10 px-6 py-2.5 text-[17px] font-bold transition-colors duration-200 ${
                  mode === "spend" ? "text-background" : "text-foreground hover:text-foreground/70"
                }`}
              >
                Spend Mode
              </button>
              <button
                onClick={() => setMode("save")}
                className={`relative z-10 px-6 py-2.5 text-[17px] font-bold transition-colors duration-200 ${
                  mode === "save" ? "text-background" : "text-foreground hover:text-foreground/70"
                }`}
              >
                Save Mode
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "spend" ? (
              <motion.div key="spend" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                <SpendCard />
              </motion.div>
            ) : (
              <motion.div key="save" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <SaveCard />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            className="text-center text-[12px] text-muted-foreground/45 uppercase tracking-[0.18em] mt-8"
            animate={{ opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            Scroll down
          </motion.p>
        </div>
      </Section>

      {/* Section 3, Summary */}
      <Section>
        <div className="max-w-2xl text-center space-y-4 md:space-y-6">
          <p className="text-[17px] md:text-[24px] leading-[1.6] md:leading-[1.7] text-muted-foreground/60">
            Traditional money is slow. It stops on weekends. It costs more to move across borders.
          </p>
          <p className="text-[17px] md:text-[24px] leading-[1.6] md:leading-[1.7] text-muted-foreground">
            <span className="font-bold text-foreground">Frax changes that.</span>{" "}
            Instant transfers. No middlemen. Always accessible.
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] text-foreground pt-2 md:pt-4">
            A better dollar for the internet.
          </h2>
        </div>
      </Section>

      {/* Section 4, CTA */}
      <Section>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground mb-6 md:mb-8 text-center"
        >
          Ready to explore?
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Link
            to="/learn/explore-better-money"
            className="inline-block rounded-xl border-2 border-foreground bg-foreground px-7 py-3.5 text-[17px] font-bold text-background hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          >
            Explore Better Money
          </Link>
        </motion.div>
      </Section>
    </div>
  );
};

export default WhatIsFrax;
