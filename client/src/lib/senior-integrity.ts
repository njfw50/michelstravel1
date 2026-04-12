/**
 * Senior Integrity Protection Module
 * 
 * This module ensures the psychological and technical safety of elderly users
 * during the booking and payment flow. It monitors user behavior, 
 * validates state transitions, and manages the voice guide interactions.
 */

export type SeniorIntegrityState = {
  stage: 'details' | 'review' | 'payment' | 'completion';
  isSafe: boolean;
  warnings: string[];
  lastInteractionAt: number;
  voiceConfirmed: boolean;
  cognitionStressLevel: number; // 0 to 10
  passengerReviewStatus: Record<number, boolean>;
};

export const SENIOR_FLOW_GUIDELINES = {
  INACTIVITY_THRESHOLD_MS: 35000, // Reduced to 35 seconds to be more proactive
  STRESS_THRESHOLD: 7,
  REDUNDANT_CORRECTION_LIMIT: 3, 
  VOICE_MANDATORY_STAGES: ['payment', 'review'] as const,
};

export class SeniorIntegrityManager {
  private state: SeniorIntegrityState;
  private onWarning: (msg: string) => void;
  private onStuck: () => void;
  private inactivityTimer: NodeJS.Timeout | null = null;

  constructor(callbacks: { onWarning: (msg: string) => void; onStuck: () => void }) {
    this.state = {
      stage: 'details',
      isSafe: true,
      warnings: [],
      lastInteractionAt: Date.now(),
      voiceConfirmed: false,
      cognitionStressLevel: 0,
      passengerReviewStatus: {},
    };
    this.onWarning = callbacks.onWarning;
    this.onStuck = callbacks.onStuck;
    this.resetInactivityTimer();
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      // Proactive check: don't annoy if they are already done
      if (this.state.stage !== 'completion') {
        this.onStuck();
      }
    }, SENIOR_FLOW_GUIDELINES.INACTIVITY_THRESHOLD_MS);
  }

  public recordInteraction() {
    this.state.lastInteractionAt = Date.now();
    this.resetInactivityTimer();
  }

  public setVoiceConfirmed(confirmed: boolean) {
    this.state.voiceConfirmed = confirmed;
    if (confirmed) {
      this.state.cognitionStressLevel = Math.max(0, this.state.cognitionStressLevel - 2);
    }
  }

  public markPassengerReviewed(index: number) {
    this.state.passengerReviewStatus[index] = true;
  }

  public validateTransition(from: SeniorIntegrityState['stage'], to: SeniorIntegrityState['stage']): boolean {
    // SECURITY NUANCE: Cannot proceed to payment without voice review confirmation in Senior Mode
    if (to === 'payment' || (from === 'details' && to === 'review')) {
      if (!this.state.voiceConfirmed) {
        this.onWarning("Security block: A quick review with Mia is required before proceeding to ensure all details match your documents.");
        return false;
      }
    }
    
    // Safety check for stress
    if (this.state.cognitionStressLevel >= SENIOR_FLOW_GUIDELINES.STRESS_THRESHOLD) {
      this.onWarning("Interaction stress is high. Pausing for a guided review.");
      return false;
    }

    this.state.stage = to;
    return true;
  }

  public reportError(field: string, message: string) {
    this.state.cognitionStressLevel += 1.5; // Weight errors higher
    this.recordInteraction();
    
    if (this.state.cognitionStressLevel >= SENIOR_FLOW_GUIDELINES.STRESS_THRESHOLD) {
      this.onWarning(`We noticed some difficulty with the information. Mia is ready to help you fill these fields correctly.`);
    }
  }

  public getStatus() {
    return { ...this.state };
  }

  public destroy() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  }
}
