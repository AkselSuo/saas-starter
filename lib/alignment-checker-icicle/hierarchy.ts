/**
 * Build icicle hierarchy from strategy cascade:
 * GrowthObjective → Country → Organisation Unit (responsibility) → Project
 *
 * Level 0: Strategic objective (growth)
 * Level 1: Country / organisational branch
 * Level 2: Responsibility unit (organisation unit)
 * Level 3: Improvement projects
 * Hierarchy depth is dynamic (supports ~4–5 levels).
 */

import * as d3 from 'd3';
import type {
  AlignmentSnapshot,
  IcicleNode,
  StatusCounts,
  TrafficStatus,
  NodeLevel,
  ContributingObjective,
  OrganisationUnit,
} from './types';
import { worstStatus } from './mock-data';
import { layoutIcicle, type LaidOutNode } from './layout';

export interface HierarchyInput {
  current: AlignmentSnapshot;
  previous: AlignmentSnapshot;
  maxDepth: number;
  atRiskOnly: boolean;
  selectedGrowthObjectiveId?: string;
}

export interface RawNode {
  id: string;
  name: string;
  level: NodeLevel;
  depth: number;
  objectiveId?: string;
  value: number;
  countryObjectiveIds: string[];
  projectIds: string[];
  country?: string;
  organisationUnit?: string;
  children?: RawNode[];
}

/** Group organisation units by country (from organisation structure; do not derive from projects). */
function getOrgUnitsByCountry(organisationUnits: OrganisationUnit[] | undefined): Map<string, OrganisationUnit[]> {
  const byCountry = new Map<string, OrganisationUnit[]>();
  if (!organisationUnits?.length) return byCountry;
  for (const ou of organisationUnits) {
    const list = byCountry.get(ou.country) ?? [];
    list.push(ou);
    byCountry.set(ou.country, list);
  }
  return byCountry;
}

function buildRawHierarchy(
  current: AlignmentSnapshot,
  atRiskOnly: boolean,
  selectedGrowthObjectiveId?: string,
): RawNode {
  const { growthObjectives, countryObjectives, projects } = current;
  const isAtRisk = (s: TrafficStatus) => s === 'red' || s === 'yellow';

  const goList = selectedGrowthObjectiveId
    ? growthObjectives.filter((g) => g.id === selectedGrowthObjectiveId)
    : growthObjectives.slice(0, 1);

  const goChildren: RawNode[] = [];

  for (const go of goList) {
    const coList = countryObjectives.filter((co) => co.growthObjectiveId === go.id);
    if (atRiskOnly && coList.every((co) => !isAtRisk(co.status))) continue;

    const byCountry = new Map<string, typeof coList>();
    for (const co of coList) {
      const list = byCountry.get(co.country) ?? [];
      list.push(co);
      byCountry.set(co.country, list);
    }

    const orgUnitsByCountry = getOrgUnitsByCountry(current.organisationUnits);

    const countryChildren: RawNode[] = [];
    for (const [country, countryObjs] of byCountry) {
      const filteredObjectives = atRiskOnly ? countryObjs.filter((co) => isAtRisk(co.status)) : countryObjs;
      if (filteredObjectives.length === 0) continue;

      const countryCoIds = filteredObjectives.map((co) => co.id);
      const countryProjects = projects.filter(
        (p) => p.countryObjectiveId && countryCoIds.includes(p.countryObjectiveId),
      );
      const filteredCountryProjects = atRiskOnly
        ? countryProjects.filter((p) => isAtRisk(p.status))
        : countryProjects;

      const orgUnitsForCountry = orgUnitsByCountry.get(country) ?? [];
      const orgUnitChildren: RawNode[] = [];
      for (const ou of orgUnitsForCountry) {
        const unitProjects = filteredCountryProjects.filter((p) => p.organisationUnit === ou.name);
        const projChildren: RawNode[] = unitProjects.map((p) => ({
          id: p.id,
          name: p.title,
          level: 'project' as NodeLevel,
          depth: 3,
          value: 1,
          countryObjectiveIds: [],
          projectIds: [p.id],
        }));
        const unitId = `orgunit-${go.id}-${country.toLowerCase()}-${ou.id}`;
        orgUnitChildren.push({
          id: unitId,
          name: ou.name,
          level: 'orgUnit' as NodeLevel,
          depth: 2,
          organisationUnit: ou.name,
          value: Math.max(projChildren.length, 1),
          countryObjectiveIds: [],
          projectIds: unitProjects.map((p) => p.id),
          children: projChildren.length ? projChildren : undefined,
        });
      }

      const allProjectIds = filteredCountryProjects.map((p) => p.id);
      countryChildren.push({
        id: `country-${go.id}-${country.toLowerCase()}`,
        name: country,
        level: 'country' as NodeLevel,
        depth: 1,
        country,
        value: Math.max(orgUnitChildren.reduce((s, c) => s + c.value, 0), 1),
        countryObjectiveIds: countryCoIds,
        projectIds: allProjectIds,
        children: orgUnitChildren.length ? orgUnitChildren : undefined,
      });
    }

    goChildren.push({
      id: go.id,
      name: go.title,
      level: 'growth' as NodeLevel,
      depth: 0,
      objectiveId: go.id,
      value: Math.max(countryChildren.reduce((s, c) => s + c.value, 0), 1),
      countryObjectiveIds: countryChildren.flatMap((c) => c.countryObjectiveIds),
      projectIds: countryChildren.flatMap((c) => c.projectIds),
      children: countryChildren.length ? countryChildren : undefined,
    });
  }

  if (goChildren.length === 1) return goChildren[0];

  return {
    id: 'root',
    name: 'All Growth Objectives',
    level: 'growth',
    depth: 0,
    value: Math.max(goChildren.reduce((s, c) => s + c.value, 0), 1),
    countryObjectiveIds: goChildren.flatMap((c) => c.countryObjectiveIds),
    projectIds: goChildren.flatMap((c) => c.projectIds),
    children: goChildren.length ? goChildren : undefined,
  };
}

