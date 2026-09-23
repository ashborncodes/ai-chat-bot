/**
 * Web Speech API utilities for hands-free first responder voice commands
 * and audio guidance narration.
 */

// Speech Recognition (Speech-to-Text)
export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function createSpeechRecognition(handlers: SpeechRecognitionHandlers) {
  if (!isSpeechRecognitionSupported()) {
    handlers.onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  recognition.onstart = () => {
    handlers.onStart();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const combined = finalTranscript || interimTranscript;
    if (combined) {
      handlers.onResult(combined, Boolean(finalTranscript));
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    handlers.onError(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd();
  };

  return recognition;
}

// Speech Synthesis (Text-to-Speech)
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onStart?: () => void;
  }
) {
  if (!isSpeechSynthesisSupported()) {
    options?.onEnd?.();
    return;
  }

  stopSpeaking();

  if (!text || text.trim().length === 0) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.lang = 'en-US';

  // Attempt to select a natural English voice if loaded
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
  );
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
