import type { LlmPort } from '../port';

export class MockLlm implements LlmPort {
  private customResponse?: string;

  constructor(customResponse?: string) {
    this.customResponse = customResponse;
  }

  setResponse(response: string) {
    this.customResponse = response;
  }

  async generate(input: { system: string; input: string }): Promise<string> {
    if (this.customResponse) {
      return this.customResponse;
    }

    // Default triage response
    if (input.system.includes('triage') || input.input.includes('triage')) {
      return JSON.stringify({
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        buyerClaim: 'Customer reports item never arrived after shipping.',
        requestedOutcome: 'refund',
      });
    }

    // Default proposal response
    return JSON.stringify({
      action: 'refund',
      refundAmountCents: 2000,
      policyClauseId: 'P-1',
      rationale: 'Item was lost in transit and amount is within the $25 policy cap.',
      evidenceNarrative: 'Carrier tracking shows parcel has not reached destination.',
    });
  }
}
