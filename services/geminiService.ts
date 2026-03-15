import { Animal, QuizQuestion, HabitatGameData } from '../types';

const MODEL = 'gemini-1.5-flash';

const callGemini = async (contents: any, generationConfig: any = {}): Promise<string> => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, contents, generationConfig }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia da API');
  return text;
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') ||
        error?.message?.includes('rate') || error?.message?.includes('quota');
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = (i + 1) * 8000;
        console.warn(`Rate limit. Aguardando ${waitTime / 1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
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

const ANIMAL_PROMPT_SUFFIX = `
Retorne APENAS um JSON valido com estes campos exatos:
{
  "popularName": "nome popular em portugues",
  "scientificName": "Genero especie",
  "habitat": "habitat natural",
  "diet": "o que come",
  "funFact": "curiosidade interessante para criancas",
  "soundDescription": "som que faz",
  "summary": "resumo educativo curto",
  "identificationReasoning": "por que identificou assim"
}`;

export const identifyAnimal = async (source: File | string): Promise<Omit<Animal, 'id' | 'image'>> => {
  return withRetry(async () => {
    let contents;
    const instruction = `Voce e um biologo especialista. Identifique este animal com precisao cientifica. Analise morfologia, cores, padroes e contexto da imagem.${ANIMAL_PROMPT_SUFFIX}`;

    if (typeof source === 'string') {
      contents = [{ parts: [{ text: `Forneca dados completos sobre o animal chamado "${source}".${ANIMAL_PROMPT_SUFFIX}` }] }];
    } else {
      const base64 = await fileToBase64(source);
      contents = [{ parts: [{ inline_data: { mime_type: source.type, data: base64 } }, { text: instruction }] }];
    }

    const text = await callGemini(contents, { temperature: 0 });
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  });
};

export const generateQuizQuestion = async (animal: Animal): Promise<QuizQuestion> => {
  return withRetry(async () => {
    const prompt = `Crie uma pergunta de quiz sobre o animal "${animal.popularName}". Curiosidade: "${animal.funFact}".
Retorne APENAS JSON: {"question": "...", "options": ["a","b","c","d"], "correctAnswer": "..."}`;
    const text = await callGemini([{ parts: [{ text: prompt }] }], { temperature: 0.5 });
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  });
};

export const generateAnimalImage = async (_description: string): Promise<string> =>
  `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">🐾</text></svg>')}`;

export const getAnimalOfTheDay = async (dateStr: string): Promise<Omit<Animal, 'id' | 'image'>> => {
  return withRetry(async () => {
    const prompt = `Data: ${dateStr}. Escolha um animal ou inseto brasileiro fascinante para o Animal do Dia.${ANIMAL_PROMPT_SUFFIX}`;
    const text = await callGemini([{ parts: [{ text: prompt }] }], { temperature: 0.7 });
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  });
};

export const generateHabitatGame = async (animal: Animal): Promise<HabitatGameData> => {
  return withRetry(async () => {
    const prompt = `Para o animal "${animal.popularName}" que vive em "${animal.habitat}", gere 2 habitats incorretos.
Retorne APENAS JSON: {"habitats": ["habitat errado 1", "habitat errado 2"]}`;
    const text = await callGemini([{ parts: [{ text: prompt }] }], { temperature: 0.5 });
    const clean = text.replace(/```json|```/g, '').trim();
    const { habitats: wrong } = JSON.parse(clean);
    const all = [animal.habitat, ...wrong];
    const placeholder = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="80" text-anchor="middle" dominant-baseline="middle">🌿</text></svg>')}`;
    const habitats = all.map(name => ({ name, image: placeholder }));
    habitats.sort(() => Math.random() - 0.5);
    return { habitats, correctHabitat: animal.habitat };
  });
};
