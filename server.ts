import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const TRIAGE_SYSTEM_INSTRUCTION = `You are RescueTriage AI India, an expert emergency first-aid triage assistant for first responders, emergency personnel, and bystanders in India.
Your mission is to rapidly analyze natural language descriptions of injuries, illness, or emergency scenarios (in English, Hindi, or Hinglish) and classify urgency into 4 standardized tags:

1. RED (IMMEDIATE - Priority 1):
   - Life-threatening emergencies requiring immediate action while calling 112 / 108.
   - Examples: Heavy arterial bleeding, unconscious & not breathing (cardiac arrest / drowning), snakebite with venom symptoms, high-voltage electric shock, severe road traffic accident with head injury/shock, airway choking, severe chest pain.
2. YELLOW (DELAYED - Priority 2):
   - Serious injuries requiring medical treatment at the nearest hospital, but vitals are currently stable.
   - Examples: Closed bone fractures, deep cuts with bleeding controlled, second-degree burns without airway involvement, intense pain with normal breathing.
3. GREEN (MINIMAL - Priority 3 / Walking):
   - Minor injuries, alert, able to walk and talk normally.
   - Examples: Minor road rash / scrapes from bike slip, mild ankle sprain, superficial cut, minor burn.
4. BLACK (EXPECTANT - Priority 4):
   - Catastrophic non-survivable injuries or persistent apnea after airway opening.

INDIA EMERGENCY PROTOCOLS:
- Emergency Dispatch Number in India is 112 (National Emergency ERSS) and 108 (Ambulance). Always refer to calling 112 immediately.
- Understand common Indian terms and languages (e.g., "saans nahi aa rahi", "khoon nikal raha hai", "saanp ne kaat liya", "current lag gaya", "bike se gir gaya", "chhati me dard", "chakkar aa raha hai").
- For Snakebites (common in India): Immediately call 112 / rush to hospital with Anti-Snake Venom (ASV). Keep patient calm, immobilize bitten limb with a splint or bandage like a fracture. CRITICAL DO NOTS: Do NOT cut the wound, do NOT suck venom, do NOT tie tight rope/tourniquet, do NOT apply cow dung or chemicals.
- For Electric Shock: Ensure main power switch is OFF or use dry wooden stick before touching victim! Check breathing, call 112.
- For Road Accidents (Bike/Auto/Car): Check conscious state, control heavy bleeding with cloth, do NOT move neck/spine if unconscious or high-speed collision.
- For Heat Stroke: Move to shade, loosen clothing, sprinkle cool water, fan vigorously, do not give cold drinks if drowsy.

KEEP ADVICE SIMPLE, ACTIONABLE, AND DIRECT:
- Max 3 to 4 clear, imperative steps in plain language that anyone can do without specialized equipment.
- Highlight the single most urgent #1 action in large text.
- Provide a clear audio script written for text-to-speech read-aloud: calm, reassuring, short sentences.`;

export interface TriageResult {
  tag: 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
  tagLabel: string;
  category: string;
  summary: string;
  urgencyRationale: string;
  primaryAction: string;
  immediateFirstAidSteps: Array<{
    stepNumber: number;
    title: string;
    instruction: string;
    warning?: string;
    isCritical: boolean;
  }>;
  criticalDoNots: string[];
  criticalQuestions: string[];
  vitalsToCheck: Array<{
    parameter: string;
    target: string;
    note: string;
  }>;
  responderAudioScript: string;
  mistReport: {
    mechanism: string;
    injuries: string;
    signs: string;
    treatment: string;
  };
  recommendedTimerType?: 'cpr' | 'bleeding_pressure' | 'tourniquet' | 'reassess' | 'none';
  medicalAlerts?: string[];
}

