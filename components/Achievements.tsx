
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  required: number;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', emoji: '🔍', title: 'Primeiro Passo', description: 'Descubra seu primeiro animal', required: 1, color: 'from-gray-400 to-gray-500' },
  { id: 'explorer', emoji: '🌿', title: 'Explorador', description: 'Catalogue 5 animais', required: 5, color: 'from-green-400 to-emerald-500' },
  { id: 'researcher', emoji: '🧪', title: 'Pesquisador', description: 'Catalogue 10 animais', required: 10, color: 'from-blue-400 to-cyan-500' },
  { id: 'naturalist', emoji: '🦋', title: 'Naturalista', description: 'Catalogue 20 animais', required: 20, color: 'from-purple-400 to-violet-500' },
  { id: 'biologist', emoji: '🔬', title: 'Biólogo Mirim', description: 'Catalogue 35 animais', required: 35, color: 'from-orange-400 to-red-500' },
  { id: 'master', emoji: '🏆', title: 'Mestre Biólogo', description: 'Complete o álbum com 50!', required: 50, color: 'from-yellow-400 to-amber-500' },
];

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  justUnlocked?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, unlocked, justUnlocked }) => (
  <motion.div
    initial={justUnlocked ? { scale: 0, rotate: -10 } : false}
    animate={justUnlocked ? { scale: 1, rotate: 0 } : {}}
    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all duration-300 ${
      unlocked
        ? 'border-yellow-300 bg-white dark:bg-gray-800 shadow-md'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-40'
    }`}
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${unlocked ? achievement.color : 'from-gray-300 to-gray-400'} flex items-center justify-center text-2xl shadow-sm`}>
      {unlocked ? achievement.emoji : '🔒'}
    </div>
    <p className={`text-[9px] font-black text-center leading-tight ${unlocked ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>
      {achievement.title}
    </p>
    {justUnlocked && (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
        transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-green-900 text-[8px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow"
      >
        DESBLOQUEADO!
      </motion.div>
    )}
  </motion.div>
);

interface AchievementsProps {
  count: number;
  previousCount?: number;
}

export const Achievements: React.FC<AchievementsProps> = ({ count, previousCount = 0 }) => {
  const nextAchievement = ACHIEVEMENTS.find(a => a.required > count);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-lg border-2 border-yellow-200 dark:border-yellow-900/40 mb-4">
      <h3 className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-3 text-center">
        ⭐ Conquistas
      </h3>
      <div className="grid grid-cols-6 gap-1.5">
        {ACHIEVEMENTS.map(a => (
          <AchievementBadge
            key={a.id}
            achievement={a}
            unlocked={count >= a.required}
            justUnlocked={count >= a.required && previousCount < a.required}
          />
        ))}
      </div>
      {nextAchievement && (
        <div className="mt-3 text-center">
          <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold">
            Próxima conquista: <span className="text-orange-500">{nextAchievement.emoji} {nextAchievement.title}</span> em {nextAchievement.required - count} descoberta{nextAchievement.required - count !== 1 ? 's' : ''}!
          </p>
        </div>
      )}
    </div>
  );
};

// Floating toast for new achievement
interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => (
  <AnimatePresence>
    {achievement && (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-yellow-400 p-3 flex items-center gap-3 max-w-[200px]"
        onClick={onDismiss}
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-xl flex-shrink-0`}>
          {achievement.emoji}
        </div>
        <div>
          <p className="text-[8px] font-black text-yellow-600 uppercase">Conquista!</p>
          <p className="text-xs font-black text-gray-800 dark:text-white leading-tight">{achievement.title}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export { ACHIEVEMENTS };
export type { Achievement };
