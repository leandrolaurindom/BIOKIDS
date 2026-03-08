
import React, { useState, useEffect, useCallback } from 'react';
import { Animal, QuizQuestion } from '../types';
import { generateQuizQuestion } from '../services/geminiService';
import { Modal } from './Modal';
import { SparklesIcon } from './icons/SparklesIcon';

interface QuizProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Animal[];
}

export const Quiz: React.FC<QuizProps> = ({ isOpen, onClose, collection }) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNewQuestion = useCallback(async () => {
    if (collection.length === 0) return;
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuestion(null);
    try {
      const randomAnimal = collection[Math.floor(Math.random() * collection.length)];
      const newQuestion = await generateQuizQuestion(randomAnimal);
      setQuestion(newQuestion);
    } catch (error) {
      console.error("Failed to generate quiz question:", error);
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    if (isOpen) {
      fetchNewQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setIsCorrect(answer === question?.correctAnswer);
  };

  const getButtonClass = (option: string) => {
    if (!selectedAnswer) {
      return 'bg-blue-500 hover:bg-blue-600';
    }
    if (option === question?.correctAnswer) {
      return 'bg-green-500 animate-pulse';
    }
    if (option === selectedAnswer && option !== question?.correctAnswer) {
      return 'bg-red-500';
    }
    return 'bg-gray-400 opacity-70';
  };
  
  const renderContent = () => {
      if (!navigator.onLine) {
          return (
              <div className="text-center p-8">
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                      O Quiz precisa de internet para gerar novas perguntas.
                  </p>
                  <p className="mt-4 text-sm text-gray-400">
                      Conecte-se para testar seus conhecimentos!
                  </p>
              </div>
          );
      }
      if(collection.length === 0) {
          return <p className="text-center text-xl text-gray-600 dark:text-gray-300">Você precisa descobrir pelo menos um animal para jogar o quiz!</p>
      }
      if(loading) {
          return <div className="text-center p-8"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div><p className="mt-4 text-lg">Gerando uma nova pergunta...</p></div>
      }
      if(!question) {
          return <p className="text-center text-xl text-gray-600 dark:text-gray-300">Não foi possível carregar a pergunta. Tente novamente.</p>
      }
      return (
          <div>
            <p className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-200">{question.question}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option) => (
                    <button key={option} onClick={() => handleAnswer(option)}
                        className={`p-4 rounded-lg text-white font-bold text-lg transition-all duration-300 ${getButtonClass(option)}`}
                        disabled={!!selectedAnswer}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {isCorrect !== null && (
                 <div className={`mt-6 p-4 rounded-lg text-center text-xl font-bold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isCorrect ? 'Parabéns, você acertou!' : `Que pena! A resposta correta era: ${question.correctAnswer}`}
                </div>
            )}
            <div className="text-center mt-8">
                <button onClick={fetchNewQuestion} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full text-xl flex items-center gap-2 mx-auto transition-transform hover:scale-105">
                    <SparklesIcon/> Próxima Pergunta
                </button>
            </div>
          </div>
      )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="BioKids Quiz">
     {renderContent()}
    </Modal>
  );
};
