import React from 'react';
import { 
  Flame, 
  AlertOctagon, 
  Zap,
  Footprints, 
  ShieldAlert, 
  HeartCrack 
} from 'lucide-react';
import { PatientContext } from '../types/triage';

interface ScenarioPreset {
  id: string;
  title: string;
  tag: 'RED' | 'YELLOW' | 'GREEN';
  description: string;
  prompt: string;
  icon: React.ElementType;
  context: PatientContext;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'bike_accident',
    title: 'Road Crash & Bleed',
    tag: 'RED',
    description: 'Deep arterial cut on leg, heavy bleeding through cloth, pale & dizzy',
    prompt: 'Bike collision on road. Rider has a deep 3-inch cut on calf, bright red blood is bleeding heavily through cloth, dizzy and pale, conscious and breathing.',
    icon: Flame,
    context: {
      ageGroup: 'Adult',
      conscious: true,
      breathing: true,
      severeBleeding: true,
      walking: false,
    },
  },
  {
    id: 'snakebite',
    title: 'Snakebite Injury',
    tag: 'RED',
    description: 'Puncture fang marks on ankle, rapid swelling, pain & nausea',
    prompt: 'Person bitten on ankle by unknown snake in garden 15 mins ago. Two fang puncture marks visible, severe burning pain and swelling starting, patient is scared and dizzy.',
    icon: AlertOctagon,
    context: {
      ageGroup: 'Adult',
      conscious: true,
      breathing: true,
      severeBleeding: false,
      walking: false,
    },
  },
  {
    id: 'electric_shock',
    title: 'Electric Shock',
    tag: 'RED',
    description: 'Exposed wire shock, power shut off, unresponsive, shallow breathing',
    prompt: 'Worker got electric shock from open cooler wire and collapsed on floor. Main switch turned off immediately. Person is unresponsive and breathing is very shallow.',
    icon: Zap,
    context: {
      ageGroup: 'Adult',
      conscious: false,
      breathing: false,
      severeBleeding: false,
      walking: false,
    },
  },
  {
    id: 'cardiac_collapse',
    title: 'Cardiac Arrest',
    tag: 'RED',
    description: 'Sudden collapse, unresponsive, not breathing normally, CPR needed',
    prompt: 'Elderly person collapsed suddenly in room, unconscious, not responding to shout or pinch, no chest rise, not breathing normally.',
    icon: HeartCrack,
    context: {
      ageGroup: 'Elderly',
      conscious: false,
      breathing: false,
      severeBleeding: false,
      walking: false,
    },
  },
  {
    id: 'fracture_fall',
    title: 'Arm Fracture',
    tag: 'YELLOW',
    description: 'Fall from stairs, forearm visibly deformed with intense pain, alert',
    prompt: 'Fell down staircase, left wrist and forearm visibly crooked and deformed with intense swelling. Conscious, breathing normally, fingers are warm.',
    icon: ShieldAlert,
    context: {
      ageGroup: 'Adult',
      conscious: true,
      breathing: true,
      severeBleeding: false,
      walking: false,
    },
  },
  {
    id: 'road_rash_scrape',
    title: 'Superficial Abrasions',
    tag: 'GREEN',
    description: 'Minor road rash from scooter skid, walking and fully alert',
    prompt: 'Skidded on loose gravel on scooter at low speed. Superficial abrasions on knee and palms with slight bleeding already clotted, walking wounded and alert.',
    icon: Footprints,
    context: {
      ageGroup: 'Adult',
      conscious: true,
      breathing: true,
      severeBleeding: false,
      walking: true,
    },
  },
];

interface QuickScenariosProps {
  onSelectScenario: (prompt: string, context: PatientContext) => void;
  isLoading: boolean;
}

export const QuickScenarios: React.FC<QuickScenariosProps> = ({
  onSelectScenario,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/40 border border-white/[0.08] rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="text-[12px] font-medium text-slate-300">
          Emergency Presets
        </span>
        <span className="text-[11px] text-slate-500">
          Tap for rapid protocol evaluation
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PRESETS.map((scenario) => {
          const Icon = scenario.icon;
          const tagColors = {
            RED: 'text-red-400 bg-red-500/10 border-red-500/20',
            YELLOW: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            GREEN: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          };

          return (
            <button
              key={scenario.id}
              disabled={isLoading}
              onClick={() => onSelectScenario(scenario.prompt, scenario.context)}
              className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] text-left transition-all active:scale-[0.98] flex flex-col justify-between group disabled:opacity-40"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded-lg bg-white/[0.05] text-slate-300 group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border font-medium ${tagColors[scenario.tag]}`}>
                    {scenario.tag}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {scenario.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-snug">
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
