export type TrafficStatus = 'green' | 'yellow' | 'red';

export interface OrgUnit {
  id: string;
  name: string;
  level: 'group' | 'country' | 'department';
  parentId: string | null;
  status: TrafficStatus;
  /** Counts for aggregated traffic light summary */
  metricsSummary: { green: number; yellow: number; red: number };
}

export interface Objective {
  id: string;
  title: string;
  status: TrafficStatus;
  orgUnitId: string;
  parentObjectiveId: string | null;
  connectedObjectiveIds: string[];
}

export interface Project {
  id: string;
  title: string;
  status: TrafficStatus;
  orgUnitId: string;
  connectedObjectiveIds: string[];
  /** Mock: short description for drill-down */
  description?: string;
  /** Mock: owner / lead */
  owner?: string;
  /** Mock: due or end date */
  dueDate?: string;
}

export interface AlignmentData {
  orgUnits: OrgUnit[];
  objectives: Objective[];
  projects: Project[];
}

/** Strategy year for filter (mock) */
export const STRATEGY_YEARS = ['2024', '2025', '2026'] as const;
export type StrategyYear = (typeof STRATEGY_YEARS)[number];
