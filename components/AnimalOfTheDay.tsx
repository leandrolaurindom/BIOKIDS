
import React from 'react';
import { motion } from 'framer-motion';
import { Animal } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { SoundIcon } from './icons/SoundIcon';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface AnimalOfTheDayProps {
  animal: Animal | null;
  loading: boolean;
  onCollect: (animal: Animal) => void;
  isAlreadyCollected: boolean;
}

export const AnimalOfTheDay: React.FC<AnimalOfTheDayProps> = ({ 
  animal, 
  loading, 
  onCollect, 
  isAlreadyCollected 
}) => {
  const { speak } = useSpeechSynthesis();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border-2 border-dashed border-yellow-300 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-auto"></div>
        <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!animal) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 shadow-xl border-2 border-yellow-400 relative overflow-hidden group"
    >
      {/* Decorative elements */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon className="w-5 h-5 text-yellow-500" />
          </motion.div>
          <h2 className="text-sm font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Animal do Dia</h2>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon className="w-5 h-5 text-yellow-500" />
          </motion.div>
        </div>

        <div className="relative mb-4">
          <motion.img 
            whileHover={{ scale: 1.02 }}
            src={animal.image} 
            alt={animal.popularName} 
            className="w-full h-48 object-cover rounded-2xl shadow-md border-4 border-white dark:border-gray-700 transition-transform duration-500"
          />
          {!isAlreadyCollected && (
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg"
            >
              NOVO!
            </motion.div>
          )}
        </div>

        <div className="text-center mb-4">
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-tight"
          >
            {animal.popularName}
          </motion.h3>
          <p className="text-xs italic text-gray-500 dark:text-gray-400">{animal.scientificName}</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 mb-4"
        >
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic">
            "{animal.funFact}"
          </p>
          <button 
            onClick={() => speak(animal.funFact)}
            className="mt-2 flex items-center gap-1 text-[10px] font-bold text-yellow-700 dark:text-yellow-400 hover:underline"
          >
            <SoundIcon className="w-3 h-3" /> OUVIR CURIOSIDADE
          </button>
        </motion.div>

        {!isAlreadyCollected ? (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCollect(animal)}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-green-900 font-black py-3 rounded-xl shadow-[0_4px_0_rgb(202,138,4)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" /> COLETAR PARA O ÁLBUM
          </motion.button>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-black py-3 rounded-xl border-2 border-green-200 dark:border-green-800 text-center text-sm"
          >
            ✓ JÁ ESTÁ NO SEU ÁLBUM
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
