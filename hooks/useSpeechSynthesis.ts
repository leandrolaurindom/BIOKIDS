
import { useCallback } from 'react';

export const useSpeechSynthesis = () => {
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Brazilian Portuguese
      utterance.lang = 'pt-BR';
      
      // "Child-like" settings:
      // Higher pitch (1.5) makes the voice sound younger/more acute
      utterance.pitch = 1.5; 
      // Slightly faster rate (1.1) sounds more energetic/excited
      utterance.rate = 1.1;
      utterance.volume = 1.0;

      // Try to find a better voice if available (e.g. Google voices usually sound more natural)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('pt-BR') && v.name.includes('Google'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.cancel(); // Interrupt current speech
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  }, []);

  return { speak };
};
