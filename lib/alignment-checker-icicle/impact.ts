/**
 * Impact calculation layer: impactScore, priorityScore, impactBadges per node.
 * Uses CountryObjective linkages for strategic weight calculation.
 */

import type {
  AlignmentSnapshot,
  IcicleNode,
  CountryObjective,
} from './types';

const PRIORITY_WEIGHTS = { riskDensity: 0.55, trend: 0.15, impact: 0.3 };
const IMPACT_BADGE_TEMPLATES: ((n?: number) => string)[] = [
  (n = 0) => `Impacts ${n} revenue-linked KPI${n > 1 ? 's' : ''}`,
  (n = 0) => `Threatens ${n} group-level objective${n > 1 ? 's' : ''}`,
  () => 'Drives Customer Satisfaction target risk',
  () => 'EBITDA objective at risk',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function normalizePositive(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const t = (value - min) / (max - min);
  return Math.max(0, Math.min(1, t));
}

export interface ImpactResult {
  impactScore: number;
  impactBadges: string[];
  priorityScore: number;
}

function objectiveImpactWeight(
  obj: CountryObjective,
  current: AlignmentSnapshot,
): number {
  if (obj.status !== 'red' && obj.status !== 'yellow') return 0;
  let w = 0;
  const kpis = current.kpis ?? [];
  const strat = current.strategicObjectives ?? [];
  for (const kid of obj.connectedKpiIds ?? []) {
    const k = kpis.find((x) => x.id === kid);
    if (k) w += k.strategicWeight ?? 1;
  }
  for (const sid of obj.connectedStrategicObjectiveIds ?? []) {
    const s = strat.find((x) => x.id === sid);
    if (s) w += s.importanceWeight ?? 1;
  }
  return w;
}

export function computeImpactAndPriority(
  nodes: IcicleNode[],
  current: AlignmentSnapshot,
  _previous: AlignmentSnapshot
): Map<string, ImpactResult> {
  const deltas = nodes.map((n) => n.deltaRiskScore);
  const minD = Math.min(...deltas, 0);
  const maxD = Math.max(...deltas, 0);
  let maxImpact = 0;
  const impactByNode = new Map<string, { impactScore: number; kpiCount: number; stratCount: number }>();

  for (const node of nodes) {
    const objectiveIds = node.objectiveIds ?? [];
    let branchImpact = 0;
    let kpiLinks = 0;
    let stratLinks = 0;
    for (const oid of objectiveIds) {
      const o = current.countryObjectives.find((x) => x.id === oid);
      if (!o) continue;
      const w = objectiveImpactWeight(o, current);
      if (w > 0 && (o.status === 'red' || o.status === 'yellow')) {
        branchImpact += w;
      }
      for (const kid of o.connectedKpiIds ?? []) {
        if (current.kpis?.some((k) => k.id === kid)) kpiLinks++;
      }
      for (const sid of o.connectedStrategicObjectiveIds ?? []) {
        if (current.strategicObjectives?.some((s) => s.id === sid)) stratLinks++;
      }
    }
    maxImpact = Math.max(maxImpact, branchImpact);
    impactByNode.set(node.id, { impactScore: branchImpact, kpiCount: kpiLinks, stratCount: stratLinks });
  }

  const results = new Map<string, ImpactResult>();
  for (const node of nodes) {
    const raw = impactByNode.get(node.id);
    const impactRaw = raw?.impactScore ?? 0;
    const impactNorm = maxImpact > 0 ? impactRaw / maxImpact : 0;
    const deltaNorm = normalizePositive(node.deltaRiskScore, minD, maxD);
    const priorityScore =
      node.riskDensity * PRIORITY_WEIGHTS.riskDensity +
      deltaNorm * PRIORITY_WEIGHTS.trend +
      impactNorm * PRIORITY_WEIGHTS.impact;

    const badges: string[] = [];
    if (raw && (raw.kpiCount > 0 || raw.stratCount > 0)) {
      const seed = hash(node.id);
      if (raw.kpiCount > 0) badges.push(IMPACT_BADGE_TEMPLATES[0](Math.min(raw.kpiCount, 3)));
      if (raw.stratCount > 0 && badges.length < 2) badges.push(IMPACT_BADGE_TEMPLATES[1](Math.min(raw.stratCount, 2)));
      if (badges.length < 2 && impactNorm > 0.5) badges.push(IMPACT_BADGE_TEMPLATES[(seed % 2) + 2]());
    }

    results.set(node.id, {
      impactScore: impactNorm,
      impactBadges: badges.slice(0, 2),
      priorityScore: Math.min(1, Math.max(0, priorityScore)),
    });
  }
  return results;
}

export function impactScoreToChip(impactScore: number): 'High' | 'Med' | 'Low' {
  if (impactScore >= 0.6) return 'High';
  if (impactScore >= 0.3) return 'Med';
  return 'Low';
}
