import { GoogleGenAI, Type } from "@google/genai";
import { Animal, QuizQuestion, HabitatGameData } from '../types';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const MODEL = 'gemini-1.5-flash';

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') ||
                          error?.message?.includes('rate') ||
                          error?.message?.includes('quota') ||
                          JSON.stringify(error)?.includes('retryDelay');
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = (i + 1) * 10000;
        console.warn(`Rate limit. Aguardando ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Maximo de tentativas atingido.");
};

const animalSchema = {
  type: Type.OBJECT,
  properties: {
    popularName: { type: Type.STRING, description: "Nome popular comum no Brasil." },
    scientificName: { type: Type.STRING, description: "Nome cientifico rigoroso (Genero + especie)." },
    habitat: { type: Type.STRING, description: "Habitat natural baseado em dados biologicos." },
    diet: { type: Type.STRING, description: "Habito alimentar tecnico." },
    funFact: { type: Type.STRING, description: "Curiosidade biologica interessante para criancas." },
    soundDescription: { type: Type.STRING, description: "Descricao do som ou comportamento acustico." },
    summary: { type: Type.STRING, description: "Resumo educativo com base cientifica simplificada." },
    identificationReasoning: { type: Type.STRING, description: "Explicacao tecnica das caracteristicas morfologicas que confirmam esta identificacao." }
  },
  required: ["popularName", "scientificName", "habitat", "diet", "funFact", "soundDescription", "summary", "identificationReasoning"]
};

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING }
  },
  required: ["question", "options", "correctAnswer"]
};

const incorrectHabitatsSchema = {
  type: Type.OBJECT,
  properties: {
    habitats: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["habitats"]
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const identifyAnimal = async (source: File | string): Promise<Omit<Animal, 'id' | 'image'>> => {
  const systemInstruction = `Voce e um biologo especialista em taxonomia e morfologia animal.
Sua tarefa e identificar animais e insetos com precisao cientifica rigorosa.
Analise detalhadamente:
1. Morfologia: Formato do corpo, antenas, tipo de asas, numero de patas, segmentacao.
2. Padroes: Cores, manchas, texturas da pele ou exoesqueleto.
3. Contexto: Se houver plantas ou ambiente na foto, use como pista taxonomica.
Para insetos, seja especifico na Ordem, Familia e, se possivel, Genero/Especie.
Seja extremamente consistente: a mesma imagem deve sempre resultar na mesma identificacao cientifica.`;

  let contents;
  if (typeof source === 'string') {
    contents = { parts: [{ text: `${systemInstruction}\nO usuario forneceu o nome: "${source}". Forneca os detalhes completos no formato JSON.` }] };
  } else {
    const imagePart = await fileToGenerativePart(source);
    contents = { parts: [imagePart, { text: `${systemInstruction}\nAnalise esta imagem com rigor cientifico. Identifique as caracteristicas morfologicas visiveis e determine a especie exata.` }] };
  }

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: animalSchema,
        temperature: 0,
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const generateQuizQuestion = async (animal: Animal): Promise<QuizQuestion> => {
  const prompt = `Crie uma pergunta de quiz sobre o animal "${animal.popularName}" (${animal.scientificName}). Baseie-se nesta curiosidade: "${animal.funFact}". Crie 4 opcoes de resposta, apenas uma correta.`;
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json", responseSchema: quizSchema }
    });
    return JSON.parse(response.text.trim());
  });
};

const generateImageForPrompt = async (prompt: string): Promise<string> => {
  const emoji = prompt.toLowerCase().includes('habitat') ? '🌿' : '🐾';
  return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`)}`;
};

export const generateAnimalImage = async (description: string): Promise<string> => {
  return generateImageForPrompt(description);
};

export const getAnimalOfTheDay = async (dateStr: string): Promise<Omit<Animal, 'id' | 'image'>> => {
  const prompt = `Data: ${dateStr}. Voce e um biologo. Escolha um animal ou inseto brasileiro unico e interessante para ser o Animal do Dia. Forneca detalhes completos no formato JSON.`;
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: animalSchema,
        temperature: 0.7,
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const generateHabitatGame = async (animal: Animal): Promise<HabitatGameData> => {
  const prompt = `Para o animal "${animal.popularName}" que vive em "${animal.habitat}", gere 2 habitats incorretos e diferentes.`;
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json", responseSchema: incorrectHabitatsSchema }
    });
    const { habitats: incorrectHabitats } = JSON.parse(response.text.trim());
    const allHabitatNames = [animal.habitat, ...incorrectHabitats];
    const images = await Promise.all(allHabitatNames.map(name => generateImageForPrompt(`habitat ${name}`)));
    const habitatsWithImages = allHabitatNames.map((name, index) => ({ name, image: images[index] }));
    habitatsWithImages.sort(() => Math.random() - 0.5);
    return { habitats: habitatsWithImages, correctHabitat: animal.habitat };
  });
};