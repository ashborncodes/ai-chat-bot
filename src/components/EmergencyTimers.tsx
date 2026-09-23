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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('cpr')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'cpr'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>CPR Metronome (110 BPM)</span>
          </button>

          <button
            onClick={() => setActiveTab('bleeding')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'bleeding'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-red-400" />
            <span>5-Min Pressure Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('tourniquet')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'tourniquet'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Visual Pulsing Heart / Compression Target */}
            <div
              className={`relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-100 ${
                cprRunning
                  ? beatCount % 2 === 0
                    ? 'scale-105 bg-rose-600/30 border-rose-500 shadow-lg shadow-rose-900/50'
                    : 'scale-95 bg-rose-950/80 border-rose-700'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <HeartPulse
                className={`w-7 h-7 ${cprRunning ? 'text-rose-400' : 'text-slate-500'}`}
              />
              {cprRunning && (
                <span className="absolute -bottom-1 text-[10px] font-mono font-bold text-white bg-rose-700 px-1 rounded">
                  {beatCount}/30
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">110 BPM Chest Compressions</span>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-950/70 border border-rose-900/80 px-1.5 py-0.2 rounded">
                  Target: 2-2.4 in (5 cm)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {cprRunning
                  ? `Cycle ${cycleCount} • Push hard & fast in center of chest • Allow full recoil`
                  : 'AHA standard 100-120 BPM cadence for adult/child cardiac arrest'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setCprSound(!cprSound)}
              title={cprSound ? 'Mute metronome click' : 'Unmute metronome click'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
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
              className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-md ${
                cprRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60'
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
                  <span>Start CPR Metronome</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bleeding Pressure Timer Content */}
      {activeTab === 'bleeding' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-slate-950 border border-red-800/80 px-2">
              <span className="font-mono font-bold text-lg text-red-400">
                {formatMinutes(bleedingTime)}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Countdown</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Direct Continuous Pressure</span>
                {bleedingTime === 0 && (
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                    Time Up - Check Clot
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-300/90 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span>Do NOT lift cloth or dressing to check while timer is running!</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setBleedingRunning(false);
                setBleedingTime(300);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Reset 5-Minute Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setBleedingRunning(!bleedingRunning)}
              className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                bleedingRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
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
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Extremity Tourniquet Time Marker</span>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.2 rounded">
                  Critical for Surgery
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                Log exact application time to write on patient's forehead ("TK 14:32") and report to trauma team.
              </p>
            </div>

            <button
              onClick={handleLogTourniquet}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark Tourniquet Time Now</span>
            </button>
          </div>

          {tourniquetLogs.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {tourniquetLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-950 border border-amber-900/60 rounded-md px-2.5 py-1 text-xs font-mono text-amber-300"
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
            <div className="text-xs text-slate-500 italic bg-slate-950/50 p-2 rounded border border-slate-800/80">
              No tourniquets logged yet. Click above when applying a tourniquet 2-3 inches above the wound.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
