import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Seo from "@learn/components/Seo";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
};

const lessons = [
  {
    title: "What is Money?",
    description: "Understand the basics of money, what it does, why it exists, and how it evolved over time.",
    path: "/learn/what-is-money",
    recommended: true,
  },
  {
    title: "What is Blockchain?",
    description: "Learn how blockchain technology works and why it matters for the future of money.",
    path: "/learn/what-is-blockchain",
    recommended: false,
  },
  {
    title: "What is a Stablecoin?",
    description: "Discover what stablecoins are, the different types, and what makes them trustworthy.",
    path: "/learn/what-is-stablecoins",
    recommended: false,
  },
  {
    title: "What is Frax?",
    description: "Explore Frax's digital dollar, built for spending, saving, and the internet era.",
    path: "/learn/what-is-frax",
    recommended: false,
  },
];

const TheBeginner = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="min-h-[calc(100svh-var(--ticker-h)-var(--header-h)-var(--music-dock-h))] flex flex-col justify-center px-5 md:px-6 pt-4 md:pt-6 pb-4 md:pb-8">
      <Seo
        title="Beginner path, Start your journey into better finance"
        description="New to crypto and digital money? Follow the MoneyOS beginner path: money basics, blockchain, stablecoins, and the Frax digital dollar."
        path="/learn/the-beginner"
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05] text-foreground">
            Start your journey into better finance
          </h1>
          <p className="text-[16px] leading-[1.7] text-muted-foreground mt-3">
            Pick a lesson to begin.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {lessons.map((lesson, idx) => (
            <motion.div
              key={lesson.path}
              variants={itemVariants}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.88 : 1,
                transition: "opacity 220ms ease-out",
              }}
            >
              <Link to={lesson.path} className="block group">
                <motion.div
                  className={`relative rounded-2xl border-[2.5px] border-foreground bg-card overflow-hidden
                    min-h-[220px] flex flex-col items-center justify-center text-center
                    ${lesson.recommended
                      ? "shadow-[4px_4px_0_0_hsl(var(--foreground)/0.14)]"
                      : "shadow-[3px_3px_0_0_hsl(var(--foreground)/0.09)]"
                    }`}
                  whileHover={{
                    y: -3,
                    scale: 1.012,
                  }}
                  whileTap={{ scale: 0.975 }}
                  transition={{ type: "spring", stiffness: 340, damping: 24 }}
                >
                  <div className="px-8 py-8 flex flex-col items-center justify-center flex-1 transition-opacity duration-[220ms] group-hover:opacity-0">
                    {lesson.recommended && (
                      <span className="inline-block text-[12px] text-muted-foreground/50 uppercase tracking-[0.12em] mb-3">
                        Recommended start
                      </span>
                    )}
                    <h2 className="text-[22px] font-bold text-foreground mb-3">
                      {lesson.title}
                    </h2>
                    <p className="text-[15px] leading-[1.65] text-muted-foreground max-w-[30ch]">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms] flex items-center justify-center border-none border-slate-800 bg-zinc-700 text-secondary-foreground">
                    <span className="rounded-xl border-2 border-background bg-background px-6 py-3 text-[16px] font-bold text-foreground inline-flex items-center gap-2">
                      Start lesson
                      <ArrowRight className="w-4 h-4 transition-transform duration-[220ms] ease-out group-hover:translate-x-1" />
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={itemVariants}
          className="text-center text-muted-foreground/40 text-[15px] mt-8 font-medium bg-transparent"
        >
          Learn at your own pace.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default TheBeginner;
