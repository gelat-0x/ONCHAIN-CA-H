import { Link } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
import LazyVideo from "@learn/components/LazyVideo";
import Seo from "@learn/components/Seo";

/* Map every video to its generated poster (first-frame jpg). */
const posterFor = (src: string) => {
  const file = src.split("/").pop() || "";
  const base = file.replace(/\.(mp4|webm)$/i, "");
  return `/learn/videos/posters/${base}.jpg`;
};

/* ── Timeline Data ── */
interface TimelineStep {
  period: string;
  title: string;
  description: string;
  videoSrc?: string;
}

const timelineSteps: TimelineStep[] = [
  {
    period: "Early days",
    title: "Metal coins",
    description:
      "In the beginning we used mostly metal coins of silver and gold as money. The good thing about it is that it is valuable and easy to trust. The difficult part is that it is heavy and easy to steal.",
    videoSrc: "/learn/videos/coins_drop_v2.mp4",
  },
  {
    period: "1600s",
    title: "Paper Notes",
    description:
      "Banks used papernotes as a promise that you will get the metal coins later when you deliver the note to the bank. Paper notes made it easier to travel. However, you had to trust the that the bank had the metal coins when you came to get them.",
    videoSrc: "/learn/videos/paper_notes.mp4",
  },
  {
    period: "1800s",
    title: "Checks",
    description:
      "Banks invented checks. That made it safer to travel around. You did not need to carry a lot of bills with you, and you could do big payments when you needed.",
    videoSrc: "/learn/videos/cheques.mp4",
  },
  {
    period: "1900s",
    title: "National money",
    description:
      "In the 1900s countries started to create central banks to manage and issue money. And with that, the trust moved from banks to governments. And with the arrival of the electrical era, wire transfers and computers could be used to send money.",
    videoSrc: "/learn/videos/cash.mp4",
  },
  {
    period: "2000s",
    title: "Digital banking",
    description:
      "As technology improved, money improved with it. During the 2000s online banking and mobile payments came which enabled super convenient and fast transfers.",
    videoSrc: "/learn/videos/digital_banking.mp4",
  },
  {
    period: "Today",
    title: "Blockchain",
    description:
      "Things improved, and in 2009, a major discovery was made. Bitcoin was created, which lays the foundation for a system where you don't need to trust any bank or government to send or receive money.",
    videoSrc: "/learn/videos/Bitcoin.mp4",
  },
];

const coreFunctions = [
  { num: "01", title: "Store Value", description: "It lets you save purchasing power for the future." },
  { num: "02", title: "Measure Value", description: "It gives everything a price you can compare." },
  { num: "03", title: "Exchange Value", description: "It lets you trade goods and services easily." },
];

/* Total snap sections: hero + functions + transition + 6 timeline + outro = 10 */
const TOTAL_SECTIONS = 3 + timelineSteps.length + 1;
const TIMELINE_START = 3;

/* ── Scroll-reveal hook ── */
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.classList.add("is-visible");
      el.style.willChange = "auto";
      return;
    }
    // Free GPU memory once the reveal transition has finished
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === "transform" || e.propertyName === "opacity") {
        el.style.willChange = "auto";
        el.removeEventListener("transitionend", onEnd);
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.willChange = "transform, opacity";
          el.classList.add("is-visible");
          el.addEventListener("transitionend", onEnd);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
};

/* ── Snap Section wrapper ── */
const SnapSection = ({
  children,
  className = "",
  index,
  registerRef,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  registerRef: (i: number, el: HTMLElement | null) => void;
}) => (
  <section
    ref={(el) => registerRef(index, el)}
    className={`snap-start snap-always h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] w-full flex flex-col items-center justify-center shrink-0 overflow-hidden px-5 md:px-0 ${className}`}
  >
    {children}
  </section>
);

