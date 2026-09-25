import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Lock } from 'lucide-react';
import { useState } from 'react';
import Seo from '@learn/components/Seo';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 70, damping: 18 },
  },
};

const paths = [
  {
    index: '01',
    title: 'The Beginner',
    description: 'New to crypto? Start here. We explain everything from scratch.',
    path: '/learn/the-beginner',
  },
  {
    index: '02',
    title: 'The Business',
    description:
      'For institutions, enterprises, and builders exploring regulated digital dollar infrastructure.',
    path: '/learn/the-business',
  },
  {
    index: '03',
    title: 'The Advanced',
    description: 'Deep-dive into the Frax architecture, mechanisms, and DeFi-native design.',
    path: '/learn/the-advanced',
    soon: true,
  },
];

const Index = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const spawnSoonBubble = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + (Math.random() * 64 - 32);
    const y = e.clientY - rect.top;
    const bubble = document.createElement('span');
    bubble.textContent = 'Soon';
    bubble.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);background:rgba(0,0,0,0.88);color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.04em;padding:7px 16px;border-radius:9999px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 4px 16px rgba(0,0,0,0.3);pointer-events:none;z-index:0;animation:floatUp 900ms cubic-bezier(0.16,1,0.3,1) forwards;`;
    container.appendChild(bubble);
    setTimeout(() => bubble.remove(), 950);
  };

  return (
    <div className="learn-hub">
      <Seo
        title="MoneyOS, Choose your path to financial literacy"
        description="Pick your learning path on MoneyOS: beginner-friendly lessons, institutional deep dives, or advanced Frax architecture content."
        path="/learn"
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="learn-hub__inner"
      >
        <motion.header variants={itemVariants} className="learn-hub__head">
          <p className="learn-hub__eyebrow">Learn</p>
          <h1 className="learn-hub__title">Choose your path to financial literacy</h1>
        </motion.header>

        <div className="learn-hub__grid">
          {paths.map((p, i) => {
            const dimmed = hoveredIdx !== null && hoveredIdx !== i;
            const locked = Boolean(p.soon);

            const cardInner = (
              <motion.article
                className={`learn-hub__card${locked ? ' learn-hub__card--soon' : ''}`}
                whileHover={locked ? undefined : { y: -4, scale: 1.012 }}
                whileTap={locked ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              >
                <span className="learn-hub__card-sheen" aria-hidden />

                <div className="learn-hub__card-body">
                  <span className="learn-hub__card-index">{p.index}</span>
                  {locked ? (
                    <span className="learn-hub__card-lock" aria-hidden>
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                  <h2 className="learn-hub__card-title">{p.title}</h2>
                  <p className="learn-hub__card-copy">
                    {locked ? 'Deep-dive content is being prepared.' : p.description}
                  </p>
                </div>

                {!locked ? (
                  <div className="learn-hub__card-overlay">
                    <span className="learn-hub__card-overlay-pill">
                      Enter path
                      <ArrowRight className="w-4 h-4 learn-hub__card-arrow" />
                    </span>
                  </div>
                ) : (
                  <div className="learn-hub__card-cta">
                    <span>Coming soon</span>
                  </div>
                )}
              </motion.article>
            );

            return (
              <motion.div
                key={p.path}
                variants={itemVariants}
                animate={{ opacity: dimmed ? 0.55 : 1 }}
                transition={{ duration: 0.18 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="learn-hub__cell"
              >
                {locked ? (
                  <div
                    className="relative block cursor-not-allowed select-none"
                    aria-disabled="true"
                    onClick={spawnSoonBubble}
                  >
                    {cardInner}
                  </div>
                ) : (
                  <Link to={p.path} className="learn-hub__link group">
                    {cardInner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
