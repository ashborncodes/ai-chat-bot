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
    title: 'Bike / Road Crash',
    tag: 'RED',
    description: 'Two-wheeler collision, heavy bleeding from leg, conscious but dizzy',
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
    title: 'Snakebite Emergency',
    tag: 'RED',
    description: 'Bitten by snake in field/compound, fang marks, swelling and panic',
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
    description: 'Touched live electric wire/cooler, collapsed, need to verify power off',
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
    title: 'Unconscious / No Breathing',
    tag: 'RED',
    description: 'Sudden collapse, not breathing, needs immediate hands-only CPR',
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
    title: 'Fracture / Bone Injury',
    tag: 'YELLOW',
    description: 'Fall from stairs, forearm crooked/broken, conscious with severe pain',
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
    title: 'Minor Road Rash / Cut',
    tag: 'GREEN',
    description: 'Minor scrape from bicycle skid, bleeding stopped, walking',
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          COMMON EMERGENCIES IN INDIA (1-TAP TEST)
        </span>
        <span className="text-[10px] text-slate-400">Tap to run</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PRESETS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.id}
              disabled={isLoading}
              onClick={() => onSelectScenario(scenario.prompt, scenario.context)}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-900 hover:border-slate-700 text-left transition flex flex-col justify-between group disabled:opacity-50"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Icon className="w-4 h-4 text-slate-300 group-hover:text-white" />
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                      scenario.tag === 'RED'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : scenario.tag === 'YELLOW'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {scenario.tag}
                  </span>
                </div>
                <h6 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                  {scenario.title}
                </h6>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
