import { POLICY } from './policy';

export interface RiskResult {
  blocked: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
}

export function checkInput(text: string): RiskResult {
  for (const pattern of POLICY.hardBlock) {
    if (pattern.test(text)) {
      return { blocked: true, reason: 'Permintaan melanggar policy keamanan Zesta.', severity: 'high' };
    }
  }
  return { blocked: false, severity: 'low' };
}

export function checkOutput(text: string): RiskResult {
  // hook untuk filter output (PII, kredensial, dsb.)
  return { blocked: false, severity: 'low' };
}
