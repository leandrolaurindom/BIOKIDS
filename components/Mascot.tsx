
import React from 'react';
import { motion } from 'framer-motion';

interface MascotProps {
  message: string;
  mood?: 'happy' | 'excited' | 'thinking' | 'offline';
}

export const Mascot: React.FC<MascotProps> = ({ message, mood = 'happy' }) => {
  const bodyColor = mood === 'offline' ? '#6b7280' : '#ef4444';
  const glowColor = mood === 'excited' ? '#fbbf24' : mood === 'offline' ? 'transparent' : '#86efac';

  return (
    <div className="flex items-center justify-center gap-4 my-4">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex-shrink-0"
      >
        {/* Glow ring */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: glowColor, filter: 'blur(8px)', zIndex: 0 }}
        />
        {/* Ladybug SVG */}
        <svg width="72" height="72" viewBox="0 0 72 72" className="relative z-10 drop-shadow-lg">
          {/* Body */}
          <ellipse cx="36" cy="42" rx="24" ry="20" fill={bodyColor} />
          {/* Wing divider */}
          <line x1="36" y1="24" x2="36" y2="62" stroke="#111" strokeWidth="2.5" />
          {/* Head */}
          <circle cx="36" cy="22" r="14" fill="#111" />
          {/* Eyes */}
          <circle cx="30" cy="20" r="4" fill="white" />
          <circle cx="42" cy="20" r="4" fill="white" />
          {/* Eye pupils - no animation to avoid framer-motion SVG bug */}
          <circle cx={31} cy={20} r={2.5} fill="#222" />
          <circle cx={43} cy={20} r={2.5} fill="#222" />
          {/* Eye shine */}
          <circle cx="32" cy="18.5" r="1" fill="white" opacity="0.8" />
          <circle cx="44" cy="18.5" r="1" fill="white" opacity="0.8" />
          {/* Smile */}
          <path d={mood === 'excited' ? "M 30 27 Q 36 33 42 27" : "M 30 26 Q 36 31 42 26"} stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Antennae */}
          <line x1="28" y1="10" x2="22" y2="3" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="10" x2="50" y2="3" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="3" r="2.5" fill="#111" />
          <circle cx="50" cy="3" r="2.5" fill="#111" />
          {/* Spots */}
          <circle cx="24" cy="40" r="6" fill="#111" opacity="0.4" />
          <circle cx="48" cy="40" r="6" fill="#111" opacity="0.4" />
          <circle cx="27" cy="54" r="4.5" fill="#111" opacity="0.4" />
          <circle cx="45" cy="54" r="4.5" fill="#111" opacity="0.4" />
          {/* Excited stars */}
          {mood === 'excited' && (
            <>
              <motion.text x="58" y="16" fontSize="10" animate={{ opacity: [0, 1, 0], y: [16, 10, 16] }} transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.text>
              <motion.text x="2" y="20" fontSize="10" animate={{ opacity: [0, 1, 0], y: [20, 14, 20] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>⭐</motion.text>
            </>
          )}
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        key={message}
        className="relative bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl shadow-md max-w-[220px] border-2 border-yellow-400"
      >
        <p className="text-gray-700 dark:text-gray-200 text-sm font-semibold leading-snug">{message}</p>
        {/* Speech bubble tail */}
        <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-gray-700 rotate-45 border-b-2 border-l-2 border-yellow-400" />
      </motion.div>
    </div>
  );
};
