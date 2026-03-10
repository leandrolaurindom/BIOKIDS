import { GoogleGenAI, Type } from "@google/genai";
import { Animal, QuizQuestion, HabitatGameData } from '../types';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

// Retry com espera exponencial para lidar com rate limit
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
        console.warn(`Rate limit. Aguardando ${waitTime/1000}s...`);
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
    identificationReasoning: { type: Type.STRING, description: "Explicacao tecnica detalhada das caracteristicas morfologicas que confirmam esta identificacao especifica." }
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
  let contents;
  const systemInstruction = `Voce e um biologo especialista em taxonomia e morfologia animal.
Sua tarefa e identificar animais e insetos com precisao cientifica rigorosa.
Analise detalhadamente:
1. Morfologia: Formato do corpo, antenas, tipo de asas, numero de patas.
2. Padroes: Cores, manchas, texturas da pele ou exoesqueleto.
3. Contexto: Se houver plantas ou ambiente na foto, use como pista.
Para insetos, seja especifico na Familia e, se possivel, Genero/Especie.
Seja extremamente consistente: a mesma imagem deve sempre resultar na mesma identificacao cientifica.`;

  if (typeof source === 'string') {
    contents = { parts: [{ text: `${systemInstruction}\nO usuario forneceu o nome: "${source}". Forneca os detalhes completos no formato JSON.` }] };
  } else {
    const imagePart = await fileToGenerativePart(source);
    contents = { parts: [imagePart, { text: `${systemInstruction}\nAnalise esta imagem com rigor cientifico. Identifique as caracteristicas morfologicas visiveis e determine a especie exata.` }] };
  }

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    const prompt = `Crie uma pergunta sobre o animal "${animal.popularName}". Baseie-se em: ${animal.funFact}. 4 opcoes.`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: quizSchema }
        });
        return JSON.parse(response.text.trim());
    });
};

const generateImageForPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: `Generate image: ${prompt}` }] },
            config: { responseModalities: ['IMAGE', 'TEXT'] } as any,
        });
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if ((part as any).inlineData) return `data:image/png;base64,${(part as any).inlineData.data}`;
        }
    } catch (e) {
        console.warn('Image generation failed, using placeholder');
    }
    const emoji = prompt.toLowerCase().includes('habitat') ? '🌿' : '🐾';
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#f0fdf4"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`)}`;
};

export const generateAnimalImage = async (description: string): Promise<string> => {
  return generateImageForPrompt(description);
};

export const getAnimalOfTheDay = async (dateStr: string): Promise<Omit<Animal, 'id' | 'image'>> => {
  const prompt = `Data: ${dateStr}. Voce e um biologo. Escolha um animal ou inseto unico e interessante para ser o Animal do Dia e forneca detalhes no formato JSON.`;
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: animalSchema,
        temperature: 0.5,
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const generateHabitatGame = async (animal: Animal): Promise<HabitatGameData> => {
    const prompt = `Para o animal "${animal.popularName}", gere 2 habitats incorretos.`;
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: incorrectHabitatsSchema }
        });
        const { habitats: incorrectHabitats } = JSON.parse(response.text.trim());
        const allHabitatNames = [animal.habitat, ...incorrectHabitats];
        const images = await Promise.all(allHabitatNames.map(name =>
            generateImageForPrompt(`Nature habitat of ${name}, no animals, cartoon style.`)
        ));
        const habitatsWithImages = allHabitatNames.map((name, index) => ({ name, image: images[index] }));
        habitatsWithImages.sort(() => Math.random() - 0.5);
        return { habitats: habitatsWithImages, correctHabitat: animal.habitat };
    });
};
