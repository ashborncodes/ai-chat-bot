import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  X, 
  MapPin, 
  Copy, 
  Check, 
  AlertTriangle, 
  Volume2 
} from 'lucide-react';
import { TriageResult } from '../types/triage';
import { triggerSOSVibration } from '../utils/haptics';

interface EmergencyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestTriage?: TriageResult | null;
}

export const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({
  isOpen,
  onClose,
  latestTriage,
}) => {
  const [gpsString, setGpsString] = useState<string>('Detecting location coordinates...');
  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState('112');

  useEffect(() => {
    if (isOpen) {
      triggerSOSVibration();
    }
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsString(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        },
        (err) => {
          setGpsString('GPS not available - share nearest landmark/crossroad');
        },
        { timeout: 7000 }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verbalScript = `EMERGENCY DISPATCH REPORT (INDIA 112 / 108):
- Location / GPS: ${gpsString}
- Priority: ${latestTriage?.tagLabel || 'URGENT MEDICAL EMERGENCY'}
- Nature of Emergency: ${latestTriage?.mistReport?.mechanism || 'Accident / Medical Emergency'}
- Immediate Threat: ${latestTriage?.primaryAction || 'Patient requires immediate emergency medical transport'}
- Signs & Symptoms: ${latestTriage?.mistReport?.signs || 'Checking consciousness and breathing'}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(verbalScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-red-600 rounded-2xl p-4 sm:p-5 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-600 text-white shadow-lg shadow-red-950 animate-pulse">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>Emergency SOS (India)</span>
            </h3>
            <p className="text-xs text-slate-300">
              National Emergency Response Service: <strong className="text-red-400">112</strong>
            </p>
          </div>
        </div>

        {/* Number Selector */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => {
              triggerSOSVibration();
              setSelectedNumber('112');
            }}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
              selectedNumber === '112'
                ? 'bg-red-700 text-white border-red-500 shadow-md shadow-red-950'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112 (All Emergencies)</span>
          </button>

          <button
            onClick={() => {
              triggerSOSVibration();
              setSelectedNumber('108');
            }}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
              selectedNumber === '108'
                ? 'bg-red-700 text-white border-red-500 shadow-md shadow-red-950'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>108 (Ambulance)</span>
          </button>
        </div>

        {/* Big One-Click Call Button */}
        <a
          href={`tel:${selectedNumber}`}
          onClick={triggerSOSVibration}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 font-extrabold text-lg text-white shadow-xl shadow-red-950 border border-red-400 transition transform active:scale-95 mb-4"
        >
          <PhoneCall className="w-5 h-5 animate-bounce" />
          <span>CALL {selectedNumber} NOW</span>
        </a>

        {/* GPS location pill */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 mb-3 text-xs">
          <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="flex-1 font-mono text-[11px] truncate text-slate-300">
            {gpsString}
          </div>
        </div>

        {/* Verbal Dispatcher Script */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              SAY THIS TO 112 DISPATCHER:
            </span>
            <button
              onClick={handleCopyScript}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1 font-mono leading-relaxed bg-slate-900/80 p-2 rounded border border-slate-800">
            <p>
              <strong className="text-red-400">Location: </strong>
              <span className="text-white">{gpsString}</span>
            </p>
            {latestTriage && (
              <>
                <p>
                  <strong className="text-amber-400">Emergency: </strong>
                  <span>{latestTriage.tagLabel}</span>
                </p>
                <p>
                  <strong className="text-emerald-400">Status: </strong>
                  <span>{latestTriage.primaryAction}</span>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-[11px] text-amber-300/90 flex items-center gap-1.5 bg-amber-950/30 p-2 rounded-lg border border-amber-900/40">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Keep your phone on speaker so your hands remain free to help the patient!</span>
        </p>
      </div>
    </div>
  );
};
