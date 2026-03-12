import { Animal, QuizQuestion, HabitatGameData } from '../types';

const MODEL = 'gemini-1.5-flash';

// Chama nossa API Route do Vercel (server-side), não o Gemini diretamente
const callGemini = async (contents: any, generationConfig: any = {}): Promise<any> => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, contents, generationConfig }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Erro ${res.status}`);
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
        error?.message?.includes('rate') ||
        error?.message?.includes('quota');
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = (i + 1) * 10000;
        console.warn(`Rate limit. Aguardando ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Maximo de tentativas atingido.');
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const animalSchema = {
  type: "object",
  properties: {
    popularName: { type: "string" },
    scientificName: { type: "string" },
    habitat: { type: "string" },
    diet: { type: "string" },
    funFact: { type: "string" },
    soundDescription: { type: "string" },
    summary: { type: "string" },
    identificationReasoning: { type: "string" }
  },
  required: ["popularName", "scientificName", "habitat", "diet", "funFact", "soundDescription", "summary", "identificationReasoning"]
};

export const identifyAnimal = async (source: File | string): Promise<Omit<Animal, 'id' | 'image'>> => {
  const systemText = `Voce e um biologo especialista em taxonomia e morfologia animal.
Identifique animais e insetos com precisao cientifica rigorosa.
Analise: morfologia, padroes de cor, numero de patas, tipo de asas, segmentacao do corpo.
Para insetos, identifique Ordem, Familia e se possivel Genero/Especie.
Retorne APENAS um JSON valido com os campos: popularName, scientificName, habitat, diet, funFact, soundDescription, summary, identificationReasoning.`;

  return withRetry(async () => {
    let contents;

    if (typeof source === 'string') {
      contents = [{ parts: [{ text: `${systemText}\nAnimal: "${source}". Retorne JSON.` }] }];
    } else {
      const base64 = await fileToBase64(source);
      contents = [{
        parts: [
          { inline_data: { mime_type: source.type, data: base64 } },
          { text: `${systemText}\nAnalise esta imagem e retorne JSON.` }
        ]
      }];
    }

    const text = await callGemini(contents, {
      response_mime_type: "application/json",
      response_schema: animalSchema,
      temperature: 0,
    });

    return JSON.parse(text.trim());
  });
};

export const generateQuizQuestion = async (animal: Animal): Promise<QuizQuestion> => {
  const prompt = `Crie uma pergunta de quiz sobre "${animal.popularName}". Curiosidade: "${animal.funFact}". 
Retorne APENAS JSON com: question (string), options (array de 4 strings), correctAnswer (string).`;

  return withRetry(async () => {
    const text = await callGemini(
      [{ parts: [{ text: prompt }] }],
      {
        response_mime_type: "application/json",
        temperature: 0.5,
      }
    );
    return JSON.parse(text.trim());
  });
};

export const generateAnimalImage = async (_description: string): Promise<string> => {
  return `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">🐾</text></svg>')}`;
};

export const getAnimalOfTheDay = async (dateStr: string): Promise<Omit<Animal, 'id' | 'image'>> => {
  const prompt = `Data: ${dateStr}. Escolha um animal ou inseto brasileiro fascinante para ser o Animal do Dia.
Retorne APENAS JSON com: popularName, scientificName, habitat, diet, funFact, soundDescription, summary, identificationReasoning.`;

  return withRetry(async () => {
    const text = await callGemini(
      [{ parts: [{ text: prompt }] }],
      {
        response_mime_type: "application/json",
        response_schema: animalSchema,
        temperature: 0.7,
      }
    );
    return JSON.parse(text.trim());
  });
};

export const generateHabitatGame = async (animal: Animal): Promise<HabitatGameData> => {
  const prompt = `Para o animal "${animal.popularName}" que vive em "${animal.habitat}", gere 2 habitats incorretos.
Retorne APENAS JSON com: habitats (array de 2 strings).`;

  return withRetry(async () => {
    const text = await callGemini(
      [{ parts: [{ text: prompt }] }],
      { temperature: 0.5 }
    );

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      parsed = { habitats: ['Deserto', 'Tundra Artica'] };
    }

    const incorrectHabitats: string[] = parsed.habitats || [];
    const allHabitatNames = [animal.habitat, ...incorrectHabitats];
    const placeholder = (emoji: string) => `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`)}`;
    const habitatsWithImages = allHabitatNames.map(name => ({ name, image: placeholder('🌿') }));
    habitatsWithImages.sort(() => Math.random() - 0.5);
    return { habitats: habitatsWithImages, correctHabitat: animal.habitat };
  });
};
