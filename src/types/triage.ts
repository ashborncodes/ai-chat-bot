export type TriageTag = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

export interface FirstAidStep {
  stepNumber: number;
  title: string;
  instruction: string;
  warning?: string;
  isCritical: boolean;
  completed?: boolean;
}

export interface VitalCheck {
  parameter: string;
  target: string;
  note: string;
}

export interface MistReport {
  mechanism: string;
  injuries: string;
  signs: string;
  treatment: string;
}

export interface TriageResult {
  tag: TriageTag;
  tagLabel: string;
  category: string;
  summary: string;
  urgencyRationale: string;
  primaryAction: string;
  immediateFirstAidSteps: FirstAidStep[];
  criticalDoNots: string[];
  criticalQuestions: string[];
  vitalsToCheck: VitalCheck[];
  responderAudioScript: string;
  mistReport: MistReport;
  recommendedTimerType?: 'cpr' | 'bleeding_pressure' | 'tourniquet' | 'reassess' | 'none';
  medicalAlerts?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  triageResult?: TriageResult;
  source?: string;
  patientContext?: PatientContext;
}

export interface PatientContext {
  ageGroup?: 'Adult' | 'Child' | 'Infant' | 'Elderly';
  conscious?: boolean;
  breathing?: boolean;
  severeBleeding?: boolean;
  walking?: boolean;
  location?: string;
  medicalHistory?: string[]; // allergies, chronic conditions (e.g. Asthma, Penicillin Allergy, Blood Thinners, Diabetes)
}

export interface MCIPatient {
  id: string;
  tagNumber: number;
  identifier: string; // e.g. "Victim #1 - Front Passenger"
  tag: TriageTag;
  summary: string;
  primaryAction: string;
  timestamp: string;
  stepsCompleted: number;
  totalSteps: number;
  tourniquetTime?: string;
  fullTriage: TriageResult;
}