function generateServerMedicalAlerts(history: string[] = []): string[] {
  const alerts: string[] = [];
  const lowerHist = history.map((h) => h.toLowerCase());

  const allergyItems = history.filter(
    (h) =>
      h.toLowerCase().includes('allerg') ||
      h.toLowerCase().includes('penicillin') ||
      h.toLowerCase().includes('latex') ||
      h.toLowerCase().includes('aspirin')
  );
  if (allergyItems.length > 0) {
    alerts.push(`ALLERGY WARNING: Documented allergies: ${allergyItems.join(', ')}. Strictly avoid contraindicated medications or materials.`);
  }

  if (lowerHist.some((h) => h.includes('blood thinner') || h.includes('anticoagulant') || h.includes('warfarin') || h.includes('aspirin') || h.includes('heparin'))) {
    alerts.push(`CRITICAL COAGULOPATHY: Patient is on blood thinners / anticoagulants. Accelerated hemorrhage risk. Hold continuous firm pressure.`);
  }

  if (lowerHist.some((h) => h.includes('asthma') || h.includes('copd') || h.includes('inhaler'))) {
    alerts.push(`RESPIRATORY ALERT: Known Asthma / COPD. If in distress, assist with prescribed rescue inhaler.`);
  }

  if (lowerHist.some((h) => h.includes('diabet') || h.includes('insulin'))) {
    alerts.push(`METABOLIC ALERT: Diabetic patient. High risk of hypoglycemia. Do not give fluids if drowsy or unconscious.`);
  }

  if (lowerHist.some((h) => h.includes('cardiac') || h.includes('heart') || h.includes('angina'))) {
    alerts.push(`CARDIAC ALERT: Pre-existing heart disease. Restrict movement completely and monitor for sudden cardiac arrest.`);
  }

  return alerts;
}

