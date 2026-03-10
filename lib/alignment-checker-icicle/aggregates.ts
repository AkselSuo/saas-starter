/**
 * Compute aggregates for a set of country objectives (and optionally projects) in a snapshot.
 */

import type { AlignmentSnapshot, StatusCounts } from './types';

export interface Aggregates {
  statusCounts: StatusCounts;
  riskScore: number;
  progressAvg: number;
  objectiveCount: number;
  projectCount: number;
}

export function computeAggregatesForSnapshot(
  objectiveIds: string[],
  projectIds: string[],
  snapshot: AlignmentSnapshot
): Aggregates {
  const counts: StatusCounts = { green: 0, yellow: 0, red: 0 };
  let progressSum = 0;
  let progressCount = 0;
  for (const id of objectiveIds) {
    const o = snapshot.countryObjectives.find((x) => x.id === id);
    if (o) {
      counts[o.status]++;
      progressSum += o.progress ?? 0;
      progressCount++;
    }
  }
  for (const id of projectIds) {
    const p = snapshot.projects.find((x) => x.id === id);
    if (p) counts[p.status]++;
  }
  const riskScore = counts.red * 3 + counts.yellow * 1;
  const progressAvg = progressCount > 0 ? progressSum / progressCount : 0;
  return {
    statusCounts: counts,
    riskScore,
    progressAvg,
    objectiveCount: objectiveIds.length,
    projectCount: projectIds.length,
  };
}
