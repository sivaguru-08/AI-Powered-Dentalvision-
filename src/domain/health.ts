import type { Finding, HealthScore, Tooth, ToothStatus } from './models';

/**
 * Simulated scoring rules. These are illustrative demo heuristics only and are
 * NOT a validated clinical index.
 */

export const HEALTH_DIMENSIONS: { key: keyof Omit<HealthScore, 'overall'>; label: string }[] = [
  { key: 'structuralIntegrity', label: 'Structural Integrity' },
  { key: 'cariesRisk', label: 'Caries Risk' },
  { key: 'rootCondition', label: 'Root Condition' },
  { key: 'surroundingBone', label: 'Surrounding Bone' },
  { key: 'clinicalStatus', label: 'Clinical Status' },
];

export function overallFromDimensions(d: Omit<HealthScore, 'overall'>): number {
  const values = HEALTH_DIMENSIONS.map((dim) => d[dim.key]);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function deriveStatus(healthIndex: number | null, finding: Finding | null): ToothStatus {
  if (healthIndex == null) return 'unknown';
  if (finding) {
    if (finding.severity === 'Severe' || healthIndex < 65) return 'priority';
    return 'attention';
  }
  return healthIndex < 80 ? 'attention' : 'healthy';
}

/**
 * Demo Dental Health Index for a whole mouth: the mean of assessed teeth,
 * minus a penalty per finding weighted by severity.
 */
export function dentalHealthIndex(teeth: Tooth[]): number {
  const assessed = teeth.filter((t) => t.healthIndex != null);
  if (!assessed.length) return 0;
  const mean = assessed.reduce((a, t) => a + (t.healthIndex ?? 0), 0) / assessed.length;
  const penalty = assessed.reduce((a, t) => {
    if (!t.finding) return a;
    return a + ({ Mild: 2.5, Moderate: 4.5, Severe: 7 } as const)[t.finding.severity];
  }, 0);
  return Math.max(0, Math.min(100, Math.round(mean - penalty)));
}

export function statusLabel(status: ToothStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'attention':
      return 'Needs Attention';
    case 'priority':
      return 'Priority';
    default:
      return 'Not Assessed';
  }
}

export function scoreBand(score: number): ToothStatus {
  if (score >= 85) return 'healthy';
  if (score >= 65) return 'attention';
  return 'priority';
}
