import { TriageTag } from '../types/triage';

/**
 * Tactical haptic feedback utility for first responder emergency interactions.
 * Uses navigator.vibrate() where supported to give immediate tactile confirmation
 * even when wearing gloves or operating in noisy emergency field scenes.
 */

export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(pattern: number | number[]): boolean {
  if (!isHapticsSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch (err) {
    return false;
  }
}

/**
 * Distinctive tactile vibration based on triage classification urgency:
 * - RED: Urgent multi-burst pulse alerting first responder to immediate life threat
 * - YELLOW: Moderate double pulse for delayed urgent transport
 * - GREEN: Single gentle pulse for walking wounded
 * - BLACK: Single deep pulse for expectant
 */
export function triggerTriageVibration(tag: TriageTag): void {
  switch (tag) {
    case 'RED':
      vibrate([120, 60, 120, 60, 240]);
      break;
    case 'YELLOW':
      vibrate([80, 60, 80]);
      break;
    case 'GREEN':
      vibrate([60]);
      break;
    case 'BLACK':
      vibrate([200]);
      break;
    default:
      vibrate([60]);
  }
}

/**
 * Urgent heavy haptic burst when initiating emergency SOS 112 / 108 dispatch
 */
export function triggerSOSVibration(): void {
  vibrate([150, 70, 150, 70, 300]);
}

/**
 * Crisp single tap when voice recording begins
 */
export function triggerVoiceStartVibration(): void {
  vibrate([45]);
}

/**
 * Tactile double tap when voice recording stops
 */
export function triggerVoiceStopVibration(): void {
  vibrate([30, 40, 30]);
}

/**
 * Light tactile feedback when completing a first-aid action step
 */
export function triggerStepCompleteVibration(): void {
  vibrate([35]);
}

/**
 * Distinct confirmation when logging tourniquet time
 */
export function triggerTourniquetLogVibration(): void {
  vibrate([70, 50, 70]);
}
