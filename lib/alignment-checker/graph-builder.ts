import type { Node, Edge } from '@xyflow/react';
import type { AlignmentData, OrgUnit, Objective, Project, TrafficStatus } from './types';

export type NodeType = 'orgUnit' | 'objective' | 'projectCluster';

export interface GraphState {
  expandedUnitIds: Set<string>;
  focusedObjectiveId: string | null;
  showOnlyAtRisk: boolean;
}

const NODE_WIDTH = { orgUnit: 220, objective: 200, projectCluster: 120 };
const NODE_HEIGHT = { orgUnit: 72, objective: 44, projectCluster: 36 };

const NODE_WIDTH_COMPACT = { orgUnit: 160, objective: 150, projectCluster: 90 };
const NODE_HEIGHT_COMPACT = { orgUnit: 52, objective: 36, projectCluster: 28 };

function getNodeDimensions(compact: boolean) {
  return compact
    ? { width: NODE_WIDTH_COMPACT, height: NODE_HEIGHT_COMPACT }
    : { width: NODE_WIDTH, height: NODE_HEIGHT };
}

function isAtRisk(status: TrafficStatus): boolean {
  return status === 'red' || status === 'yellow';
}

function getObjectiveCascadeChain(objectives: Objective[], rootId: string): Set<string> {
  const chain = new Set<string>([rootId]);
  let current = [rootId];
  while (current.length) {
    const next: string[] = [];
    for (const o of objectives) {
      if (o.parentObjectiveId && current.includes(o.parentObjectiveId)) {
        chain.add(o.id);
        next.push(o.id);
      }
    }
    current = next;
  }
  return chain;
}

/** Build graph with all units expanded and all objectives/clusters for one-time full layout. */
export function buildFullGraph(
  data: AlignmentData,
  state: Pick<GraphState, 'showOnlyAtRisk'>,
  options?: { includeAllClusters?: boolean; compact?: boolean }
): { nodes: Node[]; edges: Edge[] } {
  const allUnitIds = new Set(data.orgUnits.map((u) => u.id));
  return buildGraph(
    data,
    { ...state, expandedUnitIds: allUnitIds, focusedObjectiveId: null },
    { includeAllClusters: true, compact: options?.compact }
  );
}

