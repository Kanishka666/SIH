/**
 * Web Speech API Service
 * Provides synthesized audio confirmation feedback and speech alerts
 * upon completion of OCR label scanning and compliance audits.
 */

import { NormalizedOCRResult, ComplianceResult } from '../types';

export interface SpeechFeedbackOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

const STORAGE_KEY = 'labellens_audio_feedback_enabled';

// Keep reference to prevent garbage collection bugs in Chromium/WebKit
let currentUtterance: SpeechSynthesisUtterance | null = null;
let listeners: Array<(speaking: boolean) => void> = [];

/**
 * Checks whether Web Speech API (speechSynthesis) is supported in current browser.
 */
export function isWebSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Check if audio confirmation feedback is currently enabled by user.
 */
export function isAudioFeedbackEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved === 'true' : true; // Enabled by default
  } catch {
    return true;
  }
}

/**
 * Set audio confirmation feedback enabled/disabled state.
 */
export function setAudioFeedbackEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage restrictions
  }
}

/**
 * Subscribe to speech playing status changes.
 */
export function subscribeSpeakingStatus(listener: (speaking: boolean) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifySpeakingStatus(speaking: boolean) {
  listeners.forEach((l) => {
    try {
      l(speaking);
    } catch (e) {
      console.error('Error in speaking status listener', e);
    }
  });
}

/**
 * Cancels any ongoing speech output.
 */
export function stopSpeech(): void {
  if (!isWebSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    notifySpeakingStatus(false);
  } catch (err) {
    console.warn('Error stopping speech synthesis:', err);
  }
}

/**
 * Checks if speech synthesis is currently active or speaking.
 */
export function isSpeaking(): boolean {
  if (!isWebSpeechSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Picks the most natural English voice available in the browser.
 */
function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (!isWebSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Preference order: Google/Natural English voices, English US/GB/IN, or first English voice
  const preferredNames = [
    'Google UK English Female',
    'Google US English',
    'Samantha',
    'Karen',
    'Daniel',
    'Moira',
    'Microsoft Zira',
    'Natural'
  ];

  for (const name of preferredNames) {
    const found = voices.find((v) => v.name.includes(name) && v.lang.startsWith('en'));
    if (found) return found;
  }

  // Fallback to any English voice
  const englishVoice = voices.find((v) => v.lang.startsWith('en'));
  if (englishVoice) return englishVoice;

  return voices[0] || null;
}

/**
 * Speaks a given text string using the Web Speech API.
 */
export function speakText(text: string, options: SpeechFeedbackOptions = {}): boolean {
  if (!isWebSpeechSupported()) {
    console.warn('Web Speech API is not supported in this browser.');
    return false;
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Workaround for paused state in some browsers
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Configure voice properties
    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = options.rate ?? 1.02; // Slightly lively, professional cadence
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    utterance.onstart = () => {
      notifySpeakingStatus(true);
      options.onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      notifySpeakingStatus(false);
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      // Ignore 'interrupted' or 'canceled' errors when user cancels intentionally
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('SpeechSynthesisUtterance error:', e);
        options.onError?.(e);
      }
      currentUtterance = null;
      notifySpeakingStatus(false);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Failed to trigger Web Speech API:', err);
    notifySpeakingStatus(false);
    return false;
  }
}

/**
 * Builds a clear, professional spoken audio confirmation summarizing
 * the OCR scan results and Legal Metrology compliance findings.
 */
export function constructScanConfirmationMessage(
  ocrResult: NormalizedOCRResult,
  compliance: ComplianceResult
): string {
  const brandName = ocrResult.fields.productBrandName.value?.trim();
  const commodity = brandName ? brandName : 'Packaging label';
  const score = compliance.score;
  const status = compliance.status;

  let message = `Scan complete. Inspected ${commodity}. `;

  if (status === 'APPEARS COMPLIANT') {
    message += `Compliance score is ${score} out of 100. Status: Appears compliant. All mandatory statutory declarations verified.`;
  } else if (status === 'REQUIRES REVIEW') {
    const violationCount = compliance.violations.length;
    const warningCount = compliance.warnings.length;
    message += `Compliance score is ${score} out of 100. Status: Requires review. `;
    if (violationCount > 0 && warningCount > 0) {
      message += `Detected ${violationCount} legal violation${violationCount > 1 ? 's' : ''} and ${warningCount} warning${warningCount > 1 ? 's' : ''}.`;
    } else if (violationCount > 0) {
      message += `Detected ${violationCount} legal violation${violationCount > 1 ? 's' : ''}.`;
    } else if (warningCount > 0) {
      message += `Detected ${warningCount} advisory warning${warningCount > 1 ? 's' : ''}.`;
    }
  } else {
    const violationCount = compliance.violations.length;
    message += `Compliance score is ${score} out of 100. Status: Potentially non-compliant. Found ${violationCount} statutory violation${violationCount > 1 ? 's' : ''} under Legal Metrology Rules.`;
  }

  return message;
}

/**
 * Play a subtle, professional success chime using Web Audio API.
 * Provides tactile audio feedback without being intrusive.
 */
export function playSuccessChime(): void {
  if (!isAudioFeedbackEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Create a pleasant two-tone chime (523.25 Hz [C5] -> 659.25 Hz [E5])
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now);
    osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);

    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 600);
  } catch (err) {
    console.warn('Web Audio API chime error:', err);
  }
}

/**
 * Provides audio confirmation feedback once an OCR scan finishes processing.
 * Respects user's mute/audio settings unless forcePlay is true.
 */
export function playScanConfirmationAudio(
  ocrResult: NormalizedOCRResult,
  compliance: ComplianceResult,
  options: { forcePlay?: boolean } & SpeechFeedbackOptions = {}
): boolean {
  if (!options.forcePlay && !isAudioFeedbackEnabled()) {
    return false;
  }

  // Play subtle tactile success chime
  playSuccessChime();

  const message = constructScanConfirmationMessage(ocrResult, compliance);
  return speakText(message, options);
}
