import React, { useState } from 'react';
import { MCIPatient, TriageTag } from '../types/triage';
import { TriageTagBadge } from './TriageTagBadge';
import { 
  Users, 
  Trash2, 
  Copy, 
  Check, 
  FileDown, 
  Clock, 
  ShieldAlert, 
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

    patients.forEach((p, idx) => {
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Mass Casualty Incident (MCI) Scene Board
              </h2>
              <p className="text-xs text-slate-400">
                Live field roster tracking all triaged patients across the incident zone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              disabled={patients.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Roster Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Incident Report</span>
                </>
              )}
            </button>

            {patients.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 px-3 py-2 rounded-xl transition"
              >
                Clear Roster
              </button>
            )}
          </div>
        </div>

        {/* MCI Tally Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Casualties</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5">{patients.length}</span>
          </div>

          <div className="bg-red-950/40 border border-red-900/70 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-red-400 block">Immediate (Red)</span>
            <span className="text-2xl font-black text-red-400 font-mono mt-0.5">{redCount}</span>
          </div>

          <div className="bg-amber-950/40 border border-amber-900/70 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-amber-400 block">Delayed (Yellow)</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5">{yellowCount}</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-900/70 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block">Minimal (Green)</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{greenCount}</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expectant (Black)</span>
            <span className="text-2xl font-black text-slate-400 font-mono mt-0.5">{blackCount}</span>
          </div>
        </div>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-300">No Patients on Scene Board</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
            Run a triage evaluation in the chat or with quick presets, then click &quot;Log Patient&quot; on the result card to add them to this scene tracking board.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1">
                <TriageTagBadge tag={patient.tag} size="md" />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {patient.identifier}
                    </span>
                    <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {patient.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-200">Urgent Action: </strong>
                    {patient.primaryAction}
                  </p>

                  <p className="text-xs text-slate-300 line-clamp-1">
                    {patient.summary}
                  </p>

                  {patient.fullTriage.medicalAlerts && patient.fullTriage.medicalAlerts.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {patient.fullTriage.medicalAlerts.map((alert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/50 text-amber-300"
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
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => onDeletePatient(patient.id)}
                  title="Remove patient from board"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
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
