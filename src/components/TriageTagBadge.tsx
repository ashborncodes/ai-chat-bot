import React from 'react';
import { TriageTag } from '../types/triage';
import { AlertTriangle, Clock, CheckCircle2, Skull } from 'lucide-react';

interface TriageTagBadgeProps {
  tag: TriageTag;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const TriageTagBadge: React.FC<TriageTagBadgeProps> = ({
  tag,
  size = 'md',
  showPulse = true,
}) => {
  const configs = {
    RED: {
      bg: 'bg-red-950/80',
      border: 'border-red-500',
      text: 'text-red-400',
      glow: 'shadow-red-900/50',
      label: 'RED - IMMEDIATE',
      priority: 'PRIORITY 1',
      icon: AlertTriangle,
      dotColor: 'bg-red-500',
      ringColor: 'ring-red-500/50',
    },
    YELLOW: {
      bg: 'bg-amber-950/80',
      border: 'border-amber-500',
      text: 'text-amber-400',
      glow: 'shadow-amber-900/50',
      label: 'YELLOW - DELAYED',
      priority: 'PRIORITY 2',
      icon: Clock,
      dotColor: 'bg-amber-400',
      ringColor: 'ring-amber-500/50',
    },
    GREEN: {
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-500',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-900/50',
      label: 'GREEN - MINIMAL',
      priority: 'PRIORITY 3',
      icon: CheckCircle2,
      dotColor: 'bg-emerald-400',
      ringColor: 'ring-emerald-500/50',
    },
    BLACK: {
      bg: 'bg-slate-900',
      border: 'border-slate-700',
      text: 'text-slate-400',
      glow: 'shadow-slate-900',
      label: 'BLACK - EXPECTANT',
      priority: 'PRIORITY 4',
      icon: Skull,
      dotColor: 'bg-slate-500',
      ringColor: 'ring-slate-500/50',
    },
  };

  const config = configs[tag] || configs.YELLOW;
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-bold ${config.bg} ${config.border} ${config.text}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor} ${tag === 'RED' && showPulse ? 'animate-ping' : ''}`} />
        {tag}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`flex items-center justify-between p-3.5 rounded-xl border-2 shadow-xl ${config.bg} ${config.border} ${config.glow} transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg bg-black/40 border ${config.border} ${config.text}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg sm:text-xl font-black tracking-wider ${config.text}`}>
                {config.label}
              </span>
              {tag === 'RED' && showPulse && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-mono">{config.priority} • FIELD TRIAGE PROTOCOL</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-md font-mono font-bold text-xs sm:text-sm ${config.bg} ${config.border} ${config.text}`}
    >
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
      {tag === 'RED' && showPulse && (
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-0.5" />
      )}
    </span>
  );
};
