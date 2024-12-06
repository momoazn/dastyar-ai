/**
 * Speech recognition utility functions
 * @module utils/speech
 */

/**
 * Creates a new SpeechRecognition instance with Persian language settings
 */
export const createSpeechRecognition = (): SpeechRecognition => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'fa-IR';
  recognition.continuous = true;
  recognition.interimResults = true;
  
  return recognition;
};

/**
 * Converts text to speech in Persian
 */
export const speak = (text: string): void => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fa-IR';
  utterance.rate = 1;
  utterance.pitch = 1;
  
  window.speechSynthesis.speak(utterance);
};