
import { GoogleGenAI, Type } from "@google/genai";
import { Animal, QuizQuestion, HabitatGameData } from '../types';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const animalSchema = {
  type: Type.OBJECT,
  properties: {
    popularName: { type: Type.STRING, description: "Nome popular comum no Brasil." },
    scientificName: { type: Type.STRING, description: "Nome científico rigoroso (Gênero + espécie)." },
    habitat: { type: Type.STRING, description: "Habitat natural baseado em dados biológicos." },
    diet: { type: Type.STRING, description: "Hábito alimentar técnico." },
    funFact: { type: Type.STRING, description: "Curiosidade biológica interessante para crianças." },
    soundDescription: { type: Type.STRING, description: "Descrição do som ou comportamento acústico." },
    summary: { type: Type.STRING, description: "Resumo educativo com base científica simplificada." },
    identificationReasoning: { type: Type.STRING, description: "Explicação técnica detalhada das características morfológicas (padrões, cores, formato) que confirmam esta identificação específica." }
  },
  required: ["popularName", "scientificName", "habitat", "diet", "funFact", "soundDescription", "summary", "identificationReasoning"]
};

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING, description: "Pergunta do quiz." },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4 opções de resposta."
        },
        correctAnswer: { type: Type.STRING, description: "A resposta correta." }
    },
    required: ["question", "options", "correctAnswer"]
};

const incorrectHabitatsSchema = {
    type: Type.OBJECT,
    properties: {
        habitats: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2 nomes de habitats incorretos."
        }
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
  const systemInstruction = `Você é um biólogo especialista em taxonomia e morfologia animal. 
Sua tarefa é identificar animais e insetos com precisão científica rigorosa. 
Analise detalhadamente:
1. Morfologia: Formato do corpo, antenas, tipo de asas, número de patas.
2. Padrões: Cores, manchas, texturas da pele ou exoesqueleto.
3. Contexto: Se houver plantas ou ambiente na foto, use como pista.
Para insetos, seja específico na Família e, se possível, Gênero/Espécie. 
Seja extremamente consistente: a mesma imagem deve sempre resultar na mesma identificação científica.`;

  if (typeof source === 'string') {
    contents = { parts: [{ text: `${systemInstruction}\nO usuário forneceu o nome (popular ou científico): "${source}". Forneça os detalhes completos e precisos deste animal no formato JSON solicitado.` }] };
  } else {
    const imagePart = await fileToGenerativePart(source);
    contents = { parts: [imagePart, { text: `${systemInstruction}\nAnalise esta imagem com rigor científico. Identifique as características morfológicas visíveis e determine a espécie exata. Explique seu raciocínio no campo identificationReasoning.` }] };
  }

  try {
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
  } catch (error) {
    console.error("Identification error:", error);
    throw new Error("Falha na identificação.");
  }
};

export const generateQuizQuestion = async (animal: Animal): Promise<QuizQuestion> => {
    const prompt = `Crie uma pergunta sobre o animal "${animal.popularName}". Baseie-se em: ${animal.funFact}. 4 opções.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        throw new Error("Erro no quiz.");
    }
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
}

export const generateAnimalImage = async (description: string): Promise<string> => {
  return await generateImageForPrompt(description);
};

export const getAnimalOfTheDay = async (dateStr: string): Promise<Omit<Animal, 'id' | 'image'>> => {
  const systemInstruction = `Você é um biólogo especialista. Sugira um animal ou inseto interessante para ser o "Animal do Dia". Escolha algo educativo e curioso.`;
  const prompt = `Data de hoje: ${dateStr}. Escolha um animal único e forneça os detalhes no formato JSON solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: `${systemInstruction}\n${prompt}` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: animalSchema,
        temperature: 0.5,
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Animal of the day error:", error);
    throw new Error("Falha ao carregar animal do dia.");
  }
};

export const generateHabitatGame = async (animal: Animal): Promise<HabitatGameData> => {
    try {
        const prompt = `Para o animal "${animal.popularName}", gere 2 habitats incorretos.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: incorrectHabitatsSchema,
            }
        });
        const { habitats: incorrectHabitats } = JSON.parse(response.text.trim());
        const allHabitatNames = [animal.habitat, ...incorrectHabitats];
        const images = await Promise.all(allHabitatNames.map(name => 
            generateImageForPrompt(`Nature habitat of ${name}, no animals, cartoon style.`)
        ));
        const habitatsWithImages = allHabitatNames.map((name, index) => ({ name, image: images[index] }));
        habitatsWithImages.sort(() => Math.random() - 0.5);
        return { habitats: habitatsWithImages, correctHabitat: animal.habitat };
    } catch (error) {
        throw new Error("Erro no jogo.");
    }
};