function aggregateStatus(
  countryObjectiveIds: string[],
  projectIds: string[],
  snapshot: AlignmentSnapshot
): { statusCounts: StatusCounts; projectStatusCounts: StatusCounts; riskScore: number; progressAvg: number } {
  const counts: StatusCounts = { green: 0, yellow: 0, red: 0 };
  const projectCounts: StatusCounts = { green: 0, yellow: 0, red: 0 };
  let progressSum = 0;
  let progressCount = 0;

  for (const id of countryObjectiveIds) {
    const co = snapshot.countryObjectives.find((x) => x.id === id);
    if (co) {
      counts[co.status]++;
      progressSum += co.progress ?? 0;
      progressCount++;
    }
  }
  for (const id of projectIds) {
    const p = snapshot.projects.find((x) => x.id === id);
    if (p) {
      counts[p.status]++;
      projectCounts[p.status]++;
    }
  }
  const riskScore = counts.red * 3 + counts.yellow * 1;
  const progressAvg = progressCount > 0 ? progressSum / progressCount : 0;
  return { statusCounts: counts, projectStatusCounts: projectCounts, riskScore, progressAvg };
}

const STATUS_SORT_ORDER: Record<TrafficStatus, number> = { red: 0, yellow: 1, green: 2 };

function buildContributingObjectives(
  countryObjectiveIds: string[],
  snapshot: AlignmentSnapshot
): ContributingObjective[] {
  const results: ContributingObjective[] = [];
  for (const id of countryObjectiveIds) {
    const co = snapshot.countryObjectives.find((x) => x.id === id);
    if (!co) continue;
    const projList = snapshot.projects.filter((p) => p.countryObjectiveId === co.id);
    const criticalCount = projList.filter((p) => p.status === 'red' || p.status === 'yellow').length;
    const sortedProjects = [...projList]
      .sort((a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status])
      .map((p) => ({ id: p.id, title: p.title, status: p.status }));
    results.push({
      id: co.id,
      title: co.title,
      status: co.status,
      progress: co.progress,
      projectCount: projList.length,
      criticalProjectCount: criticalCount,
      connectedKpiIds: co.connectedKpiIds,
      projects: sortedProjects,
    });
  }
  return results;
}

