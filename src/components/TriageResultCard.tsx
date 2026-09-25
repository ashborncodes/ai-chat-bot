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
import { triggerSOSVibration, triggerStepCompleteVibration } from '../utils/haptics';

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
            triggerStepCompleteVibration();
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
        rate: 0.98,
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
    RED: 'border-red-500/40 shadow-red-950/40',
    YELLOW: 'border-amber-500/40 shadow-amber-950/40',
    GREEN: 'border-emerald-500/40 shadow-emerald-950/40',
    BLACK: 'border-slate-700/60 shadow-slate-950/40',
  };

  return (
    <div
      className={`rounded-2xl border bg-slate-900/60 backdrop-blur-2xl overflow-hidden shadow-2xl transition-all ${
        tagBorderColors[triage.tag] || 'border-white/[0.08]'
      }`}
    >
      {/* Top Banner: Urgency Tag & Audio Read-Aloud */}
      <div className="p-4 sm:p-5 bg-white/[0.02] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <TriageTagBadge tag={triage.tag} size="lg" />
          <div className="text-xs text-slate-400 font-sans">
            <span className="text-slate-300 font-medium">{triage.category}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Read-Aloud Button */}
          <button
            onClick={handleAudioPlayback}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all active:scale-95 ${
              isPlayingAudio
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-950'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-blue-300 border-white/[0.08]'
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
                <span>Speak Protocol</span>
              </>
            )}
          </button>

          {/* Add to Multi-Patient Board */}
          {onSaveToMCI && (
            <button
              onClick={() => onSaveToMCI(triage)}
              disabled={isSavedInMCI}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all active:scale-95 ${
                isSavedInMCI
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 cursor-default'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.08]'
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

      <div className="p-4 sm:p-5 space-y-4">
        {/* Urgent Primary Action Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900/60 to-red-950/40 border border-red-500/30 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-red-400">
                  PRIMARY LIFESAVING DIRECTIVE
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-white mt-0.5 leading-snug">
                  {triage.primaryAction}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="text-slate-400 font-medium">Triage Rationale: </span>
                  {triage.urgencyRationale}
                </p>
              </div>
            </div>

            {(triage.tag === 'RED' || triage.tag === 'YELLOW') && (
              <a
                href="tel:112"
                onClick={triggerSOSVibration}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-red-950/60 border border-red-400 transition-transform active:scale-95 text-xs sm:text-sm flex-shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>DIAL 112 NOW</span>
              </a>
            )}
          </div>
        </div>

        {/* Critical Medical History Alerts (Allergies / Chronic Conditions) */}
        {triage.medicalAlerts && triage.medicalAlerts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-amber-300">
                    MEDICAL HISTORY & ALLERGY FLAGS
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {triage.medicalAlerts.length} Active
                  </span>
                </div>
                <ul className="space-y-1 mt-1">
                  {triage.medicalAlerts.map((alert, idx) => (
                    <li key={idx} className="text-xs text-amber-200/90 font-medium leading-relaxed flex items-start gap-1.5">
                      <span className="text-amber-400">·</span>
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
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-white tracking-wide">
                First-Aid Action Protocol
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {completedCount} of {steps.length} done ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-3 overflow-hidden border border-white/[0.05]">
            <div
              className={`h-full transition-all duration-300 ${
                triage.tag === 'RED' ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                onClick={() => toggleStep(step.stepNumber)}
                className={`cursor-pointer rounded-xl border p-3 sm:p-3.5 transition-all flex items-start gap-3 select-none ${
                  step.completed
                    ? 'bg-white/[0.02] border-emerald-500/20 opacity-75'
                    : step.isCritical
                    ? 'bg-red-500/[0.06] border-red-500/30 hover:border-red-500/50'
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Step {step.stepNumber}:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        step.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.isCritical && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      step.completed ? 'text-slate-400' : 'text-slate-300'
                    }`}
                  >
                    {step.instruction}
                  </p>

                  {step.warning && (
                    <div className="mt-2 text-xs font-medium text-amber-300/90 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
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
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-3.5">
            <h5 className="text-xs font-mono font-medium text-rose-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              CRITICAL CONTRAINDICATIONS & DO NOTs
            </h5>
            <ul className="space-y-1.5 text-xs text-rose-200/90">
              {triage.criticalDoNots.map((dont, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400">·</span>
                  <span>{dont}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vital Signs to Monitor Grid */}
        {triage.vitalsToCheck && triage.vitalsToCheck.length > 0 && (
          <div>
            <h5 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              IMMEDIATE VITALS TO ASSESS & REPORT
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {triage.vitalsToCheck.map((vital, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-xs"
                >
                  <span className="font-semibold text-slate-200 block">{vital.parameter}</span>
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
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3">
            <h5 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              VERIFY WITH PATIENT / SCENE NOW
            </h5>
            <ul className="space-y-1 text-xs text-slate-300">
              {triage.criticalQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono text-[11px]">Q{idx + 1}:</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* MIST Paramedic Handover Report Section */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  MIST Paramedic Handover Brief
                </span>
                <span className="text-[11px] text-slate-400">
                  Mechanism · Injuries · Signs · Treatment
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMistDetail(!showMistDetail)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showMistDetail ? 'Collapse' : 'View'}
              </button>

              <button
                onClick={handleCopyMist}
                className="flex items-center gap-1.5 text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 px-3 py-1.5 rounded-xl border border-white/[0.08] transition-all"
              >
                {copiedMist ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
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
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-blue-400 block font-mono text-[11px]">[M] Mechanism:</strong>
                  <span className="mt-0.5 block">{triage.mistReport.mechanism}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-rose-400 block font-mono text-[11px]">[I] Injuries Found:</strong>
                  <span className="mt-0.5 block">{triage.mistReport.injuries}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-amber-400 block font-mono text-[11px]">[S] Signs & Vitals:</strong>
                  <span className="mt-0.5 block">{triage.mistReport.signs}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-emerald-400 block font-mono text-[11px]">[T] Treatment Given:</strong>
                  <span className="mt-0.5 block">{triage.mistReport.treatment}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
