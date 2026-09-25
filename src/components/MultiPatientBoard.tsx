import React, { useState } from 'react';
import { MCIPatient } from '../types/triage';
import { TriageTagBadge } from './TriageTagBadge';
import { 
  Users, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

interface MultiPatientBoardProps {
  patients: MCIPatient[];
  onSelectPatient: (patient: MCIPatient) => void;
  onDeletePatient: (id: string) => void;
  onClearAll: () => void;
}

export const MultiPatientBoard: React.FC<MultiPatientBoardProps> = ({
  patients,
  onSelectPatient,
  onDeletePatient,
  onClearAll,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  const redCount = patients.filter((p) => p.tag === 'RED').length;
  const yellowCount = patients.filter((p) => p.tag === 'YELLOW').length;
  const greenCount = patients.filter((p) => p.tag === 'GREEN').length;
  const blackCount = patients.filter((p) => p.tag === 'BLACK').length;

  const handleCopySummary = () => {
    if (patients.length === 0) return;

    let text = `*** MASS CASUALTY INCIDENT (MCI) SCENE TRIAGE ROSTER ***
Total Casualties: ${patients.length}
RED (Immediate): ${redCount} | YELLOW (Delayed): ${yellowCount} | GREEN (Minimal): ${greenCount} | BLACK (Expectant): ${blackCount}
Timestamp: ${new Date().toLocaleTimeString()}

--- CASUALTY BREAKDOWN ---
`;

    patients.forEach((p) => {
      text += `\n[#${p.tagNumber}] ${p.identifier}
TAG: ${p.tag}
ACTION: ${p.primaryAction}
STATUS: ${p.summary}
LOGGED: ${p.timestamp}
`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header and Tally Card */}
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-4 sm:p-5 backdrop-blur-2xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Mass Casualty Incident Roster
              </h2>
              <p className="text-xs text-slate-400">
                Live field casualty tracker across active emergency zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              disabled={patients.length === 0}
              className="flex items-center gap-1.5 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 text-slate-200 px-3 py-2 rounded-xl border border-white/[0.08] transition-all active:scale-95"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Roster Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            {patients.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-3 py-2 rounded-xl transition-all"
              >
                Clear Roster
              </button>
            )}
          </div>
        </div>

        {/* MCI Tally Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5">{patients.length}</span>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-red-300 block">Immediate (Red)</span>
            <span className="text-2xl font-bold text-red-400 font-mono mt-0.5">{redCount}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-amber-300 block">Delayed (Yellow)</span>
            <span className="text-2xl font-bold text-amber-400 font-mono mt-0.5">{yellowCount}</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-emerald-300 block">Minimal (Green)</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">{greenCount}</span>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expectant (Black)</span>
            <span className="text-2xl font-bold text-slate-400 font-mono mt-0.5">{blackCount}</span>
          </div>
        </div>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <div className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl p-8 text-center">
          <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No Casualties on Scene Board</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Run a triage assessment or pick a preset, then tap &quot;Log Patient&quot; to track casualties in this roster.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-slate-900/60 border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-4 transition-all shadow-md backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1">
                <TriageTagBadge tag={patient.tag} size="md" />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {patient.identifier}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {patient.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-200">Urgent Action: </strong>
                    {patient.primaryAction}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {patient.summary}
                  </p>

                  {patient.fullTriage.medicalAlerts && patient.fullTriage.medicalAlerts.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {patient.fullTriage.medicalAlerts.map((alert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300"
                        >
                          <span>⚠️</span>
                          <span>{alert.split(':')[0]}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onSelectPatient(patient)}
                  className="flex items-center gap-1.5 text-xs bg-white/[0.05] hover:bg-white/[0.1] text-blue-300 px-3 py-1.5 rounded-xl border border-white/[0.08] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => onDeletePatient(patient.id)}
                  title="Remove patient from board"
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-white/[0.05] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
