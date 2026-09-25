import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronDown, RotateCcw, Play } from "lucide-react";
import Seo from "@learn/components/Seo";

const SECTION_COUNT = 4;

/* ── Custom SVG Icons ── */
const SharedIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="6" r="2.5" />
    <circle cx="19" cy="6" r="2.5" />
    <circle cx="12" cy="19" r="2.5" />
    <line x1="7" y1="7.5" x2="17" y2="7.5" />
    <line x1="6.5" y1="8" x2="11" y2="17" />
    <line x1="17.5" y1="8" x2="13" y2="17" />
  </svg>
);

const AlwaysOnIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3 A9 9 0 0 1 21 12" strokeDasharray="5 3" />
    <path d="M8 12 L11 15 L16 10" />
  </svg>
);

/* Verifiable — magnifying glass with checkmark */
const VerifiableIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" />
    <path d="M7.5 10.5 L9.5 12.5 L13.5 8.5" strokeWidth="2.2" />
  </svg>
);

const properties = [
  {
    icon: SharedIcon,
    title: "Shared System",
    description: "No single company controls the records. Thousands of computers hold the same copy.",
  },
  {
    icon: AlwaysOnIcon,
    title: "Always On",
    description: "The network never closes. No weekends. No holidays. It runs all the time.",
  },
  {
    icon: VerifiableIcon,
    title: "Verifiable",
    description: "Every transaction is recorded permanently. Anyone can check it.",
  },
];

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

