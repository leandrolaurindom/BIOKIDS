
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Animal } from '../types';
import { Modal } from './Modal';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SoundIcon } from './icons/SoundIcon';

interface CollectionProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Animal[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onImport: (newCollection: Animal[]) => void;
}

const PAGE_SIZE = 10;

const DetailedView: React.FC<{ animal: Animal; onBack: () => void }> = ({ animal, onBack }) => {
  const { speak } = useSpeechSynthesis();
  
  const InfoRow: React.FC<{ label: string; value: string; index: number }> = ({ label, value, index }) => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center justify-between py-2 border-b border-green-100 dark:border-green-900 last:border-0"
    >
      <div className="flex-1">
        <h3 className="font-bold text-lg text-green-800 dark:text-green-300">{label}:</h3>
        <p className="text-gray-700 dark:text-gray-200">{value}</p>
      </div>
      <button onClick={() => speak(`${label}. ${value}`)} className="p-2 ml-2 rounded-full hover:bg-green-200 dark:hover:bg-green-700 transition-colors">
        <SoundIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
      </button>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <button onClick={onBack} className="mb-4 text-green-600 dark:text-green-400 font-bold flex items-center gap-1 hover:underline">
        ← Voltar para a Galeria
      </button>
      <div className="grid md:grid-cols-2 gap-6 bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-inner border-2 border-yellow-200">
        <div className="space-y-4">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={animal.image} 
            alt={animal.popularName} 
            className="w-full h-64 object-cover rounded-xl shadow-md border-4 border-white" 
          />
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-orange-600 dark:text-orange-400"
          >
            {animal.popularName}
          </motion.h2>
          <p className="text-gray-500 dark:text-gray-400 italic -mt-2">{animal.scientificName}</p>
        </div>
        <div className="space-y-1">
          <InfoRow label="Resumo" value={animal.summary} index={0} />
          <InfoRow label="Onde vive" value={animal.habitat} index={1} />
          <InfoRow label="O que come" value={animal.diet} index={2} />
          <InfoRow label="Curiosidade" value={animal.funFact} index={3} />
          {animal.identificationReasoning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800"
            >
              <h4 className="text-[10px] font-black text-blue-600 uppercase mb-1">Análise Taxonômica</h4>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-tight italic">"{animal.identificationReasoning}"</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const Collection: React.FC<CollectionProps> = ({ isOpen, onClose, collection, onRemove, onClear, onImport }) => {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayCount(PAGE_SIZE);
      setSelectedAnimal(null);
    }
  }, [isOpen]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "meu_album_biokids.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (Array.isArray(imported)) {
            onImport(imported);
            alert("Album restaurado com sucesso! 🎉");
          }
        } catch (err) {
          alert("Erro ao ler arquivo. Verifique se é um backup BioKids válido.");
        }
      };
      reader.readAsText(file);
    }
  };

  const visibleItems = collection.slice(0, displayCount);
  const hasMore = displayCount < collection.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={selectedAnimal ? "Detalhes da Descoberta" : "Minha Biblioteca Científica"}>
      <div className="flex flex-col h-full">
        <AnimatePresence mode="wait">
          {selectedAnimal ? (
            <DetailedView key="details" animal={selectedAnimal} onBack={() => setSelectedAnimal(null)} />
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div className="mb-6 bg-green-50 dark:bg-gray-800/50 p-4 rounded-2xl border-2 border-green-200 dark:border-green-700">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="font-black text-green-700 dark:text-green-400 text-sm uppercase tracking-tight">Progresso da Coleção</h3>
                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70 font-bold">
                      {collection.length < 10 ? "Explorador Iniciante" : 
                       collection.length < 25 ? "Pesquisador de Campo" : 
                       collection.length < 50 ? "Mestre Biólogo" : "Lenda da Natureza"}
                    </p>
                  </div>
                  <span className="font-black text-green-700 dark:text-green-400 text-lg">{collection.length}<span className="text-xs opacity-50">/50</span></span>
                </div>
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${Math.min((collection.length / 50) * 100, 100)}%` }}
                  ></div>
                </div>
                {collection.length >= 50 && (
                  <p className="text-center text-[10px] font-black text-orange-500 mt-2 animate-bounce">🏆 ÁLBUM COMPLETO! VOCÊ É INCRÍVEL! 🏆</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                <button onClick={handleExport} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                  📥 Salvar Backup (Arquivo)
                </button>
                <button onClick={handleImportClick} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                  📤 Restaurar Backup
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              </div>

              {collection.length === 0 ? (
                <div className="text-center p-8 flex-grow">
                  <p className="text-xl text-gray-600 dark:text-gray-300 italic">
                    Sua biblioteca está vazia. Explore a natureza!
                  </p>
                  <div className="mt-8 text-8xl animate-bounce">🐛</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-grow overflow-y-auto pb-6">
                    {visibleItems.map((animal, idx) => (
                      <motion.div 
                        key={animal.id} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        onClick={() => setSelectedAnimal(animal)}
                        className="relative group bg-white dark:bg-gray-700 p-2 rounded-xl shadow-md text-center transform transition-all duration-300 border-2 border-transparent hover:border-yellow-400 cursor-pointer"
                      >
                        <div className="overflow-hidden rounded-lg mb-2 aspect-square bg-gray-100">
                          <img src={animal.image} alt={animal.popularName} className="w-full h-full object-cover" />
                        </div>
                        <p className="font-bold text-green-800 dark:text-green-300 truncate text-xs md:text-sm">{animal.popularName}</p>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm("Remover esta figurinha?")) onRemove(animal.id);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          &times;
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-4 flex justify-center">
                      <button onClick={() => setDisplayCount(prev => prev + PAGE_SIZE)} className="bg-green-500 text-white font-black py-2 px-8 rounded-full shadow-lg text-sm">
                        Carregar Mais!
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-4 border-t-2 border-dashed border-yellow-200 flex justify-center">
                    <button onClick={onClear} className="text-red-400 hover:text-red-600 font-bold text-xs">
                      Limpar Toda a Biblioteca
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
