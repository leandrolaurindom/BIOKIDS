import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotProps {
  message: string;
  mood: 'happy' | 'excited' | 'thinking' | 'offline';
}

export const Mascot: React.FC<MascotProps> = ({ message, mood }) => {
  const bodyColor = mood === 'offline' ? '#718096' : mood === 'thinking' ? '#3182ce' : '#e53e3e';

  const bodyAnim =
    mood === 'excited'
      ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }
      : mood === 'thinking'
      ? { y: [0, -4, 0] }
      : mood === 'offline'
      ? { opacity: [1, 0.6, 1] }
      : { y: [0, -6, 0] };

  return (
    <div className="flex items-center gap-3 mb-6 p-3">
      <motion.div
        animate={bodyAnim}
        transition={{ duration: mood === 'excited' ? 0.6 : 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 72, height: 72, flexShrink: 0 }}
      >
        <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
          {/* Sombra */}
          <ellipse cx="50" cy="106" rx="22" ry="4" fill="rgba(0,0,0,0.12)" />

          {/* Corpo */}
          <circle cx="50" cy="68" r="34" fill={bodyColor} />

          {/* Linha central */}
          <line x1="50" y1="34" x2="50" y2="102" stroke="#7b0000" strokeWidth="2.5" />

          {/* Pintas */}
          <circle cx="36" cy="62" r="7" fill="#7b0000" opacity="0.8" />
          <circle cx="64" cy="62" r="7" fill="#7b0000" opacity="0.8" />
          <circle cx="34" cy="80" r="5.5" fill="#7b0000" opacity="0.8" />
          <circle cx="66" cy="80" r="5.5" fill="#7b0000" opacity="0.8" />

          {/* Brilho corpo */}
          <ellipse cx="38" cy="50" rx="8" ry="5" fill="white" opacity="0.18" transform="rotate(-30 38 50)" />

          {/* Cabeca */}
          <circle cx="50" cy="28" r="20" fill="#1a1a1a" />

          {/* Olhos brancos */}
          <circle cx="42" cy="24" r="7" fill="white" />
          <circle cx="58" cy="24" r="7" fill="white" />

          {/* Pupilas */}
          <circle cx="43" cy="24" r="4" fill="#1a1a1a" />
          <circle cx="59" cy="24" r="4" fill="#1a1a1a" />

          {/* Brilho olhos */}
          <circle cx="45" cy="22" r="1.8" fill="white" />
          <circle cx="61" cy="22" r="1.8" fill="white" />

          {/* Antenas */}
          <line x1="43" y1="10" x2="34" y2="2" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="57" y1="10" x2="66" y2="2" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="34" cy="2" r="3.5" fill="#1a1a1a" />
          <circle cx="66" cy="2" r="3.5" fill="#1a1a1a" />

          {/* Boca */}
          {mood === 'offline' ? (
            <line x1="44" y1="34" x2="56" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path
              d={mood === 'excited' ? "M 42 33 Q 50 40 58 33" : "M 44 32 Q 50 38 56 32"}
              stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"
            />
          )}
        </svg>
      </motion.div>

      {/* Balao de fala */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-gray-100 dark:border-gray-700 max-w-xs"
        >
          <div className="absolute -left-2 top-3 w-0 h-0"
            style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' }}
          />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-snug">{message}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