export function buildGraph(
  data: AlignmentData,
  state: GraphState,
  options?: { includeAllClusters?: boolean; compact?: boolean }
): { nodes: Node[]; edges: Edge[] } {
  const { orgUnits, objectives, projects } = data;
  const { expandedUnitIds, focusedObjectiveId, showOnlyAtRisk } = state;
  const includeAllClusters = options?.includeAllClusters ?? false;
  const compact = options?.compact ?? false;
  const dim = getNodeDimensions(compact);

  const objectivesByUnit = new Map<string, Objective[]>();
  for (const o of objectives) {
    const list = objectivesByUnit.get(o.orgUnitId) ?? [];
    list.push(o);
    objectivesByUnit.set(o.orgUnitId, list);
  }

  const projectsByUnit = new Map<string, Project[]>();
  for (const p of projects) {
    const list = projectsByUnit.get(p.orgUnitId) ?? [];
    list.push(p);
    projectsByUnit.set(p.orgUnitId, list);
  }

  let visibleUnits = orgUnits;
  if (showOnlyAtRisk) {
    const atRiskIds = new Set(orgUnits.filter((u) => isAtRisk(u.status)).map((u) => u.id));
    visibleUnits = orgUnits.filter((u) => {
      if (atRiskIds.has(u.id)) return true;
      let p: OrgUnit | undefined = u;
      while (p?.parentId) {
        p = orgUnits.find((x) => x.id === p!.parentId);
        if (p && atRiskIds.has(p.id)) return true;
      }
      return false;
    });
  }

  const cascadeObjectiveIds =
    focusedObjectiveId != null
      ? getObjectiveCascadeChain(objectives, focusedObjectiveId)
      : new Set<string>();

  const cascadeUnitIds = new Set<string>(
    visibleUnits.filter((u) =>
      (objectivesByUnit.get(u.id) ?? []).some((o) => cascadeObjectiveIds.has(o.id))
    ).map((u) => u.id)
  );

  /** True if this unit or any objective under it is red (for "parent of red" signal). */
  function unitHasRedBelow(unitId: string): boolean {
    const unit = orgUnits.find((u) => u.id === unitId);
    if (unit?.status === 'red') return true;
    for (const o of objectivesByUnit.get(unitId) ?? []) {
      if (o.status === 'red') return true;
    }
    for (const child of orgUnits.filter((u) => u.parentId === unitId)) {
      if (unitHasRedBelow(child.id)) return true;
    }
    return false;
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const unit of visibleUnits) {
    const expanded = expandedUnitIds.has(unit.id);
    const unitNodeId = `org-${unit.id}`;
    const isInCascadeUnit = cascadeUnitIds.has(unit.id);
    const hasRedBelow = unitHasRedBelow(unit.id);
    nodes.push({
      id: unitNodeId,
      type: 'orgUnit',
      position: { x: 0, y: 0 },
      data: {
        orgUnit: unit,
        objectiveCount: (objectivesByUnit.get(unit.id) ?? []).length,
        projectCount: (projectsByUnit.get(unit.id) ?? []).length,
        isExpanded: expanded,
        isHighlighted: focusedObjectiveId != null && isInCascadeUnit,
        hasRedBelow,
        isDimmed: focusedObjectiveId != null && !isInCascadeUnit,
      },
      width: dim.width.orgUnit,
      height: dim.height.orgUnit,
    });

    if (unit.parentId && visibleUnits.some((u) => u.id === unit.parentId)) {
      const parentInCascade = cascadeUnitIds.has(unit.parentId);
      const edgeInCascade = isInCascadeUnit && parentInCascade;
      edges.push({
        id: `e-org-${unit.parentId}-${unit.id}`,
        source: `org-${unit.parentId}`,
        target: unitNodeId,
        ...(focusedObjectiveId != null && !edgeInCascade && { className: 'alignment-edge-dimmed', style: { opacity: 0.28 } }),
      });
    }

    if (expanded) {
      const unitObjectives = objectivesByUnit.get(unit.id) ?? [];
      for (const obj of unitObjectives) {
        const inCascade = cascadeObjectiveIds.has(obj.id);
        const objNodeId = `obj-${obj.id}`;
        const linkedProjects = (projectsByUnit.get(unit.id) ?? []).filter((p) =>
          p.connectedObjectiveIds.includes(obj.id)
        );

        nodes.push({
          id: objNodeId,
          type: 'objective',
          position: { x: 0, y: 0 },
          data: {
            objective: obj,
            orgUnit: unit,
            projectCount: linkedProjects.length,
            isFocused: obj.id === focusedObjectiveId,
            isInCascade: inCascade,
            isDimmed: focusedObjectiveId != null && !inCascade,
          },
          width: dim.width.objective,
          height: dim.height.objective,
        });
        const objEdgeInCascade = inCascade && isInCascadeUnit;
        edges.push({
          id: `e-org-obj-${unit.id}-${obj.id}`,
          source: unitNodeId,
          target: objNodeId,
          ...(focusedObjectiveId != null && !objEdgeInCascade && { className: 'alignment-edge-dimmed', style: { opacity: 0.28 } }),
        });

        if (obj.parentObjectiveId) {
          const parentObjNodeId = `obj-${obj.parentObjectiveId}`;
          if (nodes.some((n) => n.id === parentObjNodeId)) {
            const parentObjInCascade = cascadeObjectiveIds.has(obj.parentObjectiveId);
            edges.push({
              id: `e-obj-cascade-${obj.parentObjectiveId}-${obj.id}`,
              source: parentObjNodeId,
              target: objNodeId,
              ...(focusedObjectiveId != null && !(inCascade && parentObjInCascade) && { className: 'alignment-edge-dimmed', style: { opacity: 0.28 } }),
            });
          }
        }

        if (linkedProjects.length > 0 && (inCascade || includeAllClusters)) {
          const clusterId = `cluster-${unit.id}-${obj.id}`;
          nodes.push({
            id: clusterId,
            type: 'projectCluster',
            position: { x: 0, y: 0 },
            data: {
              objectiveId: obj.id,
              orgUnitId: unit.id,
              projectCount: linkedProjects.length,
              projects: linkedProjects,
              isInCascade: inCascade,
              isDimmed: focusedObjectiveId != null && !inCascade,
            },
            width: dim.width.projectCluster,
            height: dim.height.projectCluster,
          });
          edges.push({
            id: `e-obj-cluster-${obj.id}-${clusterId}`,
            source: objNodeId,
            target: clusterId,
            ...(focusedObjectiveId != null && !inCascade && { className: 'alignment-edge-dimmed', style: { opacity: 0.28 } }),
          });
        }
      }
    }
  }

  return { nodes, edges };
}
