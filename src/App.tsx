/**
 * RescueTriage AI - Apple Ultra-Minimalist Emergency Triage Application
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  TriageResultCard 
} from './components/TriageResultCard';
import { 
  QuickScenarios 
} from './components/QuickScenarios';
import { 
  EmergencyTimers 
} from './components/EmergencyTimers';
import { 
  MultiPatientBoard 
} from './components/MultiPatientBoard';
import { 
  EmergencyCallModal 
} from './components/EmergencyCallModal';
import { 
  TriageProtocolModal 
} from './components/TriageProtocolModal';
import { 
  ChatMessage, 
  TriageResult, 
  PatientContext, 
  MCIPatient 
} from './types/triage';
import { 
  Mic, 
  MicOff, 
  Send, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Pill, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp,
  Languages,
  Clock,
  Sparkles,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { 
  createSpeechRecognition,
  isSpeechRecognitionSupported, 
  speakText, 
  stopSpeaking
} from './utils/speech';
import { 
  triggerTriageVibration, 
  triggerVoiceStartVibration, 
  triggerVoiceStopVibration 
} from './utils/haptics';
import { 
  cacheCoreProtocols, 
  evaluateOfflineTriage 
} from './utils/offlineTriage';
import { 
  saveSessionState, 
  loadSessionState, 
  clearSessionState 
} from './utils/sessionStorage';

const PRESET_MEDICAL_HISTORY = [
  { id: 'penicillin', label: 'Penicillin Allergy', tag: 'Penicillin Allergy' },
  { id: 'latex', label: 'Latex Allergy', tag: 'Latex Allergy' },
  { id: 'thinners', label: 'Blood Thinners', tag: 'Blood Thinners' },
  { id: 'asthma', label: 'Asthma / COPD', tag: 'Asthma / COPD' },
  { id: 'diabetes', label: 'Diabetes', tag: 'Diabetes / Insulin' },
  { id: 'cardiac', label: 'Heart Disease', tag: 'Cardiac / Heart Disease' },
  { id: 'seizures', label: 'Seizures', tag: 'Seizures / Epilepsy' },
  { id: 'hypertension', label: 'Hypertension', tag: 'Hypertension (High BP)' },
];

const SUGGESTED_PROMPTS: Array<{ text: string; ctx: Partial<PatientContext> }> = [
  { text: 'Bike crash with deep leg cut, bleeding heavily through cloth', ctx: { ageGroup: 'Adult', conscious: true, breathing: true, severeBleeding: true, walking: false } },
  { text: 'Person bitten on ankle by unknown snake, fang marks & rapid swelling', ctx: { ageGroup: 'Adult', conscious: true, breathing: true, severeBleeding: false, walking: false } },
  { text: 'Sudden collapse, unresponsive, not breathing normally', ctx: { ageGroup: 'Elderly', conscious: false, breathing: false, severeBleeding: false, walking: false } },
  { text: 'Fell down stairs, wrist visibly deformed with severe pain', ctx: { ageGroup: 'Adult', conscious: true, breathing: true, severeBleeding: false, walking: false } },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [activeView, setActiveView] = useState<'triage' | 'mci'>('triage');

  // Modals
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

  // Collapsible Top Tools (Keeps screen pristine by default)
  const [showTimers, setShowTimers] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Quick Vitals (Apple Health / Medical ID context)
  const [patientContext, setPatientContext] = useState<PatientContext>({
    ageGroup: 'Adult',
    conscious: true,
    breathing: true,
    severeBleeding: false,
    walking: false,
    medicalHistory: [],
  });

  // Medical History UI state
  const [customHistoryInput, setCustomHistoryInput] = useState('');
  const [showMedicalHistoryPanel, setShowMedicalHistoryPanel] = useState(false);

  // MCI Scene Board
  const [mciPatients, setMciPatients] = useState<MCIPatient[]>([]);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  // Voice Recognition (Previous Version Architecture with word repetition fix)
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition (Previous Version Architecture)
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      recognitionRef.current = createSpeechRecognition({
        onStart: () => {
          setIsListening(true);
          setVoiceError(null);
        },
        onResult: (transcript: string) => {
          const base = baseTextRef.current;
          setInputText(base ? `${base} ${transcript}` : transcript);
        },
        onError: (err: string) => {
          setIsListening(false);
          setVoiceError(err);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Restore session from LocalStorage
  useEffect(() => {
    cacheCoreProtocols();
    const saved = loadSessionState();
    if (saved && saved.messages && saved.messages.length > 0) {
      setMessages(saved.messages);
      if (saved.patientContext) {
        setPatientContext({
          medicalHistory: [],
          ...saved.patientContext,
        });
      }
      if (saved.mciPatients) setMciPatients(saved.mciPatients);
      setHasRestoredSession(true);
    }
  }, []);

  // Persist session to LocalStorage
  useEffect(() => {
    if (messages.length > 0 || mciPatients.length > 0) {
      saveSessionState(messages, patientContext, mciPatients);
    }
  }, [messages, patientContext, mciPatients]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle toggling voice recording (Previous Version Pattern)
  const toggleVoiceRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Speech recognition is not supported in this browser. Please type symptoms.');
      return;
    }

    if (isListening) {
      triggerVoiceStopVibration();
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      triggerVoiceStartVibration();
      setVoiceError(null);
      baseTextRef.current = inputText.trim();
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleToggleHistoryItem = (tag: string) => {
    setPatientContext((prev) => {
      const current = prev.medicalHistory || [];
      const exists = current.includes(tag);
      return {
        ...prev,
        medicalHistory: exists ? current.filter((t) => t !== tag) : [...current, tag],
      };
    });
  };

  const handleAddCustomHistory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customHistoryInput.trim();
    if (!clean) return;
    setPatientContext((prev) => {
      const current = prev.medicalHistory || [];
      if (current.some((c) => c.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        medicalHistory: [...current, clean],
      };
    });
    setCustomHistoryInput('');
  };

  const handleRemoveHistoryItem = (tagToRemove: string) => {
    setPatientContext((prev) => ({
      ...prev,
      medicalHistory: (prev.medicalHistory || []).filter((t) => t !== tagToRemove),
    }));
  };

  const handleSendMessage = async (textToSend?: string, contextOverride?: PatientContext) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const currentContext = contextOverride || patientContext;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    }
    stopSpeaking();

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientContext: { ...currentContext },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    baseTextRef.current = '';
    setIsLoading(true);

    let triageResult: TriageResult;
    let triageSource: string = 'gemini-3.8-flash';

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        triageResult = evaluateOfflineTriage(text, currentContext);
        triageSource = 'rule_fallback';
      } else {
        const historyPayload = messages.slice(-4).map((m) => ({
          role: m.role,
          text: m.triageResult ? `${m.triageResult.tag}: ${m.triageResult.summary}` : m.text,
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            history: historyPayload,
            patientContext: currentContext,
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error('API triage response unsuccessful');
        }

        const data = await res.json();
        triageResult = data.result;
        triageSource = data.source || 'gemini-3.8-flash';
      }
    } catch (err: any) {
      console.warn('Network / API error encountered, activating offline local triage engine:', err);
      triageResult = evaluateOfflineTriage(text, currentContext);
      triageSource = 'rule_fallback';
    } finally {
      setIsLoading(false);
    }

    triggerTriageVibration(triageResult.tag);

    const aiMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'model',
      text: triageResult.summary,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triageResult,
      source: triageSource,
    };

    setMessages((prev) => [...prev, aiMessage]);

    if (autoSpeak) {
      const textToSpeak =
        triageResult.responderAudioScript || `${triageResult.tagLabel}. ${triageResult.primaryAction}`;
      speakText(textToSpeak, { rate: 0.98 });
    }
  };

  const handleSaveToMCI = (triage: TriageResult) => {
    const nextNumber = mciPatients.length + 1;
    const newPatient: MCIPatient = {
      id: `mci_${Date.now()}`,
      tagNumber: nextNumber,
      identifier: `Casualty #${nextNumber} (${triage.category})`,
      tag: triage.tag,
      summary: triage.summary,
      primaryAction: triage.primaryAction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepsCompleted: 0,
      totalSteps: triage.immediateFirstAidSteps.length,
      fullTriage: triage,
    };

    setMciPatients((prev) => [newPatient, ...prev]);
  };

  const handleSelectMciPatient = (patient: MCIPatient) => {
    setActiveView('triage');
    const existingMsg = messages.find((m) => m.triageResult?.summary === patient.fullTriage.summary);
    if (!existingMsg) {
      setMessages((prev) => [
        ...prev,
        {
          id: `mci_focus_${Date.now()}`,
          role: 'model',
          text: `[Recalled ${patient.identifier}] ${patient.fullTriage.summary}`,
          timestamp: patient.timestamp,
          triageResult: patient.fullTriage,
        },
      ]);
    }
  };

  const handleDeleteMciPatient = (id: string) => {
    setMciPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetIncident = () => {
    if (confirm('Clear current triage conversation?')) {
      stopSpeaking();
      if (isListening) {
        try {
          recognitionRef.current?.stop();
        } catch (e) {}
        setIsListening(false);
      }
      setMessages([]);
      setInputText('');
      baseTextRef.current = '';
      setPatientContext({
        ageGroup: 'Adult',
        conscious: true,
        breathing: true,
        severeBleeding: false,
        walking: false,
        medicalHistory: [],
      });
      setCustomHistoryInput('');
      setShowMedicalHistoryPanel(false);
      clearSessionState();
      setHasRestoredSession(false);
    }
  };

  const latestTriage = [...messages]
    .reverse()
    .find((m) => m.role === 'model' && m.triageResult)?.triageResult;

  const hasActiveVitals = 
    !patientContext.conscious || 
    !patientContext.breathing || 
    patientContext.severeBleeding || 
    patientContext.walking || 
    (patientContext.medicalHistory && patientContext.medicalHistory.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Apple Minimalist Navigation */}
      <Header
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onOpenCallModal={() => setIsCallModalOpen(true)}
        onOpenProtocolModal={() => setIsProtocolModalOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        patientCount={mciPatients.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-3 sm:p-5 flex flex-col">
        {/* MCI Scene Board View */}
        {activeView === 'mci' ? (
          <MultiPatientBoard
            patients={mciPatients}
            onSelectPatient={handleSelectMciPatient}
            onDeletePatient={handleDeleteMciPatient}
            onClearAll={() => {
              if (confirm('Clear all casualties from scene board?')) setMciPatients([]);
            }}
          />
        ) : (
          /* Active Triage Feed */
          <div className="flex-1 flex flex-col h-full">
            {/* Minimalist Collapsible Tool Bar */}
            <div className="flex items-center justify-between py-1.5 mb-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTimers(!showTimers);
                    if (showPresets) setShowPresets(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showTimers
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-white/[0.03]'
                  }`}
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Metronome & Timers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPresets(!showPresets);
                    if (showTimers) setShowTimers(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showPresets
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-white/[0.03]'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Presets</span>
                </button>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleResetIncident}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Optional Collapsed Panels */}
            {showTimers && (
              <div className="mb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <EmergencyTimers initialActiveTimer={latestTriage?.recommendedTimerType || 'none'} />
              </div>
            )}

            {showPresets && (
              <div className="mb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <QuickScenarios
                  isLoading={isLoading}
                  onSelectScenario={(prompt, ctx) => {
                    setPatientContext(ctx);
                    handleSendMessage(prompt, ctx);
                    setShowPresets(false);
                  }}
                />
              </div>
            )}

            {/* Chat Stream Area */}
            <div className="flex-1 flex flex-col justify-between min-h-[380px]">
              <div className="space-y-4 overflow-y-auto pr-0.5 pb-3">
                {messages.length === 0 ? (
                  /* Ultra-Minimal Apple Empty State */
                  <div className="h-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-3">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h2 className="text-base font-medium text-white tracking-tight">RescueTriage</h2>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Describe emergency symptoms or speak hands-free.
                    </p>

                    {/* Minimalist Suggested Queries */}
                    <div className="mt-6 flex flex-col w-full max-w-md gap-1.5 text-left">
                      {SUGGESTED_PROMPTS.map((item, idx) => (
                        <button
                          key={idx}
                          disabled={isLoading}
                          onClick={() => {
                            setPatientContext((prev) => ({ ...prev, ...item.ctx }));
                            handleSendMessage(item.text, { ...patientContext, ...item.ctx });
                          }}
                          className="px-3.5 py-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-xs text-slate-300 hover:text-white transition-all text-left truncate"
                        >
                          <span className="text-slate-500 mr-2">·</span>
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      {msg.role === 'user' ? (
                        /* Apple iMessage clean bubble */
                        <div className="flex flex-col items-end">
                          <div className="max-w-md bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
                            <p>{msg.text}</p>
                            {msg.patientContext && (
                              <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-white/20 text-[10px] text-blue-100">
                                <span>[{msg.patientContext.ageGroup}]</span>
                                {msg.patientContext.conscious === false && <span>· Unresponsive</span>}
                                {msg.patientContext.breathing === false && <span>· No Breathing</span>}
                                {msg.patientContext.severeBleeding && <span>· Heavy Bleed</span>}
                                {msg.patientContext.medicalHistory && msg.patientContext.medicalHistory.length > 0 && (
                                  <span>· Hx: {msg.patientContext.medicalHistory.join(', ')}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 mr-1">
                            {msg.timestamp}
                          </span>
                        </div>
                      ) : (
                        /* AI Triage Card */
                        <div className="space-y-1">
                          {msg.triageResult ? (
                            <TriageResultCard
                              triage={msg.triageResult}
                              onSaveToMCI={handleSaveToMCI}
                              isSavedInMCI={mciPatients.some(
                                (p) => p.fullTriage.summary === msg.triageResult?.summary
                              )}
                            />
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-200">
                              {msg.text}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-sans">
                            <span>
                              {msg.source === 'rule_fallback' || msg.source === 'offline_local_cache'
                                ? 'Offline Engine · START/SALT'
                                : 'Gemini Clinical Triage'}
                            </span>
                            <span className="font-mono text-[10px]">{msg.timestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Loading state */}
                {isLoading && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                    <Activity className="w-4 h-4 animate-spin text-red-400" />
                    <span className="text-xs text-slate-300">Evaluating triage classification...</span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Dock: Ultra-Minimal Vitals & Floating Dictation Bar */}
              <div className="pt-2 sticky bottom-2 z-20">
                {/* Minimal Single-Line Vitals Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 px-1 text-[11px]">
                  <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.05]">
                    {(['Adult', 'Child', 'Infant', 'Elderly'] as const).map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setPatientContext({ ...patientContext, ageGroup: group })}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          patientContext.ageGroup === group
                            ? 'bg-white/20 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Conscious toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setPatientContext({ ...patientContext, conscious: !patientContext.conscious })
                      }
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        patientContext.conscious === false
                          ? 'bg-red-500/20 text-red-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {patientContext.conscious === false ? 'Unconscious' : 'Conscious'}
                    </button>

                    {/* Breathing toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setPatientContext({ ...patientContext, breathing: !patientContext.breathing })
                      }
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        patientContext.breathing === false
                          ? 'bg-red-500/20 text-red-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {patientContext.breathing === false ? 'No Breath' : 'Breathing'}
                    </button>

                    {/* Bleeding toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setPatientContext({
                          ...patientContext,
                          severeBleeding: !patientContext.severeBleeding,
                        })
                      }
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        patientContext.severeBleeding
                          ? 'bg-rose-500/20 text-rose-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {patientContext.severeBleeding ? 'Bleed 🩸' : 'Bleed'}
                    </button>

                    {/* Medical Hx toggle button */}
                    <button
                      type="button"
                      onClick={() => setShowMedicalHistoryPanel(!showMedicalHistoryPanel)}
                      className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                        (patientContext.medicalHistory?.length || 0) > 0
                          ? 'bg-amber-500/20 text-amber-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Pill className="w-3 h-3 text-amber-400" />
                      <span>
                        {(patientContext.medicalHistory?.length || 0) > 0
                          ? `Hx (${patientContext.medicalHistory!.length})`
                          : '+ Hx'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Minimalist Medical History Drawer */}
                {showMedicalHistoryPanel && (
                  <div className="p-3 mb-2 rounded-2xl bg-slate-900/90 border border-white/[0.08] backdrop-blur-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-medium">Allergies & Chronic Conditions</span>
                      {(patientContext.medicalHistory?.length || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setPatientContext((prev) => ({ ...prev, medicalHistory: [] }))}
                          className="text-slate-400 hover:text-rose-400 text-[11px]"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {PRESET_MEDICAL_HISTORY.map((item) => {
                        const isActive = (patientContext.medicalHistory || []).includes(item.tag);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleHistoryItem(item.tag)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] transition-all ${
                              isActive
                                ? 'bg-amber-500/20 text-amber-300 font-medium'
                                : 'bg-white/[0.04] text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="text"
                        value={customHistoryInput}
                        onChange={(e) => setCustomHistoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomHistory(e);
                          }
                        }}
                        placeholder="Add allergy or condition..."
                        className="flex-1 bg-white/[0.04] border border-white/[0.06] text-slate-200 text-xs rounded-xl px-2.5 py-1.5 placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomHistory}
                        disabled={!customHistoryInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.16] text-white text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Status Error Notice */}
                {voiceError && (
                  <div className="text-xs text-rose-300 mb-1 flex items-center justify-between bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">
                    <span>{voiceError}</span>
                    <button onClick={() => setVoiceError(null)} className="text-slate-400 hover:text-white text-[11px]">
                      ✕
                    </button>
                  </div>
                )}

                {/* Voice Listening Banner */}
                {isListening && (
                  <div className="mb-2 p-2.5 rounded-2xl bg-red-950/60 border border-red-500/40 backdrop-blur-2xl flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-red-200 font-medium">Listening hands-free:</span>
                      <span className="text-slate-300 truncate max-w-xs sm:max-w-md">
                        {inputText || 'Speak symptoms now...'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-medium transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* Floating Rounded-Full Dictation Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="h-12 bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl rounded-full px-2 flex items-center gap-1.5 shadow-2xl transition-all focus-within:border-white/[0.16]"
                >
                  {/* Mic Dictation Trigger */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    title={isListening ? 'Stop recording' : 'Voice dictation'}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? 'bg-red-600 text-white shadow-md shadow-red-950'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      baseTextRef.current = e.target.value;
                    }}
                    placeholder={isListening ? 'Listening...' : 'Message or injuries...'}
                    className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none px-2"
                  />

                  {/* Send Arrow Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="h-8 w-8 rounded-full bg-white hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-white text-black flex items-center justify-center transition-all active:scale-95"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Emergency Call Modal */}
      <EmergencyCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        latestTriage={latestTriage}
      />

      {/* Triage Protocol Guidelines Modal */}
      <TriageProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
      />
    </div>
  );
}
