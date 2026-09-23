/**
 * LocalStorage Session Persistence for RescueTriage AI
 * Keeps messages, triage state, and MCI rosters intact even when the app is refreshed, closed, or offline.
 */

import { ChatMessage, PatientContext, MCIPatient } from '../types/triage';

const STORAGE_KEY_MESSAGES = 'rescuetriage_session_messages_v1';
const STORAGE_KEY_CONTEXT = 'rescuetriage_session_context_v1';
const STORAGE_KEY_MCI = 'rescuetriage_session_mci_v1';
const STORAGE_KEY_TIMESTAMP = 'rescuetriage_last_active_v1';

export interface SavedSessionState {
  messages: ChatMessage[];
  patientContext: PatientContext;
  mciPatients: MCIPatient[];
  lastSaved: string;
}

export function saveSessionState(
  messages: ChatMessage[],
  patientContext: PatientContext,
  mciPatients: MCIPatient[]
): void {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    localStorage.setItem(STORAGE_KEY_CONTEXT, JSON.stringify(patientContext));
    localStorage.setItem(STORAGE_KEY_MCI, JSON.stringify(mciPatients));
    localStorage.setItem(STORAGE_KEY_TIMESTAMP, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to save session state to LocalStorage:', err);
  }
}

export function loadSessionState(): SavedSessionState | null {
  try {
    const rawMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const rawContext = localStorage.getItem(STORAGE_KEY_CONTEXT);
    const rawMci = localStorage.getItem(STORAGE_KEY_MCI);
    const rawTime = localStorage.getItem(STORAGE_KEY_TIMESTAMP);

    if (!rawMessages && !rawMci) {
      return null;
    }

    return {
      messages: rawMessages ? JSON.parse(rawMessages) : [],
      patientContext: rawContext
        ? {
            medicalHistory: [],
            ...JSON.parse(rawContext),
          }
        : {
            ageGroup: 'Adult',
            conscious: true,
            breathing: true,
            severeBleeding: false,
            walking: false,
            medicalHistory: [],
          },
      mciPatients: rawMci ? JSON.parse(rawMci) : [],
      lastSaved: rawTime || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Failed to restore session state from LocalStorage:', err);
    return null;
  }
}

export function clearSessionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_CONTEXT);
    localStorage.removeItem(STORAGE_KEY_MCI);
    localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
  } catch (err) {
    console.warn('Failed to clear session state:', err);
  }
}
