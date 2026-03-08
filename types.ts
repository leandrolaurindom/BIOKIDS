
export interface Animal {
  id: string;
  popularName: string;
  scientificName: string;
  habitat: string;
  diet: string;
  funFact: string;
  soundDescription: string;
  summary: string;
  identificationReasoning?: string;
  image?: string; // base64 image data
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface HabitatGameData {
  habitats: {
    name: string;
    image: string; // base64 image data
  }[];
  correctHabitat: string;
}