export function buildPartitionNodes(input: HierarchyInput, width: number, height: number): IcicleNode[] {
  const { current, previous, maxDepth, selectedGrowthObjectiveId } = input;
  const raw = buildRawHierarchy(current, input.atRiskOnly, selectedGrowthObjectiveId);
  const root = d3.hierarchy(raw, (d: RawNode) => d.children);
  root.sum((d) => d.value);

  const effectiveMaxDepth = Math.min(maxDepth, 5);
  const outerPad = 12;
  layoutIcicle(root, width - outerPad * 2, height - outerPad * 2, {
    padding: 4,
    verticalGap: 4,
    maxDepth: effectiveMaxDepth,
    offsetX: outerPad,
    offsetY: outerPad,
    minWidthByDepth: (depth) => (depth === 2 ? 72 : depth >= 3 ? 88 : 0),
  });

  const nodes: IcicleNode[] = [];
  root.each((d) => {
    const rawNode = d.data;
    const depth = d.depth;
    if (depth > effectiveMaxDepth) return;

    const curr = aggregateStatus(rawNode.countryObjectiveIds ?? [], rawNode.projectIds ?? [], current);
    const prev = aggregateStatus(rawNode.countryObjectiveIds ?? [], rawNode.projectIds ?? [], previous);
    const projectStatusCounts = curr.projectStatusCounts;

    const projectsPreview = (rawNode.projectIds ?? [])
      .slice(0, 8)
      .map((id) => {
        const p = current.projects.find((x) => x.id === id);
        return p ? { id: p.id, title: p.title, status: p.status, countryObjectiveId: p.countryObjectiveId } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p != null);

    const deltaRisk = curr.riskScore - prev.riskScore;
    const progressCurrent = curr.progressAvg;
    const progressPrev = prev.progressAvg;
    const deltaRed = curr.statusCounts.red - prev.statusCounts.red;
    const deltaYellow = curr.statusCounts.yellow - prev.statusCounts.yellow;
    const deltaGreen = curr.statusCounts.green - prev.statusCounts.green;

    const statuses: TrafficStatus[] = [];
    if (curr.statusCounts.red) statuses.push('red');
    if (curr.statusCounts.yellow) statuses.push('yellow');
    if (curr.statusCounts.green) statuses.push('green');
    const status = worstStatus(statuses.length ? statuses : ['green']);
    const total = curr.statusCounts.green + curr.statusCounts.yellow + curr.statusCounts.red;
    const riskDensity = total > 0 ? curr.statusCounts.red / total : 0;

    const laid = d as LaidOutNode<RawNode>;
    const x0 = laid.x0 ?? 0;
    const x1 = laid.x1 ?? 0;
    const y0 = laid.y0 ?? 0;
    const y1 = laid.y1 ?? 0;

    const isCountry = rawNode.level === 'country';
    const contributingObjectives = isCountry
      ? buildContributingObjectives(rawNode.countryObjectiveIds ?? [], current)
      : undefined;

    const parentId = d.parent ? (d.parent.data as RawNode).id : null;
    nodes.push({
      id: rawNode.id,
      name: rawNode.name,
      level: rawNode.level,
      depth,
      objectiveId: rawNode.objectiveId,
      objectiveIds: rawNode.countryObjectiveIds,
      projectIds: rawNode.projectIds,
      country: rawNode.country,
      organisationUnit: rawNode.organisationUnit,
      contributingObjectives,
      value: rawNode.value,
      x0, x1, y0, y1,
      status,
      riskDensity,
      statusCountsCurrent: curr.statusCounts,
      statusCountsPrev: prev.statusCounts,
      projectStatusCounts,
      projectsPreview: projectsPreview.length ? projectsPreview : undefined,
      riskScoreCurrent: curr.riskScore,
      riskScorePrev: prev.riskScore,
      deltaRiskScore: deltaRisk,
      deltaRed, deltaYellow, deltaGreen,
      objectiveCount: rawNode.countryObjectiveIds?.length ?? 0,
      projectCount: rawNode.projectIds?.length ?? 0,
      progressCurrent,
      progressPrev,
      parentId,
    });
  });

  return nodes;
}

export function getSubtreeIds(nodes: IcicleNode[], nodeId: string): Set<string> {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return new Set();
  const set = new Set<string>([nodeId]);
  const idx = nodes.findIndex((n) => n.id === nodeId);
  const depth = node.depth;
  for (let i = idx + 1; i < nodes.length; i++) {
    if (nodes[i].depth <= depth) break;
    set.add(nodes[i].id);
  }
  return set;
}

export function getBreadcrumb(nodes: IcicleNode[], nodeId: string): IcicleNode[] {
  const path: IcicleNode[] = [];
  let node = nodes.find((n) => n.id === nodeId);
  while (node) {
    path.unshift(node);
    node = node.parentId ? nodes.find((n) => n.id === node!.parentId!) : undefined;
  }
  return path;
}