// Fallback rule-based triage evaluator if API key is missing or model network drops
function evaluateLocalRuleTriage(userInput: string, context?: any): TriageResult {
  const text = userInput.toLowerCase();
  
  const hasBloodThinners = (context?.medicalHistory || []).some(
    (h: string) =>
      h.toLowerCase().includes('blood thinner') ||
      h.toLowerCase().includes('anticoagulant') ||
      h.toLowerCase().includes('warfarin') ||
      h.toLowerCase().includes('aspirin')
  );

  const hasSnakebite = text.includes('snake') || text.includes('saanp') || text.includes('bitten by snake') || text.includes('bite') || text.includes('fang');
  const hasElectricShock = text.includes('electric') || text.includes('current') || text.includes('shock') || text.includes('wire') || text.includes('electrocution');
  const hasSevereBleeding = text.includes('arterial') || text.includes('spurting') || text.includes('gushing') || text.includes('heavy bleed') || text.includes('khoon') || text.includes('pools of blood') || text.includes('tourniquet') || context?.severeBleeding || (hasBloodThinners && (text.includes('bleed') || text.includes('cut') || text.includes('wound')));
  const isUnconscious = text.includes('unconscious') || text.includes('unresponsive') || text.includes('behoshi') || text.includes('passed out') || text.includes('collapsed') || context?.conscious === false;
  const isNotBreathing = text.includes('not breathing') || text.includes('saans nahi') || text.includes('no pulse') || text.includes('cardiac arrest') || context?.breathing === false;
  const hasAirwayCompromise = text.includes('choking') || text.includes('stridor') || text.includes('gasping') || text.includes('blue lips') || text.includes('cyanosis') || text.includes('wheezing');
  const hasChestPain = text.includes('chest pain') || text.includes('chhati') || text.includes('heart attack') || text.includes('crushing chest');
  const hasFracture = text.includes('broken') || text.includes('fracture') || text.includes('haddi') || text.includes('bone poking') || text.includes('deformed');
  const isWalking = text.includes('walking') || text.includes('standing') || text.includes('talking normally') || context?.walking === true;

  const baseResult: TriageResult = (() => {

  // Snakebite Emergency in India
  if (hasSnakebite) {
    return {
      tag: 'RED',
      tagLabel: 'IMMEDIATE (Priority 1) - SNAKEBITE EMERGENCY',
      category: 'Toxicology / Envenomation',
      summary: 'Suspected venomous snakebite. Immediate immobilization and emergency hospital transport for Anti-Snake Venom (ASV) required.',
      urgencyRationale: 'Neurotoxic and hemotoxic snake venoms can cause respiratory paralysis or severe internal bleeding within 30-60 minutes.',
      primaryAction: 'Call 112 immediately. Keep the patient completely still and calm; immobilize the bitten limb like a fracture.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Call 112 / 108 Emergency for Hospital with ASV',
          instruction: 'Arrange immediate transport to the nearest government or district hospital that stocks Anti-Snake Venom (ASV).',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Keep Patient Still and Calm',
          instruction: 'Do not allow the patient to walk or run. Movement accelerates venom spread through the lymphatic system.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Immobilize Bitten Limb with Splint/Bandage',
          instruction: 'Apply a broad crepe or cloth bandage firmly (not too tight, pulse must still be felt) and splint the limb to prevent bending.',
          warning: 'Do NOT tie a tight tourniquet! Tight tourniquets cause gangrene and limb loss.',
          isCritical: true,
        },
        {
          stepNumber: 4,
          title: 'Remove Tight Rings, Bangles & Watch',
          instruction: 'Remove jewelry or tight items immediately before the limb swells.',
          isCritical: false,
        },
      ],
      criticalDoNots: [
        'Do NOT cut or slash the bite area with a blade.',
        'Do NOT attempt to suck venom with your mouth.',
        'Do NOT tie tight ropes or tourniquets that stop blood flow.',
        'Do NOT apply cow dung, herbal paste, or electric shocks.',
      ],
      criticalQuestions: [
        'Can you describe the snake (color, triangular head, hood)?',
        'Is the patient experiencing blurred vision, drooping eyelids, or difficulty swallowing?',
        'Exactly what time did the bite occur?',
      ],
      vitalsToCheck: [
        { parameter: 'Breathing Effort', target: 'Normal / Non-labored', note: 'Drooping eyelids & shallow breaths mean neurotoxic venom' },
        { parameter: 'Swelling / Bleeding', target: 'Mark bite border with pen', note: 'Note progression every 15 minutes' },
        { parameter: 'Pulse', target: '60 - 100 bpm', note: 'Monitor for rapid drop' },
      ],
      responderAudioScript: 'Priority Red. Snakebite emergency. Call 112 immediately. Keep the patient completely still. Do not let them walk. Do not cut or suck the wound. Immobilize the limb with a bandage and get to a hospital with anti-snake venom now.',
      mistReport: {
        mechanism: 'Snake envenomation',
        injuries: 'Puncture fang marks / localized pain and swelling',
        signs: 'Possible ptosis, swelling, pain',
        treatment: 'Limb immobilization, 112 emergency transport initiated, ASV requested',
      },
      recommendedTimerType: 'reassess',
    };
  }

  // Electric Shock
  if (hasElectricShock) {
    return {
      tag: 'RED',
      tagLabel: 'IMMEDIATE (Priority 1) - HIGH VOLTAGE / ELECTRIC SHOCK',
      category: 'Electrical Trauma / Cardiac Arrest Risk',
      summary: 'Electrical shock with risk of lethal cardiac arrhythmia, internal burns, or apnea.',
      urgencyRationale: 'Electric currents disrupt heart rhythm (VFib) and cause silent deep tissue damage.',
      primaryAction: 'Turn off the main electrical supply switch before touching victim. Call 112.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Do NOT Touch Victim Directly Until Power is Cut',
          instruction: 'Turn off main switch/circuit breaker. If not possible, push victim away using a dry wooden stick or PVC pipe. Never use metal or wet items.',
          warning: 'Ensure your own safety first! Do not step in water near live wires.',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Check Responsiveness & Breathing',
          instruction: 'Once power is safe, check if breathing. If not breathing, call 112 and begin chest compressions immediately.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Cover Electrical Burn Sites',
          instruction: 'Check for entry and exit wounds (e.g., hand and foot). Cover with clean, dry cloth. Do not apply ointments.',
          isCritical: false,
        },
      ],
      criticalDoNots: [
        'Do not touch the victim with bare hands while they are in contact with electricity.',
        'Do not use wet objects to separate victim from wire.',
        'Do not apply ice or grease to electrical burns.',
      ],
      criticalQuestions: [
        'Is the main power supply disconnected and safe?',
        'Is the person breathing normally or gasping?',
        'Did they fall from a height due to the shock?',
      ],
      vitalsToCheck: [
        { parameter: 'Breathing / Chest Rise', target: 'Present', note: 'If absent, start hands-only CPR immediately' },
        { parameter: 'Radial Pulse', target: 'Regular', note: 'Arrhythmia is common after shock' },
      ],
      responderAudioScript: 'Priority Red. Ensure electrical power is switched off before touching the patient. Call 112. If not breathing, start CPR compressions in center of chest immediately.',
      mistReport: {
        mechanism: 'Electrical contact / wire shock',
        injuries: 'Suspected electrical injury / cardiac arrhythmia / thermal burns',
        signs: 'Possible unresponsiveness, entry/exit burns',
        treatment: 'Power disconnection, ABC assessment, 112 dispatch',
      },
      recommendedTimerType: 'cpr',
    };
  }

  if (isNotBreathing) {
    return {
      tag: 'RED',
      tagLabel: 'IMMEDIATE (Priority 1) - AIRWAY / CARDIAC ARREST',
      category: 'Airway / Cardiac Arrest',
      summary: 'Patient is unresponsive and not breathing normally. Immediate CPR protocol required.',
      urgencyRationale: 'Cessation of breathing or pulse leads to irreversible brain damage within 4-6 minutes.',
      primaryAction: 'Call 112 immediately and start chest compressions at 100-120 BPM.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Confirm Unresponsiveness & Call 112',
          instruction: 'Tap collarbone firmly, shout "Are you okay?". If no response, put phone on speaker with 112 and send someone for an AED/ambulance.',
          warning: 'Do not delay compressions for pulse checks if not trained.',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Position Patient',
          instruction: 'Place patient on their back on a firm, flat surface (floor or ground).',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Begin High-Quality Chest Compressions',
          instruction: 'Place heel of one hand in center of chest, interlock other hand fingers. Push hard and fast at least 2 inches deep, 100 to 120 beats per minute.',
          warning: 'Allow complete chest recoil between each compression. Do not lean on chest.',
          isCritical: true,
        },
        {
          stepNumber: 4,
          title: 'Apply AED as Soon as Available',
          instruction: 'Turn on AED immediately and follow voice prompts. Do not touch patient during rhythm analysis or shock.',
          isCritical: true,
        },
      ],
      criticalDoNots: [
        'Do not stop compressions for more than 10 seconds.',
        'Do not place pillows under the head.',
        'Do not give water or liquids.',
      ],
      criticalQuestions: [
        'Is someone calling 112 right now on speaker?',
        'Did you see the exact moment they collapsed?',
        'Is the chest rising at all on its own?',
      ],
      vitalsToCheck: [
        { parameter: 'Carotid Pulse', target: 'Check max 10s', note: 'If unsure, assume absent and push hard' },
        { parameter: 'Airway', target: 'Clear', note: 'Check for visible solid obstruction before breath' },
        { parameter: 'Pupils', target: 'Reactive', note: 'Check for symmetry and responsiveness' },
      ],
      responderAudioScript: 'Emergency Priority Red. Call 112 immediately. Put phone on speaker. Start hard and fast chest compressions in center of chest now, at 100 to 120 beats per minute.',
      mistReport: {
        mechanism: 'Sudden collapse / loss of consciousness',
        injuries: 'Suspected cardiac arrest / respiratory arrest',
        signs: 'Unresponsive, absent normal breathing, no carotid pulse confirmed',
        treatment: 'Hands-only CPR initiated, 112 dispatched',
      },
      recommendedTimerType: 'cpr',
    };
  }

  if (hasSevereBleeding) {
    return {
      tag: 'RED',
      tagLabel: 'IMMEDIATE (Priority 1) - CRITICAL HEMORRHAGE',
      category: 'Circulation / Hemorrhage',
      summary: 'Severe uncontrolled bleeding with risk of hypovolemic shock.',
      urgencyRationale: 'Exsanguinating arterial hemorrhage can be fatal in under 3 minutes.',
      primaryAction: 'Call 112. Apply direct, continuous two-handed pressure directly on the bleeding source.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Direct Pressure with Clean Cloth',
          instruction: 'Take clean cloth, gamcha, sterile gauze, or clothing. Place directly over the bleeding site and push hard with your full body weight.',
          warning: 'Do not release pressure to check the wound! Keep constant pressure.',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Pack Wound if Deep (Arms/Legs/Groin)',
          instruction: 'If wound is deep, pack cloth firmly into the wound cavity until packed tight, then apply strong pressure on top.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Apply Tourniquet if on Arm or Leg',
          instruction: 'If bleeding from arm or leg does not stop, tie a broad cloth or tourniquet 2 to 3 inches above wound (never directly on a joint). Tighten until bleeding stops.',
          warning: 'Never loosen or remove a tourniquet once applied; only hospital trauma staff should remove it.',
          isCritical: true,
        },
        {
          stepNumber: 4,
          title: 'Prevent Shock & Keep Warm',
          instruction: 'Lay patient flat, elevate legs slightly, and cover with sheet or blanket.',
          isCritical: false,
        },
      ],
      criticalDoNots: [
        'Do not remove blood-soaked bandages — add more on top.',
        'Do not apply a tourniquet directly over a joint (elbow/knee).',
        'Do not remove any impaled object.',
      ],
      criticalQuestions: [
        'Is blood spurting like a heartbeat or pooling rapidly?',
        'Is the bleeding on an arm, leg, neck, or torso?',
        'Is the patient feeling cold, clammy, or dizzy?',
      ],
      vitalsToCheck: [
        { parameter: 'Perfusion / Capillary Refill', target: '< 2 seconds', note: 'Check fingernail bed' },
        { parameter: 'Radial Pulse', target: 'Present & strong', note: 'Weak or rapid pulse indicates impending shock' },
        { parameter: 'Mental Status', target: 'Alert & Oriented', note: 'Confusion indicates brain hypoperfusion' },
      ],
      responderAudioScript: 'Priority Red. Heavy bleeding detected. Call 112. Push down hard with both hands on the bleeding point using clean cloth. Do not lift up.',
      mistReport: {
        mechanism: 'Acute penetrating or blunt trauma with severe vessel laceration',
        injuries: 'Severe active hemorrhage',
        signs: 'Rapid bleeding, potential pale/clammy skin, rapid weak pulse',
        treatment: 'Continuous two-handed direct pressure, wound packing, extremity tourniquet if indicated, 112 call',
      },
      recommendedTimerType: 'bleeding_pressure',
    };
  }

  if (hasAirwayCompromise || isUnconscious || hasChestPain) {
    return {
      tag: 'RED',
      tagLabel: 'IMMEDIATE (Priority 1) - AIRWAY / RESPIRATORY / CARDIAC',
      category: 'Airway / Neurological / Cardiac',
      summary: 'Critical compromised physiological state requiring urgent intervention while 112 is en route.',
      urgencyRationale: 'High probability of rapid deterioration without rapid stabilization.',
      primaryAction: 'Call 112. Maintain open airway, position patient appropriately, and monitor vitals constantly.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Call 112 / 108 Immediately',
          instruction: 'Specify exact location, patient responsiveness, and airway status to dispatch operator.',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Check and Maintain Airway',
          instruction: 'If conscious and choking, administer 5 back blows followed by 5 abdominal thrusts. If unconscious with breathing, place in recovery position (on side) unless spinal injury suspected.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Comfort and Assist with Prescribed Meds',
          instruction: 'If chest pain and patient is conscious, have them rest quietly. If severe asthma or allergy, assist with inhaler.',
          warning: 'Do not give water or food if patient is drowsy or choking.',
          isCritical: true,
        },
      ],
      criticalDoNots: [
        'Do not give food or drink.',
        'Do not leave the patient unattended.',
        'Do not let patient walk or exert themselves.',
      ],
      criticalQuestions: [
        'Is the patient capable of speaking in full sentences?',
        'Are they having chest pressure spreading to left arm or jaw?',
        'Is there any swelling around the lips or tongue?',
      ],
      vitalsToCheck: [
        { parameter: 'Respiration Rate', target: '12 - 20 breaths/min', note: '> 30 indicates critical respiratory distress' },
        { parameter: 'Skin Color', target: 'Normal / Warm', note: 'Pale, blue, or clammy skin is a danger sign' },
        { parameter: 'AVPU Scale', target: 'Alert', note: 'Alert, Voice, Pain, or Unresponsive' },
      ],
      responderAudioScript: 'Priority Red. Ensure the airway is open. Call 112 immediately. Keep the patient sitting or lying down comfortably. Do not give any liquids.',
      mistReport: {
        mechanism: 'Acute medical or airway compromise',
        injuries: 'Suspected respiratory compromise / anaphylaxis / cardiac ischemia',
        signs: 'Severe dyspnea, altered level of consciousness, distress',
        treatment: 'Position of comfort, high-priority 112 dispatch, monitoring',
      },
      recommendedTimerType: 'reassess',
    };
  }

  if (hasFracture || text.includes('burn') || text.includes('deep cut') || text.includes('dislocated') || text.includes('severe pain')) {
    return {
      tag: 'YELLOW',
      tagLabel: 'DELAYED (Priority 2) - SERIOUS / URGENT',
      category: 'Musculoskeletal / Trauma',
      summary: 'Significant injury requiring professional emergency care, but patient is hemodynamically stable.',
      urgencyRationale: 'Patient is conscious, breathing adequately, with controlled or moderate bleeding.',
      primaryAction: 'Immobilize injured region in position found and apply cold pack/dressings.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Control Any Local Bleeding',
          instruction: 'Apply gentle direct pressure with a clean sterile dressing around the injury.',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Immobilize Joint and Limb',
          instruction: 'Do NOT try to push bones back or straighten deformity. Support the limb with rolled towels, splint, or clothing in position found.',
          warning: 'Do not manipulate deformed joints or bones.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Check Circulation Distal to Injury',
          instruction: 'Check pulse below the injury (e.g. wrist for arm, foot for leg) and feel if fingers/toes are warm and pink. If pale or cold, report to 911.',
          isCritical: false,
        },
        {
          stepNumber: 4,
          title: 'Elevate & Apply Cold (if closed injury)',
          instruction: 'If skin is not broken and no spine injury, gently elevate and apply wrapped ice for 15-20 minutes.',
          isCritical: false,
        },
      ],
      criticalDoNots: [
        'Do not attempt to realign deformed bones or joints.',
        'Do not apply ice directly to bare skin.',
        'Do not let patient bear weight on the injured limb.',
      ],
      criticalQuestions: [
        'Can the patient feel their fingers or toes on the injured side?',
        'Is any bone protruding through the skin (compound fracture)?',
        'Has the patient hit their head or experienced neck pain?',
      ],
      vitalsToCheck: [
        { parameter: 'Distal Pulse', target: 'Present & strong', note: 'Loss of pulse distal to fracture is an immediate emergency' },
        { parameter: 'Capillary Refill', target: '< 2 seconds', note: 'Check nailbed of injured limb' },
        { parameter: 'Sensation', target: 'Intact', note: 'Ask if numbness or tingling is present' },
      ],
      responderAudioScript: 'Priority Yellow. Keep the injured area completely still in the position found. Do not try to straighten or push on bones. Check if fingers or toes feel warm.',
      mistReport: {
        mechanism: 'Blunt trauma / fall / impact',
        injuries: 'Suspected fracture / dislocation / severe soft tissue injury',
        signs: 'Severe localized pain, swelling, deformity, intact distal pulses',
        treatment: 'Immobilization, wound coverage, cold application, monitoring',
      },
      recommendedTimerType: 'reassess',
    };
  }

  // Otherwise, default to GREEN (Minimal) if walking or minor symptoms
  return {
    tag: 'GREEN',
    tagLabel: 'MINIMAL (Priority 3) - WALKING WOUNDED',
    category: 'Minor Trauma / Non-Critical',
    summary: 'Minor injury or symptoms. Patient is alert, ambulatory, and physiologically stable.',
    urgencyRationale: 'Patient is walking, airway intact, breathing normally, with minor or localized complaints.',
    primaryAction: 'Cleanse wound with clean water, apply sterile dressing, and sit in a safe resting area.',
    immediateFirstAidSteps: [
      {
        stepNumber: 1,
        title: 'Cleanse and Protect',
        instruction: 'Rinse minor cuts with clean running water or saline. Gently pat dry with clean gauze.',
        isCritical: false,
      },
      {
        stepNumber: 2,
        title: 'Apply Clean Bandage',
        instruction: 'Cover with sterile gauze or adhesive bandage to prevent contamination.',
        isCritical: false,
      },
      {
        stepNumber: 3,
        title: 'Rest in Safe Area',
        instruction: 'Guide patient to sit in a calm, shaded area away from hazards and keep hydrated if tolerated.',
        isCritical: false,
      },
    ],
    criticalDoNots: [
      'Do not apply butter, grease, or unverified home remedies to burns or wounds.',
      'Do not leave contaminated debris inside open cuts.',
    ],
    criticalQuestions: [
      'Are they experiencing any dizziness, shortness of breath, or chest discomfort?',
      'When was their last tetanus booster shot?',
    ],
    vitalsToCheck: [
      { parameter: 'Mobility', target: 'Ambulatory', note: 'Able to walk without assistance' },
      { parameter: 'Mental Status', target: 'Alert & Oriented x 4', note: 'Knows person, place, time, event' },
    ],
    responderAudioScript: 'Priority Green. Condition is stable. Clean the area with clean water, apply a clean bandage, and rest in a safe spot away from hazards.',
    mistReport: {
      mechanism: 'Minor incident / slip / abrasion',
      injuries: 'Minor abrasions or localized contusions',
      signs: 'Vital signs stable, fully ambulatory and oriented',
      treatment: 'Basic wound cleansing, dressing applied, observation',
    },
    recommendedTimerType: 'none',
  };
})();

  const alerts = generateServerMedicalAlerts(context?.medicalHistory || []);
  if (alerts.length > 0) {
    baseResult.medicalAlerts = alerts;
    baseResult.mistReport.treatment = `${baseResult.mistReport.treatment} [Medical History: ${context?.medicalHistory?.join(', ')}]`;
  }
  return baseResult;
}

