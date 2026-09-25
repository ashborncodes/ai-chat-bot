import React from 'react';
import { 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Users
} from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { triggerSOSVibration } from '../utils/haptics';

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
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0d14]/85 backdrop-blur-2xl transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="font-semibold text-sm tracking-tight text-white font-sans">
            RescueTriage
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            112
          </span>
        </div>

        {/* Apple Segmented Control */}
        <div className="flex items-center bg-white/[0.05] p-0.5 rounded-xl border border-white/[0.04]">
          <button
            onClick={() => onViewChange('triage')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeView === 'triage'
                ? 'bg-white/15 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Triage
          </button>
          <button
            onClick={() => onViewChange('mci')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeView === 'mci'
                ? 'bg-white/15 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Scene Board</span>
            {patientCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] rounded-full font-mono">
                {patientCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <OfflineIndicator />

          {/* Audio toggle glyph */}
          <button
            onClick={onToggleAutoSpeak}
            title={autoSpeak ? 'Audio narration enabled' : 'Audio narration muted'}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Protocols glyph */}
          <button
            onClick={onOpenProtocolModal}
            title="Emergency Guidelines"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hidden sm:block"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Minimal SOS Pill */}
          <button
            onClick={() => {
              triggerSOSVibration();
              onOpenCallModal();
            }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-transform active:scale-95 shadow-md shadow-red-950/60"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112</span>
          </button>
        </div>
      </div>
    </header>
  );
};
