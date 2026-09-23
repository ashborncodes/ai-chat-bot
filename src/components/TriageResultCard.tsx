import React, { useState } from 'react';
import { 
  TriageResult, 
  FirstAidStep 
} from '../types/triage';
import { TriageTagBadge } from './TriageTagBadge';
import { 
  Volume2, 
  Square, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Copy, 
  Check, 
  FileText, 
  ShieldAlert, 
  PlusCircle, 
  Activity, 
  HelpCircle,
  Zap,
  PhoneCall
} from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';
import { playStepCompleteSound } from '../utils/sound';

interface TriageResultCardProps {
  triage: TriageResult;
  onSaveToMCI?: (triage: TriageResult) => void;
  isSavedInMCI?: boolean;
}

export const TriageResultCard: React.FC<TriageResultCardProps> = ({
  triage,
  onSaveToMCI,
  isSavedInMCI = false,
}) => {
  const [steps, setSteps] = useState<FirstAidStep[]>(triage.immediateFirstAidSteps);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedMist, setCopiedMist] = useState(false);
  const [showMistDetail, setShowMistDetail] = useState(false);

  const toggleStep = (stepNumber: number) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.stepNumber === stepNumber) {
          const nextState = !step.completed;
          if (nextState) {
            playStepCompleteSound();
          }
          return { ...step, completed: nextState };
        }
        return step;
      })
    );
  };

  const handleAudioPlayback = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(triage.responderAudioScript || triage.primaryAction, {
        rate: 0.95,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
      });
    }
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleCopyMist = () => {
    const mistText = `*** FIRST RESPONDER MIST HANDOVER REPORT ***
TAG: ${triage.tag} (${triage.tagLabel})
MECHANISM: ${triage.mistReport.mechanism}
INJURIES: ${triage.mistReport.injuries}
SIGNS/VITALS: ${triage.mistReport.signs}
TREATMENTS GIVEN: ${triage.mistReport.treatment}
STEPS COMPLETED: ${completedCount}/${steps.length}`;

    navigator.clipboard.writeText(mistText);
    setCopiedMist(true);
    setTimeout(() => setCopiedMist(false), 2500);
  };

  const tagBorderColors = {
    RED: 'border-red-600/80 shadow-red-950/50',
    YELLOW: 'border-amber-600/80 shadow-amber-950/50',
    GREEN: 'border-emerald-600/80 shadow-emerald-950/50',
    BLACK: 'border-slate-700 shadow-slate-950/50',
  };

  return (
    <div
      className={`rounded-2xl border-2 bg-slate-900/95 overflow-hidden shadow-2xl transition-all ${
        tagBorderColors[triage.tag] || 'border-slate-800'
      }`}
    >
      {/* Top Banner: Urgency Tag & Audio Read-Aloud */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <TriageTagBadge tag={triage.tag} size="lg" />
          <div className="text-xs font-mono text-slate-400">
            <span className="text-slate-200 font-semibold">{triage.category}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Read-Aloud Button */}
          <button
            onClick={handleAudioPlayback}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition ${
              isPlayingAudio
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-blue-900/60'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span>Read Audio Guide</span>
              </>
            )}
          </button>

          {/* Add to Multi-Patient Board */}
          {onSaveToMCI && (
            <button
              onClick={() => onSaveToMCI(triage)}
              disabled={isSavedInMCI}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition ${
                isSavedInMCI
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 cursor-default'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {isSavedInMCI ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On Scene Board</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Log Patient</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Urgent Primary Action Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-red-950/90 via-slate-900 to-red-950/60 border border-red-800/80 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-red-600/30 text-red-400 border border-red-500/50 mt-0.5">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-red-400">
                  PRIMARY LIFESAVING DIRECTIVE
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 leading-snug">
                  {triage.primaryAction}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-200">Triage Rationale: </span>
                  {triage.urgencyRationale}
                </p>
              </div>
            </div>

            {(triage.tag === 'RED' || triage.tag === 'YELLOW') && (
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-red-950 border border-red-400 transition transform active:scale-95 text-xs sm:text-sm flex-shrink-0"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>DIAL 112 NOW</span>
              </a>
            )}
          </div>
        </div>

        {/* Critical Medical History Alerts (Allergies / Chronic Conditions) */}
        {triage.medicalAlerts && triage.medicalAlerts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/60 shadow-md animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400">
                    MEDICAL HISTORY & ALLERGY FLAGS
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50 text-[9px] font-mono font-bold">
                    {triage.medicalAlerts.length} ACTIVE
                  </span>
                </div>
                <ul className="space-y-1 mt-1">
                  {triage.medicalAlerts.map((alert, idx) => (
                    <li key={idx} className="text-xs text-amber-200/90 font-medium leading-relaxed flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Interactive Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white tracking-wide">
                First-Aid Action Protocol (In Order of Priority)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {completedCount} / {steps.length} Steps Done ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-1.5 mb-3 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                triage.tag === 'RED' ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2.5">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                onClick={() => toggleStep(step.stepNumber)}
                className={`cursor-pointer rounded-xl border p-3 sm:p-3.5 transition flex items-start gap-3 select-none ${
                  step.completed
                    ? 'bg-slate-950/70 border-emerald-900/60 opacity-80'
                    : step.isCritical
                    ? 'bg-slate-900 border-red-900/60 hover:border-red-600'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition flex-shrink-0"
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Step {step.stepNumber}:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        step.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.isCritical && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      step.completed ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {step.instruction}
                  </p>

                  {step.warning && (
                    <div className="mt-2 text-xs font-medium text-amber-300/90 flex items-center gap-1.5 bg-amber-950/40 border border-amber-900/50 rounded-md p-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{step.warning}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical DO NOTs */}
        {triage.criticalDoNots && triage.criticalDoNots.length > 0 && (
          <div className="rounded-xl border border-rose-900/80 bg-rose-950/30 p-3.5">
            <h5 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              CRITICAL CONTRAINDICATIONS & DO NOTs
            </h5>
            <ul className="space-y-1.5 text-xs text-rose-200/90">
              {triage.criticalDoNots.map((dont, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{dont}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vital Signs to Monitor Grid */}
        {triage.vitalsToCheck && triage.vitalsToCheck.length > 0 && (
          <div>
            <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              IMMEDIATE VITALS TO ASSESS & REPORT
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {triage.vitalsToCheck.map((vital, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs"
                >
                  <span className="font-bold text-slate-200 block">{vital.parameter}</span>
                  <span className="font-mono text-[11px] text-emerald-400 block mt-0.5">
                    Target: {vital.target}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">{vital.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Assessment Questions */}
        {triage.criticalQuestions && triage.criticalQuestions.length > 0 && (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
            <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              VERIFY WITH PATIENT / SCENE NOW
            </h5>
            <ul className="space-y-1 text-xs text-slate-300">
              {triage.criticalQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">Q{idx + 1}:</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* MIST Paramedic Handover Report Section */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  MIST Paramedic Handover Brief
                </span>
                <span className="text-[10px] text-slate-400">
                  Standard EMS handover (Mechanism, Injuries, Signs, Treatment)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMistDetail(!showMistDetail)}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
              >
                {showMistDetail ? 'Collapse' : 'View'}
              </button>

              <button
                onClick={handleCopyMist}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              >
                {copiedMist ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy MIST</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showMistDetail && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <strong className="text-blue-400 block">[M] Mechanism:</strong>
                  <span>{triage.mistReport.mechanism}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <strong className="text-rose-400 block">[I] Injuries Found:</strong>
                  <span>{triage.mistReport.injuries}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <strong className="text-amber-400 block">[S] Signs & Vitals:</strong>
                  <span>{triage.mistReport.signs}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <strong className="text-emerald-400 block">[T] Treatment Given:</strong>
                  <span>{triage.mistReport.treatment}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