/* ── Vertical Progress Bar (replaces dots) ── */
const ProgressBar = ({
  active,
  total,
  onDotClick,
}: {
  active: number;
  total: number;
  onDotClick: (i: number) => void;
}) => {
  const progress = total > 1 ? active / (total - 1) : 0;

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center">
      <div className="relative w-[3px] rounded-full overflow-hidden" style={{ height: "140px", background: "hsl(var(--border) / 0.15)" }}>
        <div
          className="absolute top-0 left-0 w-full h-full rounded-full origin-top"
          style={{
            transform: `scaleY(${progress})`,
            transition: "transform 0.7s cubic-bezier(0.25,0.1,0.25,1)",
            willChange: "transform",
            background: "hsl(var(--foreground) / 0.6)",
          }}
        />
      </div>
      {/* Clickable dots along the bar */}
      <div className="absolute inset-0 flex flex-col justify-between items-center" style={{ height: "140px" }}>
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            aria-label={`Go to section ${i + 1}`}
            className="relative z-10"
          >
            <div
              className={`rounded-full transition-all duration-300 ${
                i <= active
                  ? "w-[7px] h-[7px] bg-foreground/70"
                  : "w-[5px] h-[5px] bg-muted-foreground/20"
              }`}
            />
          </button>
        ))}
      </div>
    </nav>
  );
};

/* ── Fade-in wrapper ── */
const FadeIn = ({
  children,
  delay = 0,
  className = "",
  threshold = 0.5,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
}) => {
  const ref = useScrollReveal(threshold);
  // Stagger via CSS custom property: --i units of 80ms
  const i = Math.round(delay / 80);
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ ["--i" as never]: i }}
    >
      {children}
    </div>
  );
};

/* ── Timeline Node with Pulse ── */
const TimelineNode = ({ isActive }: { isActive: boolean }) => (
  <div className="relative flex items-center justify-center mb-5" style={{ width: 32, height: 32 }}>
    {/* Pulse ring */}
    {isActive && (
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full animate-[pulse-ring_2.4s_ease-out_infinite]"
        style={{ background: "hsl(var(--foreground) / 0.08)" }}
      />
    )}
    {/* Core dot */}
    <div
      className={`relative z-10 rounded-full transition-all duration-500 ${
        isActive
          ? "bg-foreground w-[10px] h-[10px]"
          : "bg-foreground/30 w-[7px] h-[7px]"
      }`}
      style={{
        boxShadow: isActive
          ? "0 0 12px hsl(var(--foreground) / 0.35), 0 1px 3px hsl(var(--foreground) / 0.2)"
          : "none",
      }}
    />
  </div>
);

