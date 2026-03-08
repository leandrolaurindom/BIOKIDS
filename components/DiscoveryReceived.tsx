
import React from 'react';
import { Animal } from '../types';
import { Modal } from './Modal';
import { SparklesIcon } from './icons/SparklesIcon';

interface DiscoveryReceivedProps {
  animal: Omit<Animal, 'id'> | null;
  onSave: () => void;
  onClose: () => void;
}

export const DiscoveryReceived: React.FC<DiscoveryReceivedProps> = ({ animal, onSave, onClose }) => {
  if (!animal) return null;

  return (
    <Modal isOpen={!!animal} onClose={onClose} title="✨ Nova Figurinha Recebida! ✨">
      <div className="text-center p-4">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-30 animate-pulse rounded-full"></div>
          {animal.image ? (
            <img src={animal.image} alt={animal.popularName} className="w-64 h-64 object-cover rounded-2xl shadow-2xl border-8 border-white relative z-10" />
          ) : (
             <div className="w-64 h-64 bg-green-100 rounded-2xl shadow-2xl border-8 border-white relative z-10 flex items-center justify-center text-6xl">
                🐞
             </div>
          )}
        </div>
        
        <h2 className="text-4xl font-black text-green-700 mb-2">{animal.popularName}</h2>
        <p className="text-xl italic text-gray-500 mb-6">{animal.scientificName}</p>
        
        <div className="bg-white p-6 rounded-2xl shadow-inner border-2 border-dashed border-green-300 mb-8 text-left">
          <p className="text-gray-700 leading-relaxed">
            <span className="font-bold text-green-600">Curiosidade:</span> {animal.funFact}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onSave}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-xl shadow-xl transform transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <SparklesIcon className="w-6 h-6" />
            Adicionar à Minha Biblioteca!
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 font-bold hover:underline"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
    </Modal>
  );
};
