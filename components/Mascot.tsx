import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotProps {
  message: string;
  mood: 'happy' | 'excited' | 'thinking' | 'offline';
}

export const Mascot: React.FC<MascotProps> = ({ message, mood }) => {
  const moodColors = {
    happy: '#e53e3e',
    excited: '#dd6b20',
    thinking: '#3182ce',
    offline: '#718096',
  };

  const color = moodColors[mood];

  return (
    <div className="flex items-center gap-3 mb-6 p-3">
      {/* Joaninha animada */}
      <motion.div
        animate={
          mood === 'excited'
            ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }
            : mood === 'thinking'
            ? { y: [0, -4, 0] }
            : mood === 'offline'
            ? { opacity: [1, 0.6, 1] }
            : { y: [0, -6, 0] }
        }
        transition={{
          duration: mood === 'excited' ? 0.6 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ width: 72, height: 72, flexShrink: 0 }}
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
          {/* Sombra */}
          <ellipse cx="50" cy="95" rx="22" ry="5" fill="rgba(0,0,0,0.15)" />

          {/* Corpo principal */}
          <motion.circle
            cx="50" cy="58" r="36"
            fill={color}
            animate={{ scale: mood === 'excited' ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />

          {/* Linha central do corpo */}
          <line x1="50" y1="22" x2="50" y2="94" stroke="#7b0000" strokeWidth="2.5" />

          {/* Pintas */}
          <circle cx="35" cy="52" r="7" fill="#7b0000" opacity="0.85" />
          <circle cx="65" cy="52" r="7" fill="#7b0000" opacity="0.85" />
          <circle cx="33" cy="70" r="5.5" fill="#7b0000" opacity="0.85" />
          <circle cx="67" cy="70" r="5.5" fill="#7b0000" opacity="0.85" />
          <circle cx="50" cy="80" r="4.5" fill="#7b0000" opacity="0.7" />

          {/* Cabeca */}
          <circle cx="50" cy="22" r="18" fill="#1a1a1a" />

          {/* Olhos */}
          <circle cx="43" cy="18" r="6" fill="white" />
          <circle cx="57" cy="18" r="6" fill="white" />

          {/* Pupilas */}
          <motion.circle
            cx="44" cy="18" r="3.5" fill="#1a1a1a"
            animate={mood === 'thinking' ? { cx: [44, 46, 44] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="58" cy="18" r="3.5" fill="#1a1a1a"
            animate={mood === 'thinking' ? { cx: [58, 60, 58] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Brilho nos olhos */}
          <circle cx="46" cy="16" r="1.5" fill="white" />
          <circle cx="60" cy="16" r="1.5" fill="white" />

          {/* Antenas */}
          <motion.line
            x1="43" y1="6" x2="35" y2="-2"
            stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"
            animate={{ rotate: mood === 'happy' ? [0, 5, 0, -5, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity, transformOrigin: '43px 6px' }}
          />
          <motion.line
            x1="57" y1="6" x2="65" y2="-2"
            stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"
            animate={{ rotate: mood === 'happy' ? [0, -5, 0, 5, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity, transformOrigin: '57px 6px' }}
          />
          <circle cx="35" cy="-2" r="3" fill="#1a1a1a" />
          <circle cx="65" cy="-2" r="3" fill="#1a1a1a" />

          {/* Sorriso */}
          {mood !== 'offline' && (
            <path
              d={mood === 'excited' ? "M 43 27 Q 50 33 57 27" : "M 44 26 Q 50 31 56 26"}
              stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"
            />
          )}
          {mood === 'offline' && (
            <line x1="44" y1="28" x2="56" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Brilho no corpo */}
          <ellipse cx="38" cy="40" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-30 38 40)" />
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
