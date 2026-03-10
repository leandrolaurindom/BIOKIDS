import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { identifyAnimal, generateAnimalImage, getAnimalOfTheDay } from './services/geminiService';
import { encodeDiscovery, decodeDiscovery, buildShareUrl } from './services/shareService';
import { Animal } from './types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { Mascot } from './components/Mascot';
import { Collection } from './components/Collection';
import { Quiz } from './components/Quiz';
import { HabitatGame } from './components/HabitatGame';
import { DiscoveryReceived } from './components/DiscoveryReceived';
import { SoundIcon } from './components/icons/SoundIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { CameraCapture } from './components/CameraCapture';
import { CameraIcon } from './components/icons/CameraIcon';
import { ShareIcon } from './components/icons/ShareIcon';
import { Achievements, AchievementToast, ACHIEVEMENTS, Achievement } from './components/Achievements';

const STORAGE_KEY = 'biokids-v5-final';
const AOD_STORAGE_KEY = 'biokids-aod-v1';

const base64ToFile = async (base64String: string, fileName: string): Promise<File> => {
  const res = await fetch(base64String);
  const blob = await res.blob();
  return new File([blob], fileName, { type: 'image/jpeg' });
};

const resizeImage = (file: File, maxWidth = 1024, maxHeight = 1024): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          else resolve(file);
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const getImageHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

const ResultCard: React.FC<{ animal: Animal; onShowCollection: () => void }> = ({ animal, onShowCollection }) => {
    const { speak } = useSpeechSynthesis();

    const handleShareLink = async () => {
        const shareUrl = buildShareUrl(animal);
        const shareText = `Olha que legal! Encontrei um(a) ${animal.popularName} no BioKids!`;
        const shareData = { title: `BioKids: ${animal.popularName}`, text: shareText, url: shareUrl };
        if (navigator.share) {
            try { await navigator.share(shareData); }
            catch (err) {
              if ((err as Error).name !== 'AbortError') {
                  await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                  alert('Link copiado!');
              }
            }
        } else {
            await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
            alert('Link copiado!');
        }
    };

    const handleShareComplete = async () => {
        const textReport = `🐾 *FICHA BIOKIDS: ${animal.popularName.toUpperCase()}* 🐾\n\n` +
            `🌍 *Habitat:* ${animal.habitat}\n` +
            `🍎 *Alimentacao:* ${animal.diet}\n` +
            `💡 *Curiosidade:* ${animal.funFact}\n\n` +
            `🔬 *Cientifico:* ${animal.scientificName}`;
        try {
            if (animal.image && navigator.share) {
                const imageFile = await base64ToFile(animal.image, `${animal.popularName.toLowerCase()}.jpg`);
                const shareData: ShareData = { text: textReport, files: [imageFile], title: animal.popularName };
                if (navigator.canShare && navigator.canShare({ files: [imageFile] })) await navigator.share(shareData);
                else await navigator.share({ text: textReport });
            } else {
                if (navigator.share) await navigator.share({ text: textReport });
                else { await navigator.clipboard.writeText(textReport); alert('Ficha copiada!'); }
            }
        } catch (e) { console.error("Error sharing", e); }
    };

    const InfoRow: React.FC<{ label: string; value: string; index: number }> = ({ label, value, index }) => (
        <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
            <div className="flex-1 pr-2">
                <h3 className="font-bold text-[9px] text-green-600 uppercase tracking-wider">{label}</h3>
                <p className="text-gray-700 dark:text-gray-200 text-sm leading-tight">{value}</p>
            </div>
            <button onClick={() => speak(`${label}. ${value}`)} className="p-1.5 rounded-full hover:bg-green-50 transition-colors">
                <SoundIcon className="w-4 h-4 text-green-500" />
            </button>
        </motion.div>
    );

    return (
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-5 w-full max-w-3xl mx-auto my-6 border-2 border-yellow-300 relative overflow-hidden"
        >
            <motion.div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"
                animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
            <div className="grid md:grid-cols-2 gap-5">
                <div className="relative">
                  <motion.img whileHover={{ scale: 1.05, rotate: 1 }} src={animal.image} alt={animal.popularName}
                    className="w-full h-60 object-cover rounded-2xl shadow-sm border-2 border-white cursor-zoom-in" />
                  <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] font-bold text-green-700 uppercase">Foto do Explorador</div>
                </div>
                <div className="flex flex-col">
                    <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-orange-500 mb-0">
                        {animal.popularName}
                    </motion.h2>
                    <p className="text-xs italic text-gray-400 mb-3">{animal.scientificName}</p>
                    <div className="space-y-0.5 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl">
                        <InfoRow label="Habitat" value={animal.habitat} index={0} />
                        <InfoRow label="Alimentacao" value={animal.diet} index={1} />
                        <InfoRow label="Curiosidade" value={animal.funFact} index={2} />
                    </div>
                    {animal.identificationReasoning && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                            <h4 className="text-[8px] font-black text-blue-600 uppercase mb-1">Nota do Biologo</h4>
                            <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-tight italic">"{animal.identificationReasoning}"</p>
                        </motion.div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleShareLink}
                            className="bg-blue-600 text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-sm">
                            <ShareIcon className="w-3.5 h-3.5" /> TROCAR FIGURINHA
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleShareComplete}
                            className="bg-green-500 text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-sm">
                            <SparklesIcon className="w-3.5 h-3.5" /> ENVIAR FICHA
                        </motion.button>
                    </div>
                </div>
            </div>
            <button onClick={onShowCollection} className="w-full mt-4 text-blue-500 font-bold text-[10px] hover:underline uppercase tracking-widest text-center">
                Ver album completo de descobertas
            </button>
        </motion.div>
    );
};

