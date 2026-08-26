import React from 'react';
import { motion } from 'motion/react';

interface AnimatedBackgroundProps {
  theme: 'dark' | 'light';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Primary Atmospheric Emerald & Cyan Nebula Glow */}
      <motion.div
        className={`absolute -top-32 left-1/3 w-[55rem] h-[30rem] rounded-full blur-[150px] pointer-events-none ${
          isDark
            ? 'bg-gradient-to-r from-emerald-950/20 via-emerald-500/5 to-transparent'
            : 'bg-gradient-to-r from-emerald-100/40 via-cyan-100/30 to-transparent'
        }`}
        animate={{
          opacity: [0.35, 0.65, 0.35],
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary Deep Subtle Ambient Orb */}
      <div
        className={`absolute -bottom-40 -right-20 w-[40rem] h-[25rem] rounded-full blur-[160px] pointer-events-none ${
          isDark ? 'bg-cyan-950/10' : 'bg-slate-200/50'
        }`}
      />

      {/* High-Precision Radar Matrix Dot Grid */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[radial-gradient(#ffffff0a_1px,transparent_1px)]'
            : 'bg-[radial-gradient(#0000000a_1px,transparent_1px)]'
        } bg-[size:20px_20px]`}
      />
    </div>
  );
};

