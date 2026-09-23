/**
 * Offline Emergency Triage Engine for Remote & Low-Connectivity Areas
 * Based on International START / SALT Protocols and Indian Emergency Guidelines (SOS 112).
 * Runs completely in-browser without any internet connection.
 */

import { TriageResult, PatientContext } from '../types/triage';

export const CORE_OFFLINE_PROTOCOLS = [
  {
    id: 'snakebite',
    name: 'Snakebite Emergency (Anti-Snake Venom)',
    tag: 'RED',
    summary: 'Immobilize limb like a fracture. Call 112 for Anti-Snake Venom (ASV). Do NOT cut, suck, or tie tight tourniquets.',
  },
  {
    id: 'cardiac_arrest',
    name: 'Cardiac Arrest / Apnea',
    tag: 'RED',
    summary: 'Unresponsive and not breathing. Call 112 on speaker. Push hard and fast in center of chest at 100-120 BPM.',
  },
  {
    id: 'arterial_hemorrhage',
    name: 'Critical Arterial Bleeding',
    tag: 'RED',
    summary: 'Continuous two-handed direct pressure on wound using clean cloth. Pack deep wounds. Apply tourniquet on limbs 2-3 inches above wound.',
  },
  {
    id: 'electric_shock',
    name: 'Electric Shock / Loose Wire',
    tag: 'RED',
    summary: 'Turn off main power or separate victim with dry wooden stick before touching! Check breathing and call 112.',
  },
  {
    id: 'choking',
    name: 'Severe Choking / Airway Obstruction',
    tag: 'RED',
    summary: '5 back blows between shoulder blades followed by 5 abdominal thrusts (Heimlich maneuver).',
  },
  {
    id: 'fracture',
    name: 'Bone Fracture / Trauma',
    tag: 'YELLOW',
    summary: 'Immobilize in position found with splint or rolled cloth. Check distal pulse and fingers. Do NOT straighten broken bones.',
  },
  {
    id: 'heatstroke',
    name: 'Heat Stroke / Collapse',
    tag: 'YELLOW',
    summary: 'Move to shade, sprinkle cool water, fan vigorously, loosen clothing. Call 112 if confused or drowsy.',
  },
  {
    id: 'minor_wound',
    name: 'Minor Road Rash / Cut / Sprain',
    tag: 'GREEN',
    summary: 'Clean gently with drinkable water, cover with clean bandage, rest and elevate limb if sprained.',
  },
];

// Cache protocols to localStorage on load
export function cacheCoreProtocols(): void {
  try {
    localStorage.setItem('rescuetriage_protocols_v1', JSON.stringify(CORE_OFFLINE_PROTOCOLS));
  } catch (err) {
    console.warn('LocalStorage cache error:', err);
  }
}