// Card do Animal do Dia
const AnimalDoDiaCard: React.FC<{ animal: Animal | null; loading: boolean; onCollect: (a: Animal) => void; alreadyCollected: boolean }> = ({ animal, loading, onCollect, alreadyCollected }) => {
  const { speak } = useSpeechSynthesis();
  if (loading) return (
    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-5 mb-6 text-center shadow-xl">
      <p className="font-black text-white text-lg">🔍 Buscando animal do dia...</p>
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mt-3"></div>
    </div>
  );
  if (!animal) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-3 right-3 bg-white text-orange-500 text-[9px] font-black px-2 py-1 rounded-full shadow">NOVO!</div>
      <h3 className="text-white font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-1">✨ Animal do Dia ✨</h3>
      <div className="flex gap-4">
        <img src={animal.image} alt={animal.popularName} className="w-24 h-24 object-cover rounded-2xl shadow-md border-2 border-white/50 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-white font-black text-xl leading-tight">{animal.popularName}</h4>
          <p className="text-white/80 text-[10px] italic mb-2">{animal.scientificName}</p>
          <p className="text-white text-xs leading-snug line-clamp-3">"{animal.funFact}"</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => speak(animal.funFact)}
          className="flex-1 bg-white/20 text-white font-black text-[10px] py-2 rounded-xl hover:bg-white/30 transition-all">
          🔊 OUVIR CURIOSIDADE
        </button>
        <button onClick={() => onCollect(animal)} disabled={alreadyCollected}
          className={`flex-1 font-black text-[10px] py-2 rounded-xl transition-all ${alreadyCollected ? 'bg-white/20 text-white/60' : 'bg-white text-orange-500 shadow-md hover:scale-105'}`}>
          {alreadyCollected ? '✅ COLETADO' : '⭐ COLETAR'}
        </button>
      </div>
    </motion.div>
  );
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<Animal | null>(null);
  const [collection, setCollection] = useState<Animal[]>([]);
  const [showCollection, setShowCollection] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showHabitatGame, setShowHabitatGame] = useState(false);
  const [sharedDiscovery, setSharedDiscovery] = useState<Omit<Animal, 'id'> | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [previousCount, setPreviousCount] = useState(0);
  const [animalDoDia, setAnimalDoDia] = useState<Animal | null>(null);
  const [loadingAOD, setLoadingAOD] = useState(false);
  const [showAOD, setShowAOD] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCollection(parsed);
      } catch (e) {}
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const urlParams = new URLSearchParams(window.location.search);
    const snEncoded = urlParams.get('sn');
    if (snEncoded) {
      const sn = decodeDiscovery(snEncoded);
      if (sn) handleReceivedDiscovery(sn);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (collection.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    const unlocked = ACHIEVEMENTS.find(a => collection.length >= a.required && previousCount < a.required);
    if (unlocked) {
      setNewAchievement(unlocked);
      setTimeout(() => setNewAchievement(null), 3500);
    }
    setPreviousCount(collection.length);
  }, [collection]);

  const handleLoadAOD = async () => {
    setShowAOD(true);
    if (animalDoDia) return; // ja carregado
    const today = new Date().toISOString().split('T')[0];
    const savedAOD = localStorage.getItem(AOD_STORAGE_KEY);
    if (savedAOD) {
      try {
        const parsed = JSON.parse(savedAOD);
        if (parsed.date === today) { setAnimalDoDia(parsed.animal); return; }
      } catch (e) {}
    }
    setLoadingAOD(true);
    try {
      const aodData = await getAnimalOfTheDay(today);
      const image = await generateAnimalImage(`Professional wildlife photography of ${aodData.popularName}, close up, natural lighting.`);
      const animal: Animal = { ...aodData, id: `aod-${today}`, image };
      setAnimalDoDia(animal);
      localStorage.setItem(AOD_STORAGE_KEY, JSON.stringify({ date: today, animal }));
    } catch (e) {
      console.error("AOD error", e);
    } finally {
      setLoadingAOD(false);
    }
  };

  const handleReceivedDiscovery = async (sn: string) => {
    setLoading(true);
    try {
      const data = await identifyAnimal(sn);
      const placeholder = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">🐾</text></svg>')}`;
      setSharedDiscovery({ ...data, image: placeholder });
    } catch (e) {
      setError("Erro ao carregar figurinha compartilhada.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isOnline) { setError('Voce esta offline!'); return; }
    const source = activeTab === 'photo' ? imageFile : description;
    if (!source) { setError('Tire uma foto ou escreva o que viu primeiro!'); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let finalSource: File | string = source;
      if (activeTab === 'photo' && imageFile) finalSource = await resizeImage(imageFile);

      let imageHash = '';
      if (finalSource instanceof File) {
        imageHash = await getImageHash(finalSource);
        const cached = collection.find(a => (a as any).imageHash === imageHash);
        if (cached) { setResult(cached); setLoading(false); return; }
      }

      const animalData = await identifyAnimal(finalSource);
      const existsByName = collection.find(a => a.scientificName.toLowerCase() === animalData.scientificName.toLowerCase());
      if (existsByName) { setResult(existsByName); setLoading(false); return; }

      let imageB64 = '';
      if (activeTab === 'photo' && finalSource instanceof File) imageB64 = await fileToBase64(finalSource);
      else imageB64 = await generateAnimalImage(`Uma foto nitida e profissional de um(a) ${animalData.popularName} na natureza.`);

      const newAnimal = { ...animalData, id: `${animalData.scientificName}-${Date.now()}`, image: imageB64, imageHash } as Animal & { imageHash: string };
      setCollection(prev => [newAnimal, ...prev]);
      setResult(newAnimal);
    } catch (err) {
      setError('Nao conseguimos identificar este animal. Tente de outro angulo!');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectAOD = (animal: Animal) => {
    const exists = collection.find(a => a.scientificName.toLowerCase() === animal.scientificName.toLowerCase());
    if (!exists) { setCollection(prev => [animal, ...prev]); setResult(animal); }
  };

  return (
    <div className="bg-green-50 dark:bg-gray-900 min-h-screen text-gray-800 font-sans pb-20">
      <header className="bg-green-600 text-white p-3 shadow-lg flex justify-between items-center sticky top-0 z-40 border-b-2 border-green-700">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-green-900 text-xl shadow-inner">🐞</div>
           <div>
             <div className="flex items-center gap-2">
               <h1 className="text-xl font-black tracking-tight uppercase leading-none">BioKids</h1>
               {!isOnline && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Offline</motion.span>}
             </div>
             <div className="flex items-center gap-1 mt-0.5">
                <div className="w-16 h-1.5 bg-green-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${Math.min((collection.length / 1000) * 100, 100)}%` }}></div>
                </div>
                <span className="text-[8px] font-bold opacity-80">{collection.length}/1000</span>
             </div>
           </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLoadAOD} className="bg-yellow-300 text-green-900 font-black py-1.5 px-3 rounded-xl text-[10px] shadow-md border-b-2 border-yellow-500 active:translate-y-0.5 transition-all">
            ✨ DIA
          </button>
          <button onClick={() => setShowCollection(true)} className="bg-yellow-400 text-green-900 font-black py-1.5 px-4 rounded-xl text-[10px] shadow-md border-b-2 border-yellow-600 active:translate-y-0.5 transition-all">
            ALBUM
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-2xl">
        <Mascot
          message={
            !isOnline ? "Voce esta offline, mas ainda pode ver seu album!"
            : result ? `Incrivel! ${result.popularName} catalogado! 🎉`
            : loading ? "Analisando... aguarde um momento!"
            : "Oi! Eu sou a Jojo. Vamos explorar a natureza hoje?"
          }
          mood={!isOnline ? 'offline' : result ? 'excited' : loading ? 'thinking' : 'happy'}
        />

        <Achievements count={collection.length} previousCount={previousCount} />

        {showAOD && (
          <AnimalDoDiaCard
            animal={animalDoDia}
            loading={loadingAOD}
            onCollect={handleCollectAOD}
            alreadyCollected={!!collection.find(a => a.scientificName.toLowerCase() === animalDoDia?.scientificName.toLowerCase())}
          />
        )}

        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-xl border-b-4 border-green-500">
            <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
              <button onClick={() => {setActiveTab('photo'); setIsCameraOpen(false);}} className={`flex-1 py-2 font-black rounded-xl text-xs transition-all ${activeTab === 'photo' ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600' : 'text-gray-400'}`}>FOTO</button>
              <button onClick={() => {setActiveTab('text'); setIsCameraOpen(false);}} className={`flex-1 py-2 font-black rounded-xl text-xs transition-all ${activeTab === 'text' ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600' : 'text-gray-400'}`}>DESCRICAO</button>
            </div>

            {activeTab === 'photo' ? (
              <div className="space-y-3">
                {!isCameraOpen ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl hover:bg-green-50 transition-colors">
                        <span className="text-3xl">🖼️</span>
                        <span className="font-bold text-gray-400 text-[9px] mt-1 uppercase tracking-tighter">Galeria</span>
                        <input type="file" accept="image/*" onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setImageFile(e.target.files[0]);
                            const r = new FileReader();
                            r.onloadend = () => setImagePreview(r.result as string);
                            r.readAsDataURL(e.target.files[0]);
                          }
                        }} className="hidden"/>
                      </label>
                      <button onClick={() => setIsCameraOpen(true)} className="bg-blue-600 text-white rounded-2xl font-black flex flex-col items-center justify-center gap-1 shadow-md h-24 active:scale-95 transition-all">
                        <CameraIcon className="w-8 h-8" />
                        <span className="text-[9px] uppercase tracking-tighter">Camera</span>
                      </button>
                    </div>
                    {imagePreview && (
                      <div className="relative mx-auto max-w-[150px] mt-2">
                        <img src={imagePreview} alt="Preview" className="rounded-xl shadow-md w-full aspect-square object-cover border-2 border-white"/>
                        <button onClick={() => {setImageFile(null); setImagePreview(null);}} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full shadow-md text-sm font-bold flex items-center justify-center">&times;</button>
                      </div>
                    )}
                  </>
                ) : (
                  <CameraCapture onCapture={(f, p) => { setImageFile(f); setImagePreview(p); setIsCameraOpen(false); }} onClose={() => setIsCameraOpen(false)} />
                )}
              </div>
            ) : (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Vi um besouro com chifres na arvore..."
                className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl h-24 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-100 outline-none transition-all font-bold text-sm"
              ></textarea>
            )}

            {!isCameraOpen && (
              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-4 bg-orange-500 text-white font-black text-xl py-4 rounded-2xl hover:bg-orange-600 active:translate-y-0.5 shadow-[0_5px_0_rgb(194,65,12)] active:shadow-none transition-all disabled:bg-gray-300">
                {loading ? 'DESCOBRINDO...' : 'INVESTIGAR!'}
              </button>
            )}
        </div>

        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-xl font-bold text-center text-xs">{error}</div>}
        {loading && <div className="text-center my-10"><div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent shadow-lg"></div></div>}
        <AnimatePresence>
          {result && <ResultCard key={result.id} animal={result} onShowCollection={() => setShowCollection(true)} />}
        </AnimatePresence>
      </main>

      <AchievementToast achievement={newAchievement} onDismiss={() => setNewAchievement(null)} />

      <DiscoveryReceived
        animal={sharedDiscovery}
        onSave={() => {
          if (sharedDiscovery) {
            const na: Animal = { ...sharedDiscovery, id: `${sharedDiscovery.scientificName}-${Date.now()}` };
            setCollection(prev => [na, ...prev]); setResult(na); setSharedDiscovery(null);
          }
        }}
        onClose={() => setSharedDiscovery(null)}
      />

      <Collection isOpen={showCollection} onClose={() => setShowCollection(false)} collection={collection}
        onRemove={(id) => setCollection(prev => prev.filter(a => a.id !== id))}
        onClear={() => { if(confirm("Apagar seu progresso?")) { setCollection([]); localStorage.removeItem(STORAGE_KEY); } }}
        onImport={(imp) => setCollection(imp)} />

      <Quiz isOpen={showQuiz} onClose={() => setShowQuiz(false)} collection={collection} />
      <HabitatGame isOpen={showHabitatGame} onClose={() => setShowHabitatGame(false)} collection={collection} />

      <div className="fixed bottom-4 right-4 flex flex-col gap-3">
         <button onClick={() => setShowHabitatGame(true)} className="bg-purple-600 text-white w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-xl border-2 border-purple-400 hover:scale-110 active:scale-95 transition-all">🎮</button>
         <button onClick={() => setShowQuiz(true)} className="bg-blue-600 text-white w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-xl border-2 border-blue-400 hover:scale-110 active:scale-95 transition-all">❓</button>
      </div>
    </div>
  );
}

export default App;
