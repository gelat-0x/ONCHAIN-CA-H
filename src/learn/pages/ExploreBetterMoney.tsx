import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Shield, TrendingUp, Globe, Building2, Code, Search,
  ExternalLink, BookOpen,
} from "lucide-react";

import frxUSDLogo from "@learn/assets/frxUSD-logo.png";
import TransparencyReserves from "@learn/components/TransparencyReserves";
import { useFrxUsdLive } from "@learn/hooks/useFrxUsdLive";
import { useHeroApr } from "@learn/hooks/useHeroApr";
import Seo from "@learn/components/Seo";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LAZY IMAGE, IntersectionObserver fade-in
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const LazyImg = ({ className = "", style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setLoaded(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const baseOpacity = (style as any)?.opacity;
  return (
    <img
      ref={ref}
      loading="lazy"
      decoding="async"
      {...rest}
      className={`${className} ${loaded ? "img-loaded" : ""}`}
      style={{
        ...style,
        opacity: loaded ? (baseOpacity ?? 1) : 0,
        transition: "opacity 0.5s ease",
      }}
    />
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANIMATED COUNTER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const AnimatedCounter = ({
  target, prefix = "", suffix = "", decimals = 0, duration = 1800, className = ""
}: {
  target: number; prefix?: string; suffix?: string; decimals?: number; duration?: number; className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <motion.span ref={ref} initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
      className={`font-mono tabular-nums ${className}`}>
      {prefix}{display}{suffix}
    </motion.span>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION WRAPPER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const Section = ({ children, id, className = "", noDivider = false }: {
  children: React.ReactNode; id?: string; className?: string; noDivider?: boolean;
}) => (
  <section id={id} className={`py-10 md:py-28 px-5 md:px-6 lg:px-8 relative ${className}`}>
    {!noDivider && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-[hsl(0,0%,14%)] to-transparent" />
    )}
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(0,0%,55%)] font-medium mb-4">{children}</p>
);
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[hsl(0,0%,95%)] mb-4">{children}</h2>
);
const SectionSub = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-[hsl(0,0%,55%)] leading-relaxed max-w-2xl">{children}</p>
);

const cardBase = "p-6 rounded-2xl border border-[hsl(0,0%,14%)]/40 bg-[hsl(0,0%,7%)]/40 hover:border-[hsl(0,0%,14%)]/70 hover:bg-[hsl(0,0%,7%)]/70 transition-colors duration-300";

const flipFaceBase =
  "absolute inset-0 overflow-hidden flex flex-col p-6 rounded-2xl border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,8%)]";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FLOATING PARTICLES (Hero background)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const n = i + 1;
  return {
    id: i,
    x: ((n * 37) % 97) + 1.5,
    y: ((n * 53) % 94) + 3,
    size: 2 + ((n * 3) % 4),
    duration: 18 + ((n * 7) % 16),
    delay: (n * 0.47) % 8,
    opacity: 0.1 + ((n % 5) * 0.03),
  };
});

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-full bg-[hsl(0,0%,95%)]"
        style={{
          width: p.size,
          height: p.size,
          left: `${p.x}%`,
          top: `${p.y}%`,
          opacity: p.opacity,
          boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,0.35)`,
        }}
        animate={{
          y: [0, -28, 14, -20, 0],
          x: [0, 12, -10, 8, 0],
          opacity: [p.opacity, p.opacity * 1.4, p.opacity * 0.85, p.opacity * 1.25, p.opacity],
        }}
        transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
      />
    ))}
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: "80px 80px",
    }} />
  </div>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HERO — rotating second line
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const HERO_ROTATE_WORDS = [
  'Your Control',
  'Transparent',
  'Earning',
  'But better',
  'Online',
] as const;
const HERO_ROTATE_MS = 3200;

const RotatingHeroLine = () => {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_ROTATE_WORDS.length);
    }, HERO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const word = HERO_ROTATE_WORDS[index] ?? HERO_ROTATE_WORDS[0];

  return (
    <span className="explore-hero__rotate" aria-live="polite">
      {reduceMotion ? (
        <span className="explore-hero__rotate-word">Everywhere.</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            className="explore-hero__rotate-word"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}.
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HERO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const live = useFrxUsdLive();
  const { apr: liveApr } = useHeroApr();

  const circulationM = (live.circulation || 138_900_000) / 1_000_000;

  const metrics = [
    { label: "ALWAYS WORTH", prefix: "$", target: 1, decimals: 2, suffix: "", sub: "Stable, anytime", live: false },
    { label: "In use", prefix: "≈ $", target: Math.round(circulationM), decimals: 0, suffix: "M", sub: "Dollars in circulation", live: true },
    {
      label: "Your money can grow",
      prefix: "~",
      target: liveApr,
      decimals: 2,
      suffix: "%",
      sub: "yearly",
      live: true,
    },
  ];

  return (
    <section
      ref={ref}
      className="min-h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] flex items-center justify-center px-5 md:px-6 pt-4 pb-3 relative overflow-hidden"
    >
      <FloatingParticles />
      <div className="absolute inset-0 pointer-events-none">
        <LazyImg
          src="/learn/images/usd-coins-bg.png"
          alt=""
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover opacity-[0.28] blur-[2px]"
          style={{ opacity: 0.28 }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,4%)]/40 via-[hsl(0,0%,4%)]/20 to-[hsl(0,0%,4%)]/70 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[hsl(0,0%,95%)]/[0.05] blur-[180px] rounded-full pointer-events-none" />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="inline-block border border-[hsl(0,0%,14%)]/60 bg-[hsl(0,0%,12%)]/40 rounded-full px-4 py-1.5 text-xs text-[hsl(0,0%,55%)]">
          frxUSD
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-[hsl(0,0%,95%)]">
          Your Dollar.<br /><RotatingHeroLine />
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="text-base md:text-lg text-[hsl(0,0%,55%)] max-w-2xl mx-auto leading-relaxed">
          Always $1. Works everywhere, anytime.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
          className="flex items-center justify-center gap-4 flex-wrap pt-2">
          <a href="https://frax.com/swap" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 bg-[hsl(0,0%,95%)] text-[hsl(0,0%,4%)] font-semibold rounded-full hover:bg-[hsl(0,0%,95%)]/90 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2">
            Get Dollars <ExternalLink className="w-4 h-4" />
          </a>
          <a href="https://docs.frax.com/frxusd" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 border border-[hsl(0,0%,14%)] text-[hsl(0,0%,95%)] font-medium rounded-full hover:bg-[hsl(0,0%,12%)]/50 transition-all inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> How it works
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
          {metrics.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              className={`${cardBase} p-5 text-center backdrop-blur-sm`}>
              <p className="text-xs uppercase tracking-wider text-[hsl(0,0%,55%)]/80 mb-2">{m.label}</p>
              <AnimatedCounter
                key={`m-${i}-${m.target}`}
                target={m.target}
                prefix={m.prefix}
                suffix={m.suffix}
                decimals={m.decimals}
                className="text-2xl font-bold text-[hsl(0,0%,95%)]"
              />
              <p className="text-[11px] text-[hsl(0,0%,55%)]/70 mt-1 leading-snug">{m.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SIX REASONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const scrollToReserves = (e: React.MouseEvent) => {
  e.stopPropagation();
  const el = document.getElementById("transparency-reserves");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const ReserveLink = ({ children }: { children: React.ReactNode }) => (
  <button
    type="button"
    onClick={scrollToReserves}
    className="underline decoration-[hsl(0,0%,55%)]/60 underline-offset-4 hover:decoration-[hsl(0,0%,95%)] hover:text-[hsl(0,0%,95%)] transition-colors"
  >
    {children}
  </button>
);

const benefitsData: Array<{
  icon: typeof Shield;
  title: string;
  desc: string;
  back: React.ReactNode;
}> = [
  {
    icon: Shield, title: "Always worth $1", desc: "Your money stays stable. Always.",
    back: "Your $1 stays $1, anytime, anywhere.",
  },
  {
    icon: Globe, title: "Your money everywhere", desc: "Use your money anywhere.",
    back: "Move it across apps, countries, and networks anytime.",
  },
  {
    icon: TrendingUp, title: "Your money can work for you", desc: "It doesn’t just sit there. It can slowly grow over time.",
    back: "Your balance can slowly grow, based on current conditions.",
  },
  {
    icon: Building2, title: "Backed by real money", desc: "Each dollar is backed by safe, real-world assets.",
    back: (
      <>
        Each dollar is backed by safe, <ReserveLink>real-world assets</ReserveLink> you can see yourself.
      </>
    ),
  },
  {
    icon: Code, title: "Easy to use", desc: "Feels like digital cash in apps and wallets.",
    back: "Send, receive, and pay, just like cash, only digital.",
  },
  {
    icon: Search, title: "Nothing hidden", desc: "You can actually check what stands behind your money.",
    back: (
      <>
        Open and verifiable, <ReserveLink>see what stands behind your money</ReserveLink> anytime.
      </>
    ),
  },
];

/* Flip card — hover on desktop, tap on mobile */
const FlipCard = ({ b, index, isInView }: { b: typeof benefitsData[number]; index: number; isInView: boolean }) => {
  const [flipped, setFlipped] = useState(false);

  const faceStyle: React.CSSProperties = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transformStyle: "flat",
    WebkitTransformStyle: "flat",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -3 }}
      onHoverStart={() => setFlipped(true)}
      onHoverEnd={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
      className="group relative h-56 cursor-pointer"
      style={{ perspective: "1400px" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      aria-label={`${b.title}, hover or tap to learn more`}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT */}
        <div
          className={flipFaceBase}
          style={{ ...faceStyle, transform: "translateZ(1px)" }}
          aria-hidden={flipped}
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="p-3 rounded-xl bg-[hsl(0,0%,12%)] w-fit mb-5 border border-[hsl(0,0%,18%)]">
              <b.icon className="w-5 h-5 text-[hsl(0,0%,95%)]" />
            </div>
            <h3 className="text-base font-semibold text-[hsl(0,0%,95%)] mb-2">{b.title}</h3>
            <p className="text-sm text-[hsl(0,0%,55%)] leading-relaxed">{b.desc}</p>
            <p className="mt-auto text-[10px] uppercase tracking-[0.15em] text-[hsl(0,0%,40%)]">Hover to learn more</p>
          </div>
        </div>

        {/* BACK */}
        <div
          className={`${flipFaceBase} justify-center bg-[hsl(0,0%,6%)]`}
          style={{
            ...faceStyle,
            transform: "rotateY(180deg) translateZ(1px)",
          }}
          aria-hidden={!flipped}
        >
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.15em] text-[hsl(0,0%,50%)] mb-3">{b.title}</p>
            <p className="text-base text-[hsl(0,0%,95%)] leading-relaxed">{b.back}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Benefits = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <Section id="benefits">
      <div ref={ref}>
        <SectionLabel>Why people use it</SectionLabel>
        <SectionHeading>Why people use it</SectionHeading>
        <SectionSub>Simple. Works. Makes sense.</SectionSub>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {benefitsData.map((b, i) => (
            <FlipCard key={i} b={b} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </Section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOW PEOPLE USE IT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const useCasesData = [
  {
    n: "01",
    title: "Send money anywhere",
    body: "Send dollars to anyone, anywhere in the world. Arrives in seconds. No bank fees, no waiting days.",
  },
  {
    n: "02",
    title: "Pay for things",
    body: "Use frxUSD like normal dollars in apps, wallets, and platforms that accept digital payments.",
  },
  {
    n: "03",
    title: "Save and earn",
    body: "Let your dollars earn a little extra over time. No lock-up, no minimums. Just money working quietly.",
    showApr: true,
  },
  {
    n: "04",
    title: "Build on top of it",
    body: "Companies use frxUSD to power payments, treasury accounts, and financial products, all on one system.",
  },
];

export const HowPeopleUseIt = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { apr } = useHeroApr();
  return (
    <Section id="how-people-use-it">
      <div ref={ref}>
        <SectionLabel>How people use it</SectionLabel>
        <SectionHeading>Dollars that actually do something.</SectionHeading>
        <SectionSub>
          People use frxUSD for the same things they use normal money, just faster, cheaper, and without a bank in the middle.
        </SectionSub>

        <div className="mt-12 -mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none">
          <div className="flex md:grid md:grid-cols-2 gap-5 min-w-max md:min-w-0">
            {useCasesData.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`${cardBase} snap-start flex-shrink-0 w-[78vw] sm:w-[60vw] md:w-auto h-72 flex flex-col`}
              >
                <span className="text-xs font-mono tracking-[0.15em] text-[hsl(0,0%,40%)]">{c.n}</span>
                <h3 className="mt-6 text-xl font-semibold text-[hsl(0,0%,95%)]">{c.title}</h3>
                <p className="mt-3 text-sm text-[hsl(0,0%,55%)] leading-relaxed">{c.body}</p>
                {c.showApr && (
                  <span className="mt-4 inline-flex w-fit items-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] font-medium text-green-400">
                    Currently ~{apr.toFixed(2)}% yearly
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   frxUSD 3D TOKEN SPIN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TokenCoinSpin = ({ src, alt = "frxUSD" }: { src: string; alt?: string }) => (
  <div className="learn-frxusd-coin" aria-hidden>
    <div className="learn-frxusd-coin__pedestal" />
    <div className="learn-frxusd-coin__orbit">
      <div className="learn-frxusd-coin__body">
        {Array.from({ length: 11 }, (_, i) => (
          <span
            key={i}
            className="learn-frxusd-coin__slice"
            style={{ transform: `translateZ(${(i - 5) * 2.2}px)` }}
          />
        ))}
        <div className="learn-frxusd-coin__plate learn-frxusd-coin__plate--front">
          <span className="learn-frxusd-coin__plate-bg" />
          <img src={src} alt="" draggable={false} />
        </div>
        <div className="learn-frxusd-coin__plate learn-frxusd-coin__plate--back">
          <span className="learn-frxusd-coin__plate-bg" />
          <img src={src} alt="" draggable={false} />
        </div>
      </div>
    </div>
    <span className="sr-only">{alt}</span>
  </div>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CTA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const CTASection = () => (
  <Section className="!pb-4 md:!pb-8" noDivider>
    <div className="max-w-3xl mx-auto text-center explore-cta">
      <SectionHeading>Start using better money</SectionHeading>
      <p className="text-base text-[hsl(0,0%,65%)] leading-relaxed mb-6 md:mb-8 max-w-xl mx-auto">
        Simple. Stable. Ready to use.
      </p>
      <div className="flex justify-center mb-6 md:mb-10">
        <TokenCoinSpin src={frxUSDLogo} alt="frxUSD" />
      </div>
      <div className="explore-cta__actions flex items-center justify-center gap-3 md:gap-4 flex-wrap">
        <a
          href="https://frax.com/swap?tokenA=0x0000000000000000000000000000000000000000&tokenB=0xcacd6fd266af91b8aed52accc382b4e165586e29&originChainId=1&destinationChainId=1"
          target="_blank"
          rel="noopener noreferrer"
          className="explore-cta__btn explore-cta__btn--primary px-8 py-4 bg-[hsl(0,0%,95%)] text-[hsl(0,0%,4%)] font-semibold rounded-full hover:bg-[hsl(0,0%,95%)]/90 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
        >
          Get frxUSD <ExternalLink className="w-4 h-4" />
        </a>
        <a href="https://docs.frax.com/frxusd" target="_blank" rel="noopener noreferrer"
          className="explore-cta__btn explore-cta__btn--ghost px-8 py-4 border border-[hsl(0,0%,14%)] text-[hsl(0,0%,95%)] font-medium rounded-full hover:bg-[hsl(0,0%,12%)]/50 transition-all inline-flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4" /> Learn More
        </a>
      </div>
      <div className="relative inline-block mt-4 max-w-full">
        <span
          className="block text-center rounded-full font-medium whitespace-normal md:whitespace-nowrap px-5"
          style={{
            cursor: 'not-allowed',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.55)',
            paddingTop: '14px',
            paddingBottom: '14px',
            fontSize: '15px',
            minWidth: '164px',
            animation: 'borderBreath 3.5s ease-in-out infinite',
          }}
        >
          Explore how you can use your money
        </span>
        <span
          className="absolute"
          style={{
            top: '-11px',
            right: '20px',
            background: '#ffffff',
            color: '#000000',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '3px 10px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
          }}
        >
          Soon
        </span>
      </div>
    </div>
  </Section>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE FOOTER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PageFooter = () => (
  <footer className="explore-page-footer border-t border-[hsl(0,0%,14%)]/40 pt-6 pb-0 md:pt-8 px-5 md:px-6">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-5 mb-6 md:mb-8 text-center md:text-left">
        <div className="flex items-center gap-2">
          <LazyImg src={frxUSDLogo} alt="frxUSD" width={20} height={20} className="w-5 h-5 rounded-full" />
          <span className="text-sm font-semibold text-[hsl(0,0%,95%)]">frxUSD</span>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-2">
          {[
            { label: "FraxNet", href: "https://net.frax.com" },
            { label: "Documentation", href: "https://docs.frax.com" },
            { label: "Governance", href: "https://gov.frax.finance/" },
            { label: "GitHub", href: "https://github.com/fraxfinance" },
            { label: "Twitter", href: "https://x.com/fraxfinance?s=20" },
          ].map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,95%)] transition-colors">{l.label}</a>
          ))}
        </div>
      </div>
      <div className="border-t border-[hsl(0,0%,14%)]/20 pt-4 md:pt-6">
        <p className="text-xs text-[hsl(0,0%,55%)]/40 leading-relaxed max-w-3xl mx-auto md:mx-0 text-center md:text-left">
          frxUSD is issued by FRAX Inc. This page is for informational purposes only and does not constitute financial advice, an offer to sell, or a solicitation to buy any securities or financial instruments. Past performance does not guarantee future results. Always conduct your own research.
        </p>
      </div>
    </div>
  </footer>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ExploreBetterMoney = () => (
  <div className="explore-better-money bg-[hsl(0,0%,4%)] text-[hsl(0,0%,95%)] overflow-x-hidden"
    style={{ scrollBehavior: "smooth" }}>
    <Seo
      title="Explore Better Money, Live reserves and transparency"
      description="See live reserves, APR, and transparency data for frxUSD, Frax's digital dollar built for the internet era."
      path="/learn/explore-better-money"
    />
    <Hero />
    <Benefits />
    <TransparencyReserves />
    <CTASection />
    <PageFooter />
  </div>
);

export default ExploreBetterMoney;
