import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface TriageProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TriageProtocolModal: React.FC<TriageProtocolModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl text-white space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              START & SALT Emergency Triage Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Simple Triage and Rapid Treatment standard for mass casualties & field emergencies.
            </p>
          </div>
        </div>

        {/* 4 Tags Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-red-800 bg-red-950/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-red-400 font-mono">RED - IMMEDIATE (Priority 1)</span>
            </div>
            <p className="text-slate-300">
              Life-threatening compromise to Airway, Breathing, or Circulation. Immediate survival depends on immediate stabilization (within minutes).
            </p>
            <span className="text-[10px] text-red-300/80 font-mono block">
              Examples: Tension pneumothorax, arterial spurting, airway obstruction, shock.
            </span>
          </div>

          <div className="p-3 rounded-xl border border-amber-800 bg-amber-950/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-400 font-mono">YELLOW - DELAYED (Priority 2)</span>
            </div>
            <p className="text-slate-300">
              Serious systemic or traumatic injuries, but vital signs are currently stable. Care can safely wait 30–60+ minutes without death.
            </p>
            <span className="text-[10px] text-amber-300/80 font-mono block">
              Examples: Closed major fractures with distal pulse, controlled deep lacerations.
            </span>
          </div>

          <div className="p-3 rounded-xl border border-emerald-800 bg-emerald-950/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-400 font-mono">GREEN - MINIMAL (Priority 3)</span>
            </div>
            <p className="text-slate-300">
              &quot;Walking wounded&quot;. Minor wounds, abrasions, sprains. Able to follow directions and self-evacuate.
            </p>
            <span className="text-[10px] text-emerald-300/80 font-mono block">
              Examples: Superficial lacerations, mild contusions, ankle sprain.
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-700 bg-slate-950 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-400 font-mono">BLACK - EXPECTANT (Priority 4)</span>
            </div>
            <p className="text-slate-300">
              Injuries catastrophic or incompatible with life. Apneic even after opening airway. Palliative care only.
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Examples: Open cranial trauma with brain matter, non-responsive apnea with no pulse.
            </span>
          </div>
        </div>

        {/* START Step-by-Step Algorithm */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>The 60-Second START Algorithm:</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-3 p-2 rounded bg-slate-900 border border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-slate-200">1</span>
              <div>
                <strong className="text-white">Can the patient walk?</strong>
                <p className="text-slate-400">Yes &rarr; Direct them to designated gathering area &rarr; <strong className="text-emerald-400">GREEN</strong></p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded bg-slate-900 border border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-slate-200">2</span>
              <div>
                <strong className="text-white">Spontaneous Breathing?</strong>
                <p className="text-slate-400">
                  No &rarr; Open airway (head-tilt chin-lift or jaw thrust).
                  <br />Still no &rarr; <strong className="text-slate-400">BLACK</strong>.
                  <br />Resumes breathing &rarr; <strong className="text-red-400">RED</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded bg-slate-900 border border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-slate-200">3</span>
              <div>
                <strong className="text-white">Respiratory Rate:</strong>
                <p className="text-slate-400">
                  Over 30 breaths/min or under 10 &rarr; <strong className="text-red-400">RED</strong>.
                  <br />Normal rate (10–30) &rarr; Proceed to perfusion assessment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded bg-slate-900 border border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-slate-200">4</span>
              <div>
                <strong className="text-white">Perfusion & Radial Pulse:</strong>
                <p className="text-slate-400">
                  Capillary refill &gt; 2 sec OR absent radial pulse &rarr; <strong className="text-red-400">RED</strong> (Control bleeding, elevate extremities).
                  <br />Pulse present &lt; 2 sec &rarr; Proceed to mental status.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded bg-slate-900 border border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-slate-200">5</span>
              <div>
                <strong className="text-white">Mental Status (AVPU):</strong>
                <p className="text-slate-400">
                  Cannot follow simple commands (&quot;Squeeze my hand&quot;) &rarr; <strong className="text-red-400">RED</strong>.
                  <br />Follows simple commands &rarr; <strong className="text-amber-400">YELLOW</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* India Emergency Highlights */}
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 space-y-2 text-xs">
          <span className="font-mono font-bold text-red-400 block uppercase">
            INDIA EMERGENCY PROTOCOL NOTES (SOS 112 / 108):
          </span>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong className="text-white">Single Emergency Number: 112</strong> connects to ERSS (Police, Fire, Medical Ambulance). <strong>108</strong> is direct medical ambulance.</li>
            <li><strong className="text-amber-300">Snakebite:</strong> Keep victim calm, immobilize limb with splint/bandage. Do NOT cut, suck, or tie tight tourniquets. Rush to hospital with Anti-Snake Venom (ASV).</li>
            <li><strong className="text-yellow-300">Electric Shock:</strong> Switch off main circuit before touching victim, use dry wooden stick if needed.</li>
          </ul>
        </div>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
