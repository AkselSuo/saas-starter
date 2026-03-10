/**
 * Data model for Alignment Checker Icicle (monthly follow-up).
 * X-Matrix structure: GrowthObjective → Country (with contributing objectives) → Project
 */

export type TrafficStatus = 'green' | 'yellow' | 'red';

/** Node level in the strategy execution hierarchy. */
export type NodeLevel = 'growth' | 'country' | 'orgUnit' | 'project';

/** Growth objective (top-level annual target, e.g. "Revenue +15%"). */
export interface GrowthObjective {
  id: string;
  title: string;
  owner?: string;
  connectedKpiIds?: string[];
}

/** Country-level objective linked to a growth objective. */
export interface CountryObjective {
  id: string;
  title: string;
  country: string;
  status: TrafficStatus;
  progress: number;
  growthObjectiveId: string;
  owner?: string;
  connectedProjectIds: string[];
  connectedKpiIds?: string[];
  connectedStrategicObjectiveIds?: string[];
}

/** Organisation unit in the execution structure (defined per country, not derived from projects). */
export interface OrganisationUnit {
  id: string;
  name: string;
  country: string;
}

export interface Project {
  id: string;
  title: string;
  status: TrafficStatus;
  countryObjectiveId: string;
  /** Organisation unit that owns this project (matches OrganisationUnit.name for assignment). */
  organisationUnit: string;
  owner?: string;
}

export interface KPI {
  id: string;
  title: string;
  status: TrafficStatus;
  current: number;
  target: number;
  unit: string;
  connectedObjectiveIds: string[];
  strategicWeight?: number;
}

export interface StrategicObjective {
  id: string;
  title: string;
  importanceWeight: number;
}

export interface StatusCounts {
  green: number;
  yellow: number;
  red: number;
}

/** Single snapshot (current or previous month). */
export interface AlignmentSnapshot {
  growthObjectives: GrowthObjective[];
  countryObjectives: CountryObjective[];
  projects: Project[];
  /** Organisation structure: all org units per country (defines level 3; do not derive from projects). */
  organisationUnits?: OrganisationUnit[];
  kpis?: KPI[];
  strategicObjectives?: StrategicObjective[];
}

/** Two snapshots for compare months. */
export interface AlignmentDatasets {
  datasetCurrent: AlignmentSnapshot;
  datasetPrevious: AlignmentSnapshot;
  growthObjectives: GrowthObjective[];
}

/** Lightweight project preview shown inline in boxes. */
export interface ProjectPreviewItem {
  id: string;
  title: string;
  status: TrafficStatus;
}

/** A contributing objective row inside a country block. */
export interface ContributingObjective {
  id: string;
  title: string;
  status: TrafficStatus;
  progress: number;
  projectCount: number;
  criticalProjectCount: number;
  connectedKpiIds?: string[];
  projects: ProjectPreviewItem[];
}

/** Hierarchy node for icicle layout. */
export interface IcicleNode {
  id: string;
  name: string;
  level: NodeLevel;
  depth: number;
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  objectiveId?: string;
  objectiveIds?: string[];
  projectIds?: string[];
  /** Country name (for country-level nodes). */
  country?: string;
  /** Organisation unit name (for orgUnit-level nodes). */
  organisationUnit?: string;
  /** Contributing objectives inside a country block (for internal rows). */
  contributingObjectives?: ContributingObjective[];
  status: TrafficStatus;
  riskDensity: number;
  statusCountsCurrent: StatusCounts;
  statusCountsPrev: StatusCounts;
  projectStatusCounts?: StatusCounts;
  projectsPreview?: { id: string; title: string; status: TrafficStatus; countryObjectiveId: string }[];
  riskScoreCurrent: number;
  riskScorePrev: number;
  deltaRiskScore: number;
  deltaRed: number;
  deltaYellow: number;
  deltaGreen: number;
  objectiveCount: number;
  projectCount: number;
  progressCurrent?: number;
  progressPrev?: number;
  priorityScore?: number;
  impactScore?: number;
  impactBadges?: string[];
  parentId?: string | null;
}