// POST /api/triage endpoint
app.post('/api/triage', async (req: Request, res: Response) => {
  try {
    const { message, history = [], patientContext = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'A valid symptom or incident description is required.' });
    }

    const trimmedMessage = message.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // Build context summary string
    const contextDetails = [
      patientContext.ageGroup ? `Patient age/category: ${patientContext.ageGroup}` : '',
      patientContext.conscious !== undefined ? `Consciousness: ${patientContext.conscious ? 'Conscious' : 'Unconscious/Unresponsive'}` : '',
      patientContext.breathing !== undefined ? `Breathing: ${patientContext.breathing ? 'Normal/Present' : 'Not breathing / Labored / Absent'}` : '',
      patientContext.severeBleeding !== undefined ? `Severe Bleeding: ${patientContext.severeBleeding ? 'YES - Profuse bleeding present' : 'No severe bleeding'}` : '',
      patientContext.walking !== undefined ? `Mobility: ${patientContext.walking ? 'Ambulatory (able to walk)' : 'Non-ambulatory'}` : '',
      patientContext.medicalHistory && patientContext.medicalHistory.length > 0 ? `Known Medical History / Allergies / Chronic Conditions: ${patientContext.medicalHistory.join(', ')}` : '',
      patientContext.location ? `Location / Hazard: ${patientContext.location}` : '',
    ].filter(Boolean).join('; ');

    const promptText = `FIRST RESPONDER TRIAGE REQUEST:
Incident Description: "${trimmedMessage}"
${contextDetails ? `Reported Patient Parameters: [${contextDetails}]` : ''}
${history && history.length > 0 ? `Prior Interaction History:\n${history.map((h: any) => `${h.role}: ${h.text}`).join('\n')}` : ''}

Classify triage priority using START/SALT protocols and produce comprehensive JSON matching schema.`;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Using high-reliability local triage rule engine.');
      const localResult = evaluateLocalRuleTriage(trimmedMessage, patientContext);
      return res.json({ result: localResult, source: 'offline_rule_engine' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tag: {
                type: Type.STRING,
                description: 'Triage tag: RED (Immediate), YELLOW (Delayed), GREEN (Minimal), or BLACK (Expectant)',
              },
              tagLabel: {
                type: Type.STRING,
                description: 'Short high-visibility label, e.g. "IMMEDIATE (Priority 1) - SEVERE HEMORRHAGE"',
              },
              category: {
                type: Type.STRING,
                description: 'Clinical category, e.g. "Airway/Breathing", "Hemorrhage/Circulation", "Trauma", "Cardiac"',
              },
              summary: {
                type: Type.STRING,
                description: 'Crisp 1-2 sentence medical impression of what is happening.',
              },
              urgencyRationale: {
                type: Type.STRING,
                description: 'Why this triage tag was chosen according to START/SALT criteria.',
              },
              primaryAction: {
                type: Type.STRING,
                description: 'The single most urgent physical action that must be taken right now.',
              },
              immediateFirstAidSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                    warning: { type: Type.STRING },
                    isCritical: { type: Type.BOOLEAN },
                  },
                  required: ['stepNumber', 'title', 'instruction', 'isCritical'],
                },
                description: 'Ordered checklist of first-aid actions to perform while help is en route.',
              },
              criticalDoNots: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Common dangerous mistakes to avoid (e.g. "Do not pull out knife", "Do not give water").',
              },
              criticalQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 quick questions the responder should assess right away.',
              },
              vitalsToCheck: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    parameter: { type: Type.STRING },
                    target: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ['parameter', 'target', 'note'],
                },
                description: 'Vital signs to assess (Breathing rate, Capillary refill, Radial pulse, AVPU).',
              },
              responderAudioScript: {
                type: Type.STRING,
                description: 'Brief, calm, declarative spoken directions suitable for text-to-speech hands-free guidance.',
              },
              mistReport: {
                type: Type.OBJECT,
                properties: {
                  mechanism: { type: Type.STRING },
                  injuries: { type: Type.STRING },
                  signs: { type: Type.STRING },
                  treatment: { type: Type.STRING },
                },
                required: ['mechanism', 'injuries', 'signs', 'treatment'],
                description: 'Standard MIST paramedic handover report.',
              },
              recommendedTimerType: {
                type: Type.STRING,
                description: 'One of: "cpr", "bleeding_pressure", "tourniquet", "reassess", "none"',
              },
              medicalAlerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Special alerts, contraindications, or warnings based on reported allergies, blood thinners, or chronic medical conditions.',
              },
            },
            required: [
              'tag',
              'tagLabel',
              'category',
              'summary',
              'urgencyRationale',
              'primaryAction',
              'immediateFirstAidSteps',
              'criticalDoNots',
              'criticalQuestions',
              'vitalsToCheck',
              'responderAudioScript',
              'mistReport',
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const parsed: TriageResult = JSON.parse(responseText);

      // Validate tag constraint
      const validTags = ['RED', 'YELLOW', 'GREEN', 'BLACK'];
      if (!validTags.includes(parsed.tag)) {
        parsed.tag = 'YELLOW';
      }

      return res.json({ result: parsed, source: 'gemini-3.8-flash' });
    } catch (modelError: any) {
      console.error('Error invoking Gemini model, falling back to local clinical rules:', modelError);
      const fallbackResult = evaluateLocalRuleTriage(trimmedMessage, patientContext);
      return res.json({ result: fallbackResult, source: 'fallback_rule_engine', warning: modelError?.message });
    }
  } catch (error: any) {
    console.error('Server error in /api/triage:', error);
    return res.status(500).json({ error: 'Internal server error while evaluating triage.' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    model: 'gemini-3.8-flash',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Dev vs Production Setup for Vite
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`RescueTriage AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