/* ── Timeline Card ── */
const TimelineCard = ({
  step,
  isActive,
}: {
  step: TimelineStep;
  index: number;
  total: number;
  isActive: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevActiveRef = useRef(false);

  useEffect(() => {
    if (!step.videoSrc || !videoRef.current) return;
    const video = videoRef.current;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isActive && !prevActiveRef.current) {
      video.currentTime = 0;
      if (!prefersReduced) {
        video.play().catch(() => {});
      }
    } else if (!isActive && prevActiveRef.current) {
      video.pause();
    }
    prevActiveRef.current = isActive;
  }, [isActive, step.videoSrc]);

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-full px-4 -mt-8 md:-mt-16"
    >
      <TimelineNode isActive={isActive} />

      {/* Card with integrated period label */}
      <div
        className={`relative w-[calc(100vw-32px)] md:w-[520px] mx-auto transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          isActive
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-40 scale-[0.97] translate-y-1"
        }`}
      >
        {/* Period label pill */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <span
            className={`inline-block text-[11px] tracking-[0.08em] font-semibold rounded-full py-[4px] px-[10px] border bg-background transition-colors duration-300 ${
              isActive
                ? "text-foreground/80 border-foreground/25"
                : "text-muted-foreground/50 border-foreground/12"
            }`}
          >
            {step.period}
          </span>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border-2 border-foreground bg-card transition-[box-shadow,transform] duration-300"
          style={{
            boxShadow: isActive
              ? "4px 4px 0 0 hsl(var(--foreground) / 0.18)"
              : "2px 2px 0 0 hsl(var(--foreground) / 0.08)",
          }}
        >
          {step.videoSrc && (
            <div className="relative w-full aspect-[16/9] overflow-hidden" style={{ background: "hsl(var(--background))" }}>
              <LazyVideo
                ref={videoRef}
                src={step.videoSrc}
                poster={posterFor(step.videoSrc)}
                rootMargin="800px 0px"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{
                  background: "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 40%, transparent 100%)",
                }}
              />
            </div>
          )}

          <div className="px-6 pt-5 pb-7 md:px-10 md:pt-7 md:pb-9 text-center">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="text-[14px] leading-[1.7] mt-3.5 max-w-[360px] mx-auto text-muted-foreground/75">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Animated Timeline Line (transform-only, driven by IntersectionObserver state) ── */
const AnimatedTimeline = ({ progress }: { progress: number }) => (
  <div
    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-[1] pointer-events-none rounded-full"
    style={{ width: "2px", background: "transparent" }}
  >
    <div
      className="absolute top-0 left-0 w-full h-full rounded-full origin-top"
      style={{
        transform: `scaleY(${progress})`,
        transition: "transform 0.6s cubic-bezier(0.25,0.1,0.25,1)",
        willChange: "transform",
        background: "hsl(var(--foreground) / 0.55)",
      }}
    />
  </div>
);

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
const WhatIsMoney = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineWrapperRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const registerRef = useCallback((i: number, el: HTMLElement | null) => {
    sectionRefs.current[i] = el;
  }, []);

  useEffect(() => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveSection(idx);
          }
        });
      },
      { threshold: 0.5, root: containerRef.current }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Timeline line progress is derived from the IntersectionObserver-driven activeSection
  // — no scroll listeners, no per-frame JS. Fully CSS-transitioned via transform: scaleY.
  const timelineProgress = (() => {
    if (activeSection < TIMELINE_START) return 0;
    const stepIndex = Math.min(activeSection - TIMELINE_START, timelineSteps.length - 1);
    return (stepIndex + 1) / timelineSteps.length;
  })();

  const scrollToSection = useCallback((i: number) => {
    const el = sectionRefs.current[i];
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  let si = 0;

  return (
    <div
      ref={containerRef}
      className="h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] overflow-y-scroll snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <Seo
        title="What is Money? A beginner-friendly history"
        description="Learn what money is, the three core functions it serves, and how it evolved from barter to digital dollars on the internet."
        path="/learn/what-is-money"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is Money?",
          description: "What money is, what it does, and how it evolved over time.",
        }}
      />
      <ProgressBar active={activeSection} total={TOTAL_SECTIONS} onDotClick={scrollToSection} />

      {/* ─── Hero with background video ─── */}
      <SnapSection index={si++} registerRef={registerRef}>
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="absolute inset-0 overflow-hidden z-0">
            <LazyVideo
              src="/learn/videos/bank_wait.mp4"
              poster="/learn/videos/posters/bank_wait.jpg"
              autoLoop
              priority
              className="w-full h-full object-cover"
              style={{ opacity: 0.08 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.85) 40%, hsl(var(--background) / 0.95) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 text-center px-6">
            <FadeIn delay={0}>
              <p className="text-xs tracking-[0.25em] uppercase font-medium mb-6 text-muted-foreground">
                Beginner Path
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-foreground">
                What is Money?
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-lg md:text-xl font-normal text-center mt-6 max-w-lg mx-auto leading-relaxed text-muted-foreground">
                We use money every day.
                <br />
                But what is money?
              </p>
            </FadeIn>
          </div>
        </div>
      </SnapSection>

      {/* ─── Three Core Functions ─── */}
      <SnapSection index={si++} registerRef={registerRef}>
        <div className="max-w-5xl mx-auto px-6 w-full">
          <FadeIn threshold={0.15}>
            <h2 className="text-2xl md:text-5xl font-bold tracking-tight text-foreground text-center mb-6 md:mb-16">
              Three core functions of money
            </h2>
          </FadeIn>
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 max-w-4xl mx-auto">
            {coreFunctions.map((fn, i) => (
              <FadeIn key={fn.num} delay={100 + i * 100} className="flex-1" threshold={0.15}>
                <div className="relative border-2 border-foreground rounded-2xl p-5 md:p-8 h-full min-h-[22vh] md:min-h-0 overflow-hidden flex flex-col justify-center shadow-[3px_3px_0_0_hsl(var(--foreground)/0.12)]">
                  {fn.num === "01" && (
                    <div className="absolute inset-0 z-0">
                      <LazyVideo src="/learn/videos/store_value_bg.mp4" poster="/learn/videos/posters/store_value_bg.jpg" autoLoop className="w-full h-full object-cover blur-[2px] opacity-60 md:opacity-35" />
                      <div className="absolute inset-0 bg-background/40 md:bg-background/60" />
                    </div>
                  )}
                  {fn.num === "02" && (
                    <div className="absolute inset-0 z-0">
                      <LazyVideo src="/learn/videos/measure_value_bg.mp4" poster="/learn/videos/posters/measure_value_bg.jpg" autoLoop playbackRate={0.5} className="w-full h-full object-cover blur-[2px] opacity-60 md:opacity-35" />
                      <div className="absolute inset-0 bg-background/40 md:bg-background/60" />
                    </div>
                  )}
                  {fn.num === "03" && (
                    <div className="absolute inset-0 z-0">
                      <LazyVideo src="/learn/videos/exchange_value_bg.mp4" poster="/learn/videos/posters/exchange_value_bg.jpg" autoLoop playbackRate={0.5} className="w-full h-full object-cover blur-[2px] opacity-60 md:opacity-35" />
                      <div className="absolute inset-0 bg-background/40 md:bg-background/60" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium mb-1 md:mb-4 block text-muted-foreground" style={{ textShadow: "0 2px 8px hsl(var(--background)), 0 0 16px hsl(var(--background)), 0 0 4px hsl(var(--background))" }}>
                      {fn.num}
                    </span>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-3" style={{ textShadow: "0 2px 10px hsl(var(--background)), 0 0 20px hsl(var(--background)), 0 0 6px hsl(var(--background))" }}>{fn.title}</h3>
                    <p className="text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground" style={{ textShadow: "0 2px 8px hsl(var(--background)), 0 0 16px hsl(var(--background)), 0 0 4px hsl(var(--background))" }}>{fn.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

        </div>
      </SnapSection>

      {/* ─── Unified Transition: "Money evolved" → video scene → "So money keeps changing" ─── */}
      <SnapSection index={si++} registerRef={registerRef}>
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="absolute inset-0 overflow-hidden z-0" style={{ bottom: "15%" }}>
            <LazyVideo
              src="/learn/videos/bank_wait.mp4"
              poster="/learn/videos/posters/bank_wait.jpg"
              autoLoop
              className="w-full h-full object-cover"
              style={{ opacity: 0.24, transform: "scale(1.05)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  to bottom,
                  hsl(var(--background) / 0.55) 0%,
                  hsl(var(--background) / 0.5) 20%,
                  hsl(var(--background) / 0.6) 45%,
                  hsl(var(--background) / 0.8) 70%,
                  hsl(var(--background) / 0.95) 100%
                )`,
              }}
            />
          </div>

          <div className="relative z-10 max-w-lg mx-auto px-6 text-center" style={{ marginTop: "-8vh" }}>
            <FadeIn delay={0}>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-10" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)" }}>
                Money evolved over time.
              </h2>
            </FadeIn>

            <FadeIn delay={150}>
              <p className="text-base md:text-lg leading-[1.8] text-foreground" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.12)" }}>
                Today the internet is global. Information moves instantly.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="text-base md:text-lg leading-[1.8] text-foreground mt-5" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.12)" }}>
                But money often doesn't.{" "}
                <span className="font-bold" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)" }}>
                  It waits for banks. It pauses on weekends.
                </span>
              </p>
            </FadeIn>

            <FadeIn delay={500}>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mt-10" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)" }}>
                So money keeps changing.
              </h2>
            </FadeIn>

          </div>
        </div>
      </SnapSection>

      {/* ─── Timeline: animated backbone line + pulse nodes ─── */}
      <div className="relative" ref={timelineWrapperRef}>
        <AnimatedTimeline progress={timelineProgress} />

        {/* Static faint backbone */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-0 pointer-events-none rounded-full"
          style={{
            width: "2px",
            background: "hsl(var(--foreground) / 0.15)",
          }}
        />

        {timelineSteps.map((step, i) => (
          <SnapSection key={step.period} index={si++} registerRef={registerRef} className="relative">
            <TimelineCard
              step={step}
              index={i}
              total={timelineSteps.length}
              isActive={activeSection === TIMELINE_START + i}
            />
          </SnapSection>
        ))}
      </div>

      {/* ─── Outro ─── */}
      <SnapSection index={si++} registerRef={registerRef}>
        <div className="text-center px-6">
          <FadeIn delay={0}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground text-center">
              So money keeps evolving.
            </h2>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="mt-10">
              <Link
                to="/learn/what-is-blockchain"
                className="inline-block text-lg font-medium bg-foreground text-background rounded-full px-10 py-4 hover:opacity-90 transition-opacity duration-200"
              >
                Next: What is Blockchain?
              </Link>
            </div>
          </FadeIn>
        </div>
      </SnapSection>

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
          transition-delay: calc(var(--i, 0) * 80ms);
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal { transition: none; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.4; }
          50% { transform: translateY(6px); opacity: 0.8; }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default WhatIsMoney;
