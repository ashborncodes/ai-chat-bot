import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, 
  Timer, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Volume2, 
  VolumeX, 
  AlertTriangle 
} from 'lucide-react';
import { playCPRClick, playEmergencyAlertSound } from '../utils/sound';
import { triggerTourniquetLogVibration, vibrate } from '../utils/haptics';

interface EmergencyTimersProps {
  initialActiveTimer?: 'cpr' | 'bleeding_pressure' | 'tourniquet' | 'reassess' | 'none';
  onTourniquetLogged?: (timestamp: string) => void;
}

export const EmergencyTimers: React.FC<EmergencyTimersProps> = ({
  initialActiveTimer = 'none',
  onTourniquetLogged,
}) => {
  const [activeTab, setActiveTab] = useState<'cpr' | 'bleeding' | 'tourniquet'>(
    initialActiveTimer === 'cpr'
      ? 'cpr'
      : initialActiveTimer === 'bleeding_pressure'
      ? 'bleeding'
      : 'cpr'
  );

  // CPR Metronome State (110 BPM)
  const [cprRunning, setCprRunning] = useState(false);
  const [cprSound, setCprSound] = useState(true);
  const [beatCount, setBeatCount] = useState(0);
  const [cycleCount, setCycleCount] = useState(1);
  const cprIntervalRef = useRef<number | null>(null);

  // Bleeding Direct Pressure Timer (5 minutes / 300 seconds)
  const [bleedingTime, setBleedingTime] = useState(300);
  const [bleedingRunning, setBleedingRunning] = useState(false);
  const bleedingIntervalRef = useRef<number | null>(null);

  // Tourniquet Timestamps
  const [tourniquetLogs, setTourniquetLogs] = useState<string[]>([]);
  const [copiedTk, setCopiedTk] = useState<string | null>(null);

  // Handle CPR Metronome
  useEffect(() => {
    if (cprRunning) {
      const intervalMs = Math.round(60000 / 110); // ~545ms for 110 BPM
      cprIntervalRef.current = window.setInterval(() => {
        setBeatCount((prev) => {
          const next = (prev % 30) + 1;
          const isStrongBeat = next === 1 || next === 30;
          if (cprSound) {
            playCPRClick(isStrongBeat);
          }
          if (next === 30) {
            setCycleCount((c) => c + 1);
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    }

    return () => {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    };
  }, [cprRunning, cprSound]);

  // Handle Bleeding Pressure Timer
  useEffect(() => {
    if (bleedingRunning && bleedingTime > 0) {
      bleedingIntervalRef.current = window.setInterval(() => {
        setBleedingTime((prev) => {
          if (prev <= 1) {
            setBleedingRunning(false);
            playEmergencyAlertSound();
            vibrate([100, 50, 100, 50, 150]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (bleedingIntervalRef.current) clearInterval(bleedingIntervalRef.current);
    }

    return () => {
      if (bleedingIntervalRef.current) clearInterval(bleedingIntervalRef.current);
    };
  }, [bleedingRunning, bleedingTime]);

  const handleLogTourniquet = () => {
    triggerTourniquetLogVibration();
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry = `TK #${tourniquetLogs.length + 1} Applied: ${timeString}`;
    setTourniquetLogs((prev) => [logEntry, ...prev]);
    onTourniquetLogged?.(timeString);
  };

  const handleCopyTk = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTk(text);
    setTimeout(() => setCopiedTk(null), 2000);
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/40 border border-white/[0.08] rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
      {/* Apple-style Segmented Header Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
        <div className="flex items-center bg-white/[0.05] p-1 rounded-xl border border-white/[0.04]">
          <button
            onClick={() => setActiveTab('cpr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'cpr'
                ? 'bg-rose-500/20 text-rose-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>CPR 110 BPM</span>
          </button>

          <button
            onClick={() => setActiveTab('bleeding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'bleeding'
                ? 'bg-red-500/20 text-red-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-red-400" />
            <span>Pressure Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('tourniquet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'tourniquet'
                ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Tourniquet Log</span>
          </button>
        </div>
      </div>

      {/* CPR Metronome Content */}
      {activeTab === 'cpr' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {/* Visual Pulse Target */}
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-100 ${
                cprRunning
                  ? beatCount % 2 === 0
                    ? 'scale-105 bg-rose-500/25 border-rose-500 shadow-md shadow-rose-950'
                    : 'scale-95 bg-rose-950/40 border-rose-600/40'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-500'
              }`}
            >
              <HeartPulse
                className={`w-6 h-6 ${cprRunning ? 'text-rose-400' : 'text-slate-500'}`}
              />
              {cprRunning && (
                <span className="absolute -bottom-1 text-[9px] font-mono font-bold text-white bg-rose-600 px-1 rounded-full">
                  {beatCount}/30
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">Chest Compressions</span>
                <span className="text-[11px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  Target: 5 cm depth
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {cprRunning
                  ? `Cycle ${cycleCount} · Push hard & fast in center of chest · Allow full recoil`
                  : '110 BPM auditory cadence · 30 compressions then 2 rescue breaths'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setCprSound(!cprSound)}
              title={cprSound ? 'Mute click' : 'Unmute click'}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-all"
            >
              {cprSound ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={() => {
                setCprRunning(!cprRunning);
                if (!cprRunning) {
                  setBeatCount(0);
                  setCycleCount(1);
                }
              }}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                cprRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/60'
              }`}
            >
              {cprRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Metronome</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start CPR Cadence</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bleeding Pressure Timer Content */}
      {activeTab === 'bleeding' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="flex flex-col items-center justify-center w-16 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="font-mono font-bold text-base text-red-400">
                {formatMinutes(bleedingTime)}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Timer</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">Direct Continuous Pressure</span>
                {bleedingTime === 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Time Complete · Inspect Clot
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-300/90 flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Keep continuous firm pressure. Do not lift cloth to peek.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setBleedingRunning(false);
                setBleedingTime(300);
              }}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setBleedingRunning(!bleedingRunning)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                bleedingRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/60'
              }`}
            >
              {bleedingRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{bleedingTime < 300 ? 'Resume Timer' : 'Start 5-Min Timer'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tourniquet Logger Content */}
      {activeTab === 'tourniquet' && (
        <div className="space-y-3 py-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Tourniquet Application Marker</span>
                <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Critical Trauma Metric
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Record exact application time to write on patient&apos;s forehead (&quot;TK 14:32&quot;) for the surgical team.
              </p>
            </div>

            <button
              onClick={handleLogTourniquet}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Log Application Time</span>
            </button>
          </div>

          {tourniquetLogs.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {tourniquetLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-mono text-amber-300"
                >
                  <span>{log}</span>
                  <button
                    onClick={() => handleCopyTk(log)}
                    className="text-slate-400 hover:text-white transition"
                    title="Copy time"
                  >
                    {copiedTk === log ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.06]">
              No tourniquets logged yet. Tap above when placing a tourniquet 2-3 inches above the wound.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
