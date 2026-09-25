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

export function createSpeechRecognition(handlers: SpeechRecognitionHandlers, lang: string = 'en-IN') {
  if (!isSpeechRecognitionSupported()) {
    handlers.onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onstart = () => {
    handlers.onStart();
  };

  // Fixed onresult: Reconstructs full session transcript to prevent repeated/duplicated words
  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < event.results.length; ++i) {
      const text = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + text.trim();
      } else {
        interimTranscript += (interimTranscript ? ' ' : '') + text.trim();
      }
    }

    const combined = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    if (combined) {
      handlers.onResult(combined, Boolean(finalTranscript));
    }
  };

  recognition.onerror = (event: any) => {
    const err = event.error;
    // 'no-speech' and 'aborted' are normal lifecycle events; don't report as errors
    if (err === 'no-speech' || err === 'aborted') {
      return;
    }
    console.warn('Speech recognition error:', err);
    if (err === 'not-allowed') {
      handlers.onError('Microphone access blocked. Please allow microphone permission in your browser address bar.');
    } else if (err === 'audio-capture') {
      handlers.onError('No microphone found or input device is muted.');
    } else {
      handlers.onError(`Voice error: ${err}`);
    }
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
    lang?: string;
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
  utterance.lang = options?.lang ?? 'en-US';

  // Attempt to select a natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel') ||
        v.name.includes('Siri')) &&
      v.lang.startsWith(options?.lang?.slice(0, 2) || 'en')
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