export function evaluateOfflineTriage(userInput: string, context?: PatientContext): TriageResult {
  const text = userInput.toLowerCase();

  const hasSnakebite =
    text.includes('snake') ||
    text.includes('saanp') ||
    text.includes('bitten by snake') ||
    text.includes('bite') ||
    text.includes('fang');

  const hasElectricShock =
    text.includes('electric') ||
    text.includes('current') ||
    text.includes('shock') ||
    text.includes('wire') ||
    text.includes('bijli') ||
    text.includes('electrocution');

  const hasSevereBleeding =
    text.includes('arterial') ||
    text.includes('spurting') ||
    text.includes('gushing') ||
    text.includes('heavy bleed') ||
    text.includes('khoon') ||
    text.includes('pools of blood') ||
    text.includes('tourniquet') ||
    context?.severeBleeding;

  const isUnconscious =
    text.includes('unconscious') ||
    text.includes('unresponsive') ||
    text.includes('behoshi') ||
    text.includes('passed out') ||
    text.includes('collapsed') ||
    context?.conscious === false;

  const isNotBreathing =
    text.includes('not breathing') ||
    text.includes('saans nahi') ||
    text.includes('no pulse') ||
    text.includes('cardiac arrest') ||
    context?.breathing === false;

  const hasAirwayCompromise =
    text.includes('choking') ||
    text.includes('stridor') ||
    text.includes('gasping') ||
    text.includes('blue lips') ||
    text.includes('cyanosis') ||
    text.includes('wheezing');

  const hasChestPain =
    text.includes('chest pain') ||
    text.includes('chhati') ||
    text.includes('heart attack') ||
    text.includes('crushing chest');

  const hasFracture =
    text.includes('broken') ||
    text.includes('fracture') ||
    text.includes('haddi') ||
    text.includes('bone poking') ||
    text.includes('deformed');

  const isWalking =
    text.includes('walking') ||
    text.includes('standing') ||
    text.includes('talking normally') ||
    context?.walking === true;

  // 1. SNAKEBITE (Common in rural/remote India)
  if (hasSnakebite) {
    return {
      tag: 'RED',
      tagLabel: 'IMMEDIATE (Priority 1) - SNAKEBITE EMERGENCY',
      category: 'Toxicology / Snake Envenomation',
      summary: 'Suspected venomous snakebite. Immediate immobilization and emergency transport for Anti-Snake Venom (ASV) required.',
      urgencyRationale: 'Neurotoxic or hemotoxic venom can cause respiratory paralysis or systemic bleeding in 30-60 minutes.',
      primaryAction: 'Call 112 immediately. Keep victim completely still and calm; immobilize the bitten limb like a fracture.',
      immediateFirstAidSteps: [
        {
          stepNumber: 1,
          title: 'Call 112 / 108 Emergency for Hospital with ASV',
          instruction: 'Arrange immediate transport to nearest district or civil hospital equipped with Anti-Snake Venom (ASV).',
          isCritical: true,
        },
        {
          stepNumber: 2,
          title: 'Keep Patient Completely Still & Calm',
          instruction: 'Do not allow the patient to walk or panic. Physical exertion speeds venom movement through the body.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Immobilize Bitten Limb with Splint/Bandage',
          instruction: 'Wrap a broad cloth or crepe bandage firmly (firm, but you must still feel a pulse). Splint the limb so the joints cannot bend.',
          warning: 'Do NOT tie a tight tourniquet! Tight tourniquets cause gangrene and limb amputation.',
          isCritical: true,
        },
        {
          stepNumber: 4,
          title: 'Remove Jewelry, Rings, or Tight Clothes',
          instruction: 'Remove bangles, rings, and shoes right now before the limb begins swelling.',
          isCritical: false,
        },
      ],
      criticalDoNots: [
        'Do NOT cut or slash the bite area with a blade.',
        'Do NOT attempt to suck venom with your mouth.',
        'Do NOT tie tight ropes or tourniquets that stop pulse.',
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

  // 2. ELECTRIC SHOCK
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

  // 3. CARDIAC ARREST / UNRESPONSIVE APNEA
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

  // 4. MASSIVE BLEEDING / ARTERIAL HEMORRHAGE
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

  // 5. AIRWAY / CHEST PAIN / UNCONSCIOUS
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

  // 6. FRACTURE / BURNS / SEVERE PAIN
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
          warning: 'Do not attempt to realign broken bones.',
          isCritical: true,
        },
        {
          stepNumber: 3,
          title: 'Check Circulation Below Injury',
          instruction: 'Check fingernails/toenails for warmth and color refill. Ensure pulse is present distal to injury.',
          isCritical: false,
        },
      ],
      criticalDoNots: [
        'Do not attempt bone reduction or straightening.',
        'Do not apply heat to acute fractures or burns.',
        'Do not burst burn blisters.',
      ],
      criticalQuestions: [
        'Can the patient feel their fingers or toes past the injury?',
        'Is the skin pale or bluish past the break?',
        'Did this happen from a high-velocity impact or fall?',
      ],
      vitalsToCheck: [
        { parameter: 'Distal Pulse', target: 'Present & palpable', note: 'Loss of distal pulse upgrades priority to RED' },
        { parameter: 'Sensation', target: 'Intact', note: 'Numbness indicates nerve or vascular compromise' },
      ],
      responderAudioScript: 'Priority Yellow. Keep the limb completely still in the position it was found. Do not try to straighten it. Support it with padding and prepare for transport.',
      mistReport: {
        mechanism: 'Blunt force trauma or thermal injury',
        injuries: 'Suspected fracture / localized burn or laceration',
        signs: 'Severe localized tenderness, deformity, intact distal vitals',
        treatment: 'Immobilization in position found, wound coverage, analgesia prep',
      },
      recommendedTimerType: 'reassess',
    };
  }

  // 7. MINIMAL / AMBULATORY (GREEN)
  return {
    tag: 'GREEN',
    tagLabel: 'MINIMAL (Priority 3) - WALKING WOUNDED',
    category: 'Minor Trauma / Ambulatory',
    summary: 'Minor injuries with stable vital signs. Patient is ambulatory and capable of self-care with basic first aid.',
    urgencyRationale: 'No compromise to airway, breathing, circulation, or cognitive orientation.',
    primaryAction: 'Direct to clean designated area, cleanse wound gently with clean water, and bandage.',
    immediateFirstAidSteps: [
      {
        stepNumber: 1,
        title: 'Cleanse Wound Surface',
        instruction: 'Flush minor cuts or road rash with clean running water to remove dirt.',
        isCritical: false,
      },
      {
        stepNumber: 2,
        title: 'Apply Clean Dressing',
        instruction: 'Cover with clean gauze or adhesive bandage.',
        isCritical: false,
      },
      {
        stepNumber: 3,
        title: 'Rest & Elevate if Sprained',
        instruction: 'If ankle or wrist is sprained, apply cold compress (ice wrapped in cloth) and elevate.',
        isCritical: false,
      },
    ],
    criticalDoNots: [
      'Do not apply harsh chemicals like kerosene or unapproved home remedies.',
      'Do not pick at scabs or debris embedded deeply in skin.',
    ],
    criticalQuestions: [
      'Are they having any dizziness, nausea, or headache?',
      'Has it been more than 5 years since their last Tetanus toxoid shot?',
    ],
    vitalsToCheck: [
      { parameter: 'Mental Alertness', target: 'Alert x 4', note: 'Check for delayed concussion symptoms' },
      { parameter: 'Bleeding', target: 'Controlled / Stopped', note: 'Verify clot stability' },
    ],
    responderAudioScript: 'Priority Green. Minor injury confirmed. Direct the patient to sit quietly. Clean the area with clean water and cover with a sterile bandage.',
    mistReport: {
      mechanism: 'Low-energy trauma / minor scrape',
      injuries: 'Superficial abrasions, mild contusion, or sprain',
      signs: 'Vital signs normal, ambulatory, coherent',
      treatment: 'Basic wound cleansing, light dressing, cold pack',
    },
    recommendedTimerType: 'none',
  };
}
