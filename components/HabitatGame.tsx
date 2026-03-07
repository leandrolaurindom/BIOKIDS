
import React, { useState, useEffect, useCallback } from 'react';
import { Animal, HabitatGameData } from '../types';
import { generateHabitatGame } from '../services/geminiService';
import { Modal } from './Modal';
import { SparklesIcon } from './icons/SparklesIcon';

interface HabitatGameProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Animal[];
}

type GameState = 'playing' | 'correct' | 'incorrect';

export const HabitatGame: React.FC<HabitatGameProps> = ({ isOpen, onClose, collection }) => {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [gameData, setGameData] = useState<HabitatGameData | null>(null);
  const [selectedHabitat, setSelectedHabitat] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewGame = useCallback(async () => {
    if (collection.length === 0) return;
    setLoading(true);
    setError(null);
    setSelectedHabitat(null);
    setGameState('playing');
    setGameData(null);
    try {
      const randomAnimal = collection[Math.floor(Math.random() * collection.length)];
      setAnimal(randomAnimal);
      const newGameData = await generateHabitatGame(randomAnimal);
      setGameData(newGameData);
    } catch (err) {
      console.error("Failed to generate habitat game:", err);
      setError("Oops! Não consegui criar o jogo. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    if (isOpen) {
      fetchNewGame();
    }
  }, [isOpen, fetchNewGame]);

  const handleHabitatSelect = (habitatName: string) => {
    if (gameState !== 'playing') return;
    setSelectedHabitat(habitatName);
    if (habitatName === gameData?.correctHabitat) {
      setGameState('correct');
    } else {
      setGameState('incorrect');
    }
  };
  
  const getCardClass = (habitatName: string) => {
    const baseClass = "rounded-lg border-4 transition-all duration-300 transform cursor-pointer hover:scale-105";
    if (gameState === 'playing') {
      return `${baseClass} border-transparent hover:border-blue-400`;
    }
    if (habitatName === gameData?.correctHabitat) {
      return `${baseClass} border-green-500 scale-105 shadow-lg`;
    }
    if (habitatName === selectedHabitat) {
      return `${baseClass} border-red-500 opacity-70`;
    }
    return `${baseClass} border-transparent opacity-60`;
  };

  const renderContent = () => {
    if (!navigator.onLine) {
        return (
            <div className="text-center p-8">
                <p className="text-xl text-gray-600 dark:text-gray-300">
                    O Jogo de Habitat precisa de internet para carregar os cenários.
                </p>
                <p className="mt-4 text-sm text-gray-400">
                    Conecte-se para explorar novos ambientes!
                </p>
            </div>
        );
    }
    if (collection.length === 0) {
      return <p className="text-center text-xl text-gray-600 dark:text-gray-300">Você precisa descobrir pelo menos um animal para jogar!</p>;
    }
    if (loading) {
      return <div className="text-center p-8"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div><p className="mt-4 text-lg">Preparando uma nova aventura...</p></div>;
    }
    if (error) {
       return <p className="text-center text-xl text-red-500 dark:text-red-400">{error}</p>;
    }
    if (!animal || !gameData) {
      return <p className="text-center text-xl text-gray-600 dark:text-gray-300">Não foi possível carregar o jogo.</p>;
    }
    
    return (
      <div>
        <div className="text-center mb-6">
            <p className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200">Onde vive o(a)</p>
            <div className="flex items-center justify-center gap-4 mt-2">
                 <img src={animal.image} alt={animal.popularName} className="w-20 h-20 object-cover rounded-full border-4 border-yellow-400"/>
                <h2 className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400">{animal.popularName}?</h2>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameData.habitats.map(({ name, image }) => (
            <div key={name} onClick={() => handleHabitatSelect(name)} className={getCardClass(name)}>
              <img src={image} alt={name} className="w-full h-48 object-cover rounded-md" />
              <p className="text-center font-bold text-lg p-2 bg-black bg-opacity-30 text-white rounded-b-md">{name}</p>
            </div>
          ))}
        </div>
        
        {gameState !== 'playing' && (
          <div className="mt-6 text-center">
            {gameState === 'correct' && (
              <div className="p-4 rounded-lg bg-green-100 text-green-800 text-xl font-bold">
                Parabéns, você acertou! O habitat do(a) {animal.popularName} é {gameData.correctHabitat}!
              </div>
            )}
            {gameState === 'incorrect' && (
              <div className="p-4 rounded-lg bg-red-100 text-red-800 text-xl font-bold">
                Quase! A resposta correta é {gameData.correctHabitat}.
              </div>
            )}
            <button onClick={fetchNewGame} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full text-xl flex items-center gap-2 mx-auto transition-transform hover:scale-105">
              <SparklesIcon /> Próximo Animal
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Jogo: Onde Vive?">
      {renderContent()}
    </Modal>
  );
};
