import { Animal, QuizQuestion, HabitatGameData } from '../types';

const MODEL = 'gemini-2.0-flash';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const callGemini = async (contents: any[]): Promise<string> => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Erro ${res.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia');
  return text;
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');
      if (isRateLimit && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, (i + 1) * 10000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Maximo de tentativas atingido.');
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const SUFFIX = `Retorne APENAS JSON valido com: popularName, scientificName, habitat, diet, funFact, soundDescription, summary, identificationReasoning.`;

const VALID_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const identifyAnimal = async (source: File | string): Promise<Omit<Animal, 'id' | 'image'>> => {
  return withRetry(async () => {
    let contents;
    if (typeof source === 'string') {
      contents = [{ parts: [{ text: `Voce e um biologo. Forneca dados sobre o animal "${source}". ${SUFFIX}` }] }];
    } else {
      const base64 = await fileToBase64(source);
      const safeMime = VALID_MIMES.includes(source.type) ? source.type : 'image/jpeg';
      contents = [{
        parts: [
          { inline_data: { mime_type: safeMime, data: base64 } },
          { text: `Voce e um biologo especialista. Identifique este animal com precisao. ${SUFFIX}` }
        ]
      }];
    }
    const text = await callGemini(contents);
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  });
};

export const generateQuizQuestion = async (animal: Animal): Promise<QuizQuestion> => {
  return withRetry(async () => {
    const text = await callGemini([{ parts: [{ text: `Quiz sobre "${animal.popularName}": ${animal.funFact}. Retorne JSON: {"question":"...","options":["a","b","c","d"],"correctAnswer":"..."}` }] }]);
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  });
};

export const generateAnimalImage = async (): Promise<string> =>
  `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">🐾</text></svg>')}`;

export const getAnimalOfTheDay = async (dateStr: string): Promise<Omit<Animal, 'id' | 'image'>> => {
  return withRetry(async () => {
    const text = await callGemini([{ parts: [{ text: `Data: ${dateStr}. Escolha um animal brasileiro fascinante. ${SUFFIX}` }] }]);
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  });
};

export const generateHabitatGame = async (animal: Animal): Promise<HabitatGameData> => {
  return withRetry(async () => {
    const text = await callGemini([{ parts: [{ text: `Para "${animal.popularName}" que vive em "${animal.habitat}", gere 2 habitats incorretos. Retorne JSON: {"habitats":["...","..."]}` }] }]);
    const { habitats: wrong } = JSON.parse(text.replace(/```json|```/g, '').trim());
    const all = [animal.habitat, ...wrong];
    const img = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="80" text-anchor="middle" dominant-baseline="middle">🌿</text></svg>')}`;
    return { habitats: all.sort(() => Math.random() - 0.5).map(name => ({ name, image: img })), correctHabitat: animal.habitat };
  });
};