/* ── Section wrapper ── */
const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] w-full snap-start snap-always flex flex-col items-center justify-center px-5 md:px-6 shrink-0 overflow-hidden ${className}`}>
    {children}
  </section>
);

/* ── Scroll Down Indicator ── */
const ScrollIndicator = () => (
  <div className="mt-10 flex flex-col items-center">
    <ChevronDown
      className="w-5 h-5 text-foreground/60 animate-[float_2.5s_ease-in-out_infinite]"
      strokeWidth={2}
    />
    <p className="text-[10px] tracking-[0.15em] uppercase mt-2 text-foreground/50">
      scroll down
    </p>
  </div>
);

/* ── Connection Lines SVG ── */
const ConnectionLines = ({ visible }: { visible: boolean }) => (
  <svg className="w-full h-16 mt-6 mb-4" viewBox="0 0 600 60" preserveAspectRatio="xMidYMid meet">
    {[100, 300, 500].map((x, i) => (
      <motion.path
        key={i}
        d={`M ${x} 0 Q 300 30 300 60`}
        fill="none"
        stroke="hsl(var(--muted-foreground) / 0.2)"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={visible ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
      />
    ))}
  </svg>
);

/* ── Main Page ── */
const WhatIsBlockchain = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [, setHintDismissed] = useState(false);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => { setVideoEnded(true); setHasPlayed(false); };
    video.addEventListener("ended", onEnded);
    return () => { video.removeEventListener("ended", onEnded); };
  }, []);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setHasPlayed(true);
    setVideoEnded(false);
    setIsPaused(false);
    setHintDismissed(false);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    const video = videoRef.current;
    if (!video || !hasPlayed || videoEnded) return;
    setHintDismissed(true);
    if (video.paused) {
      video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <Seo
        title="What is Blockchain? How digital money actually works"
        description="A clear, visual explainer of blockchain: how transactions are recorded, why it matters for money, and how it powers stablecoins."
        path="/learn/what-is-blockchain"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is Blockchain?",
          description: "How blockchain technology works and why it matters for money.",
        }}
      />
      <ProgressDots active={activeSection} total={SECTION_COUNT} />

      {/* Section 1, Hero */}
      <Section>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[16px] text-muted-foreground uppercase tracking-[0.1em] mb-6"
        >
          Beginner path
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 45, damping: 20 }}
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground text-center"
        >
          What is Blockchain?
        </motion.h1>
        <div className="mt-6 space-y-1.5 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-[18px] leading-[1.7] text-muted-foreground/70"
          >
            The year is 2009.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-[18px] leading-[1.7] text-muted-foreground"
          >
            A system was created to redefine internet money.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-[22px] leading-[1.6] font-bold text-foreground pt-2"
          >
            But how?
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <ScrollIndicator />
        </motion.div>
      </Section>

      {/* Section 2, Video */}
      <Section className="!px-0 md:!px-6">
        <div className="w-full md:w-[min(900px,90vw)] md:mx-auto">
          <div className="rounded-none md:rounded-xl border-0 md:border-2 border-foreground bg-card overflow-hidden">
            <div className="px-6 pt-5">
              <span className="text-[16px] text-muted-foreground uppercase tracking-[0.1em]">The idea</span>
            </div>
            <div className="pt-4 pb-0 md:pb-6">
              <div className="relative w-full aspect-[3/2] sm:aspect-[16/9] md:rounded-lg bg-foreground overflow-hidden group">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isPaused ? "opacity-90" : "opacity-100"
                  } ${hasPlayed && !videoEnded ? "cursor-pointer" : ""}`}
                  muted
                  loop={false}
                  playsInline
                  preload="metadata"
                  poster="/learn/videos/posters/what-is-blockchain.jpg"
                  onClick={handleTogglePause}
                >
                  <source src="/learn/videos/what-is-blockchain.mp4" type="video/mp4" />
                </video>

                {(!hasPlayed || videoEnded) && (
                  <button
                    onClick={handlePlay}
                    aria-label="Play video"
                    className="absolute inset-0 flex items-center justify-center z-10 animate-fade-in"
                  >
                    <div className="absolute inset-0 bg-foreground/20" />
                    <div className="relative w-16 h-16 rounded-full bg-background/90 border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] flex items-center justify-center hover:bg-background hover:scale-105 transition-transform">
                      <Play className="w-6 h-6 text-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </button>
                )}

                <button
                  onClick={handleRestart}
                  aria-label="Restart video"
                  className={`absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-foreground/60 px-3 py-1.5 text-[13px] text-background backdrop-blur-sm transition-opacity z-20 ${
                    videoEnded ? "opacity-90" : "opacity-0 group-hover:opacity-70"
                  } hover:!opacity-100`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart
                </button>
              </div>
              <p className="mt-3 text-center text-[12px] tracking-[0.02em] text-muted-foreground/70 animate-fade-in px-6 md:px-0">
                tap to pause video
              </p>
            </div>
          </div>
        </div>
        <ScrollIndicator />
      </Section>

      {/* Section 3, How it works */}
      <Section className="!justify-start md:!justify-center pt-6 md:pt-0">
        <div className="max-w-4xl w-full mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-foreground text-center mb-6 md:mb-8"
          >
            How does it work?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {properties.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border-2 border-foreground bg-card p-4 md:p-5 flex md:block items-start gap-4"
              >
                <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-lg border-2 border-foreground flex items-center justify-center md:mb-3">
                  <prop.icon />
                </div>
                <div>
                  <h3 className="text-[15px] md:text-[15px] font-bold text-foreground mb-1 md:mb-1.5">{prop.title}</h3>
                  <p className="text-[13px] md:text-[14px] leading-[1.5] md:leading-[1.6] text-muted-foreground">{prop.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:block">
            <ConnectionLines visible={activeSection >= 2} />
          </div>
          <div className="flex justify-center md:hidden py-3">
            <div className="w-px h-6 bg-border" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-3 rounded-lg border-2 border-foreground bg-muted/50 px-4 md:px-6 py-3 md:py-4 shadow-[2px_2px_0_0_hsl(var(--foreground))]">
              <p className="text-[13px] md:text-[15px] leading-[1.5] md:leading-[1.6] text-muted-foreground text-center">
                Trust comes from the <span className="font-bold text-foreground">network</span>, not from one company.
              </p>
            </div>
          </motion.div>
        </div>
        <div className="hidden md:block">
          <ScrollIndicator />
        </div>
      </Section>

      {/* Section 4, CTA */}
      <Section>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground mb-8 text-center"
        >
          This is where money changes.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Link
            to="/learn/what-is-stablecoins"
            className="inline-block rounded-xl border-2 border-foreground bg-foreground px-7 py-3.5 text-[18px] font-bold text-background hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Next: What are Stablecoins?
          </Link>
        </motion.div>
      </Section>
    </div>
  );
};

export default WhatIsBlockchain;
