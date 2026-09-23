/**
 * RescueTriage AI - First Responder Emergency Triage Application
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
  Sparkles, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  Check, 
  Flame, 
  MessageSquare,
  ShieldCheck,
  Info
} from 'lucide-react';
import { 
  createSpeechRecognition, 
  isSpeechRecognitionSupported, 
  speakText, 
  stopSpeaking 
} from './utils/speech';
import { 
  cacheCoreProtocols, 
  evaluateOfflineTriage 
} from './utils/offlineTriage';
import { 
  saveSessionState, 
  loadSessionState, 
  clearSessionState 
} from './utils/sessionStorage';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [activeView, setActiveView] = useState<'triage' | 'mci'>('triage');

  // Modals
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

  // Quick Vitals Flags
  const [patientContext, setPatientContext] = useState<PatientContext>({
    ageGroup: 'Adult',
    conscious: true,
    breathing: true,
    severeBleeding: false,
    walking: false,
  });

  // MCI Scene Board
  const [mciPatients, setMciPatients] = useState<MCIPatient[]>([]);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  // Restore session from LocalStorage & cache protocols on initial mount
  useEffect(() => {
    cacheCoreProtocols();
    const saved = loadSessionState();
    if (saved && saved.messages && saved.messages.length > 0) {
      setMessages(saved.messages);
      if (saved.patientContext) setPatientContext(saved.patientContext);
      if (saved.mciPatients) setMciPatients(saved.mciPatients);
      setHasRestoredSession(true);
    }
  }, []);

  // Persist session to LocalStorage whenever state updates
  useEffect(() => {
    if (messages.length > 0 || mciPatients.length > 0) {
      saveSessionState(messages, patientContext, mciPatients);
    }
  }, [messages, patientContext, mciPatients]);

  // Voice Recognition
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat container
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Latest triage assessment
  const latestTriage = [...messages]
    .reverse()
    .find((m) => m.role === 'model' && m.triageResult)?.triageResult;

  // Initialize Speech Recognition
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      recognitionRef.current = createSpeechRecognition({
        onStart: () => {
          setIsListening(true);
          setVoiceError(null);
        },
        onResult: (transcript: string) => {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        onError: (err: string) => {
          setIsListening(false);
          if (err !== 'no-speech') {
            setVoiceError(`Voice error: ${err}`);
          }
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleVoiceRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Speech recognition is not supported in this browser. Please type symptoms.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setVoiceError(null);
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string, contextOverride?: PatientContext) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const currentContext = contextOverride || patientContext;

    // Stop active listening and speech
    if (isListening) {
      recognitionRef.current?.stop();
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
    setIsLoading(true);

    let triageResult: TriageResult;
    let triageSource: string = 'gemini-3.8-flash';

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Device is completely offline in remote area - execute local engine
        triageResult = evaluateOfflineTriage(text, currentContext);
        triageSource = 'rule_fallback';
      } else {
        // Online: try server API
        const historyPayload = messages.slice(-4).map((m) => ({
          role: m.role,
          text: m.triageResult ? `${m.triageResult.tag}: ${m.triageResult.summary}` : m.text,
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout for spotty networks

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
      // Seamless offline fallback: evaluate using client-side clinical rules
      triageResult = evaluateOfflineTriage(text, currentContext);
      triageSource = 'rule_fallback';
    } finally {
      setIsLoading(false);
    }

    const aiMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'model',
      text: triageResult.summary,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triageResult,
      source: triageSource,
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Automatically speak primary guidance if auto-speak enabled
    if (autoSpeak) {
      const textToSpeak =
        triageResult.responderAudioScript || `${triageResult.tagLabel}. ${triageResult.primaryAction}`;
      speakText(textToSpeak, { rate: 0.95 });
    }
  };

  const handleSaveToMCI = (triage: TriageResult) => {
    const nextNumber = mciPatients.length + 1;
    const newPatient: MCIPatient = {
      id: `mci_${Date.now()}`,
      tagNumber: nextNumber,
      identifier: `Victim #${nextNumber} (${triage.category})`,
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
    // Prepend or focus triage
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
    if (confirm('Clear current triage chat and start a fresh incident session?')) {
      stopSpeaking();
      setMessages([]);
      setInputText('');
      setPatientContext({
        ageGroup: 'Adult',
        conscious: true,
        breathing: true,
        severeBleeding: false,
        walking: false,
      });
      clearSessionState();
      setHasRestoredSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Tactical Header */}
      <Header
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onOpenCallModal={() => setIsCallModalOpen(true)}
        onOpenProtocolModal={() => setIsProtocolModalOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        patientCount={mciPatients.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
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
          /* Active Triage Chat & Guidance View */
          <div className="flex-1 flex flex-col gap-4">
            {/* Top Quick Tools: CPR & Bleeding Timers */}
            <EmergencyTimers
              initialActiveTimer={latestTriage?.recommendedTimerType || 'none'}
              onTourniquetLogged={(time) => {
                // If there's an ongoing chat, user can easily copy
              }}
            />

            {/* Quick 1-Tap Scenarios */}
            <QuickScenarios
              isLoading={isLoading}
              onSelectScenario={(prompt, ctx) => {
                setPatientContext(ctx);
                handleSendMessage(prompt, ctx);
              }}
            />

            {/* Conversation / Guidance Stream */}
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col min-h-[420px]">
              {/* Incident Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    LIVE FIELD TRIAGE FEED
                  </span>
                  {messages.length > 0 && (
                    <span className="text-[11px] text-slate-300 font-mono">
                      ({messages.length} messages)
                    </span>
                  )}
                </div>

                {messages.length > 0 && (
                  <button
                    onClick={handleResetIncident}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Incident</span>
                  </button>
                )}
              </div>

              {/* Restored Session Notification */}
              {hasRestoredSession && messages.length > 0 && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Restored previous incident session ({messages.length} messages) from local device cache.</span>
                  </div>
                  <button
                    onClick={() => setHasRestoredSession(false)}
                    className="text-slate-400 hover:text-white text-[11px] underline ml-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Chat Message List */}
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-12 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-950/40">
                      <Flame className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Emergency Triage Ready</h3>
                    <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                      Describe the victim&apos;s symptoms, breathing, bleeding, and consciousness in plain speech or text (or tap any scenario above).
                    </p>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg text-left text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <strong className="text-red-400 block mb-0.5">1. Speak or Type</strong>
                        <span className="text-slate-300">&quot;Heavy leg bleed from cut, dizzy&quot;</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <strong className="text-amber-400 block mb-0.5">2. Color Tagging</strong>
                        <span className="text-slate-300">Classified into Red / Yellow / Green</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <strong className="text-emerald-400 block mb-0.5">3. First Aid Steps</strong>
                        <span className="text-slate-300">Direct pressure, tourniquet & CPR</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {msg.role === 'user' ? (
                        /* User Message */
                        <div className="flex flex-col items-end">
                          <div className="max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl rounded-tr-none px-4 py-3 shadow">
                            <p className="text-sm text-slate-100 font-medium leading-relaxed">
                              {msg.text}
                            </p>

                            {/* Attached Vitals Indicators */}
                            {msg.patientContext && (
                              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-700/60 text-[10px] font-mono text-slate-400">
                                <span>[{msg.patientContext.ageGroup}]</span>
                                {msg.patientContext.conscious === false && (
                                  <span className="text-red-400 font-bold bg-red-950/80 px-1 rounded">
                                    UNRESPONSIVE
                                  </span>
                                )}
                                {msg.patientContext.breathing === false && (
                                  <span className="text-red-400 font-bold bg-red-950/80 px-1 rounded">
                                    APNEIC / NOT BREATHING
                                  </span>
                                )}
                                {msg.patientContext.severeBleeding && (
                                  <span className="text-red-400 font-bold bg-red-950/80 px-1 rounded">
                                    HEAVY BLEED
                                  </span>
                                )}
                                {msg.patientContext.walking && (
                                  <span className="text-emerald-400 bg-emerald-950/80 px-1 rounded">
                                    WALKING
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 mr-1">
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
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200">
                              {msg.text}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-2">
                            <span className="flex items-center gap-1.5">
                              {msg.source === 'rule_fallback' || msg.source === 'offline_local_cache' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                  <span className="text-amber-300">Offline Engine (Cached Rules) • START/SALT</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                  <span>Evaluated by Gemini AI • START/SALT</span>
                                </>
                              )}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="p-4 rounded-2xl border border-red-900/60 bg-slate-950/80 flex items-center gap-3 animate-pulse">
                    <div className="p-2 rounded-lg bg-red-600/30 text-red-400">
                      <Activity className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider block">
                        EVALUATING INJURIES & CLASSIFYING TRIAGE TAG...
                      </span>
                      <span className="text-xs text-slate-400">
                        Analyzing airway, breathing rate, perfusion, and emergency interventions
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Quick Vitals Context Buttons (Fast 1-tap patient parameters) */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-xs">
                  <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-red-400" />
                    Quick Vitals:
                  </span>

                  {/* Age Group */}
                  <select
                    value={patientContext.ageGroup}
                    onChange={(e) =>
                      setPatientContext({ ...patientContext, ageGroup: e.target.value as any })
                    }
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Child">Child (1-8 yrs)</option>
                    <option value="Infant">Infant (&lt;1 yr)</option>
                    <option value="Elderly">Elderly (65+)</option>
                  </select>

                  {/* Conscious Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setPatientContext({ ...patientContext, conscious: !patientContext.conscious })
                    }
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs border transition ${
                      patientContext.conscious === false
                        ? 'bg-red-950 text-red-300 border-red-600 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {patientContext.conscious === false ? 'Unconscious ⚠️' : 'Conscious'}
                  </button>

                  {/* Breathing Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setPatientContext({ ...patientContext, breathing: !patientContext.breathing })
                    }
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs border transition ${
                      patientContext.breathing === false
                        ? 'bg-red-950 text-red-300 border-red-600 font-bold animate-pulse'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {patientContext.breathing === false ? 'NOT Breathing 🚨' : 'Breathing'}
                  </button>

                  {/* Severe Bleed Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setPatientContext({
                        ...patientContext,
                        severeBleeding: !patientContext.severeBleeding,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs border transition ${
                      patientContext.severeBleeding
                        ? 'bg-rose-950 text-rose-300 border-rose-600 font-bold animate-pulse'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {patientContext.severeBleeding ? 'Severe Bleeding 🩸' : 'No Heavy Bleed'}
                  </button>

                  {/* Walking Wounded Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setPatientContext({ ...patientContext, walking: !patientContext.walking })
                    }
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs border transition ${
                      patientContext.walking
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {patientContext.walking ? 'Ambulatory / Walking 🚶' : 'Non-Walking'}
                  </button>
                </div>

                {/* Voice Status or Error */}
                {voiceError && (
                  <div className="text-xs text-rose-400 mb-2 flex items-center gap-1.5 bg-rose-950/30 p-1.5 rounded border border-rose-900/60 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                )}

                {/* Live Speech Recognition Listening Bar */}
                {isListening && (
                  <div className="mb-2 p-2 rounded-xl bg-red-950/70 border border-red-600 flex items-center justify-between text-xs text-red-200 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold">Listening hands-free...</span>
                      <span className="text-slate-300 italic truncate max-w-md">
                        {inputText || 'Speak clearly: what injuries do you see?'}
                      </span>
                    </div>
                    <button
                      onClick={toggleVoiceRecording}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[11px] font-mono"
                    >
                      Done Speaking
                    </button>
                  </div>
                )}

                {/* Input Field + Voice + Send Controls */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Large Voice Recording Trigger Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    title={isListening ? 'Stop listening' : 'Speak emergency symptoms (English / Hindi)'}
                    className={`p-3 rounded-xl border flex items-center justify-center transition shadow-lg ${
                      isListening
                        ? 'bg-red-600 text-white border-red-500 animate-bounce'
                        : 'bg-slate-950 hover:bg-slate-800 text-red-400 border-slate-800 hover:border-red-800'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        isListening
                          ? 'Listening... (Speak in English or Hindi / हिन्दी)'
                          : 'Describe injury in English / Hindi (e.g. "Bike accident, heavy leg bleed" or "Saanp ne kaat liya")...'
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none transition shadow-inner font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:hover:from-red-600 disabled:hover:to-rose-600 text-white font-bold transition shadow-lg shadow-red-950/60 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
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

      {/* Triage Protocol Flowchart Modal */}
      <TriageProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
      />
    </div>
  );
}
