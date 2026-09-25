import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Seo from "@learn/components/Seo";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 45, damping: 20 },
  },
};

const HistoryDeepDive = () => {
  return (
    <div className="pb-4 md:pb-12 relative">
      <Seo
        title="History of Money, A deeper dive"
        description="A longer look at the history of money: how it shifted from barter and metal to paper, plastic, and the digital dollar."
        path="/learn/history-deep-dive"
      />
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center"
      >
        <motion.div variants={itemVariants}>
          <span className="text-[16px] text-neutral-400 uppercase tracking-[0.1em]">History</span>
        </motion.div>
        <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-black mt-6">
          A brief history of Frax
        </motion.h1>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="px-6 py-14"
      >
        <div className="max-w-2xl mx-auto space-y-6" style={{ maxWidth: "72ch" }}>
          <p className="text-[18px] leading-[1.7] text-neutral-600">
            Frax launched in late 2020 as the first fractional-algorithmic stablecoin, a hybrid design that combined partial collateral with algorithmic stabilization. It was an experiment in creating a more capital-efficient stablecoin.
          </p>
          <p className="text-[18px] leading-[1.7] text-neutral-600">
            Over the following years, the protocol evolved significantly. Frax expanded from a single stablecoin into a <span className="font-bold text-black">full-stack monetary system</span>, adding liquid staking (frxETH), lending (FraxLend), its own AMM (FraxSwap), and eventually a Layer 2 rollup (Fraxtal).
          </p>
          <p className="text-[18px] leading-[1.7] text-neutral-600">
            In 2024, Frax made a pivotal shift: moving frxUSD to <span className="font-bold text-black">full collateralization</span> backed by U.S. Treasury Bills and high-quality reserves. This aligned the protocol with emerging regulatory frameworks, including the U.S. GENIUS Act.
          </p>
          <p className="text-[18px] leading-[1.7] text-neutral-600">
            Today, Frax represents a unique position in DeFi: a protocol that has evolved from experimental origins into <span className="font-bold text-black">institutional-grade infrastructure</span>, while maintaining its decentralized, on-chain DNA.
          </p>
          <p className="text-[18px] leading-[1.7] text-neutral-600">
            The result is a system that operates at the intersection of two worlds.
          </p>
        </div>
      </motion.section>

      {/* DeFi vs RegFi Fork */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="px-6 py-20"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-[3px] border-black bg-white shadow-lg p-10 flex flex-col">
            <span className="text-[16px] text-neutral-400 uppercase tracking-[0.1em] mb-3">Path A</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] text-black mb-3">DeFi</h2>
            <p className="text-[18px] leading-[1.7] text-neutral-600 mb-6 flex-1">
              The on-chain path. Protocol-owned liquidity, permissionless lending, yield optimization, and decentralized governance.
            </p>
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-black px-7 py-3.5 text-[18px] font-bold text-white self-start cursor-not-allowed opacity-80 select-none"
            >
              Soon <ArrowRight className="w-4 h-4" />
            </span>
          </div>

          <div className="rounded-2xl border-[3px] border-black bg-white shadow-lg p-10 flex flex-col">
            <span className="text-[16px] text-neutral-400 uppercase tracking-[0.1em] mb-3">Path B</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] text-black mb-3">RegFi</h2>
            <p className="text-[18px] leading-[1.7] text-neutral-600 mb-6 flex-1">
              The institutional path. Regulated accounts, compliant issuance, Treasury-backed reserves, and enterprise deployment.
            </p>
            <Link
              to="/learn/the-business"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-black px-7 py-3.5 text-[18px] font-bold text-white hover:bg-neutral-900 hover:-translate-y-0.5 transition-all self-start"
            >
              Get In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default HistoryDeepDive;
