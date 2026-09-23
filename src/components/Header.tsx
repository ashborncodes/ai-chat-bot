import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Users, 
  Clock
} from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';

interface HeaderProps {
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onOpenCallModal: () => void;
  onOpenProtocolModal: () => void;
  activeView: 'triage' | 'mci';
  onViewChange: (view: 'triage' | 'mci') => void;
  patientCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  autoSpeak,
  onToggleAutoSpeak,
  onOpenCallModal,
  onOpenProtocolModal,
  activeView,
  onViewChange,
  patientCount,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-600 text-white shadow-md shadow-red-950">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                RescueTriage <span className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-950/90 border border-red-800/80 font-mono">INDIA 112</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-mono text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {time}
              </span>
              <span>•</span>
              <span className="text-slate-300">First-Aid Triage</span>
            </div>
          </div>
        </div>

        {/* View Switcher (Simple) */}
        <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => onViewChange('triage')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              activeView === 'triage'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Emergency Chat
          </button>
          <button
            onClick={() => onViewChange('mci')}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 ${
              activeView === 'mci'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Scene Board</span>
            {patientCount > 0 && (
              <span className="ml-1 px-1.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-mono">
                {patientCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls: Offline Indicator, Auto-Voice, Guide, and SOS 112 */}
        <div className="flex items-center gap-2">
          {/* Offline & PWA Indicator */}
          <OfflineIndicator />

          {/* Audio Guidance Toggle */}
          <button
            onClick={onToggleAutoSpeak}
            title={autoSpeak ? 'Voice guide active' : 'Voice guide off'}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              autoSpeak
                ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px] font-medium">{autoSpeak ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* Protocol Guide */}
          <button
            onClick={onOpenProtocolModal}
            title="Triage guidelines"
            className="hidden sm:flex items-center gap-1 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Guidelines</span>
          </button>

          {/* Primary SOS 112 Button (India) */}
          <button
            onClick={onOpenCallModal}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-lg shadow-red-950 border border-red-400 transition active:scale-95 animate-pulse-urgent"
          >
            <PhoneCall className="w-4 h-4" />
            <span>SOS 112</span>
          </button>
        </div>
      </div>
    </header>
  );
};
