'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildAlignmentMockData } from '@/lib/alignment-checker/mock-data';
import { buildGraph, buildFullGraph, type GraphState } from '@/lib/alignment-checker/graph-builder';
import type { AlignmentData, Objective, OrgUnit, Project, StrategyYear } from '@/lib/alignment-checker/types';
import { STRATEGY_YEARS } from '@/lib/alignment-checker/types';
import { OrgUnitNode } from '@/components/alignment-checker/OrgUnitNode';
import { ObjectiveNode } from '@/components/alignment-checker/ObjectiveNode';
import { ProjectClusterNode } from '@/components/alignment-checker/ProjectClusterNode';
import { ExecutiveDashboard } from '@/components/alignment-checker/ExecutiveDashboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COMPACT_LAYOUT = true;

const nodeTypes = {
  orgUnit: OrgUnitNode as React.ComponentType<React.ComponentProps<typeof OrgUnitNode>>,
  objective: ObjectiveNode as React.ComponentType<React.ComponentProps<typeof ObjectiveNode>>,
  projectCluster: ProjectClusterNode as React.ComponentType<React.ComponentProps<typeof ProjectClusterNode>>,
};

const data = buildAlignmentMockData();

function getCascadeChain(objectives: Objective[], rootId: string): Objective[] {
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const result: Objective[] = [];
  const root = byId.get(rootId);
  if (!root) return result;
  result.push(root);
  let current = [rootId];
  while (current.length) {
    const next: string[] = [];
    for (const o of objectives) {
      if (o.parentObjectiveId && current.includes(o.parentObjectiveId)) {
        result.push(o);
        next.push(o.id);
      }
    }
    current = next;
  }
  return result;
}

function SidebarContent({
  data: alignmentData,
  selectedNodeId,
  selectedNodeType,
  focusedObjectiveId,
  onClose,
}: {
  data: AlignmentData;
  selectedNodeId: string | null;
  selectedNodeType: string | null;
  focusedObjectiveId: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'summary' | 'objectives' | 'projects'>('summary');

  const selectedOrg = useMemo(() => {
    if (selectedNodeType !== 'orgUnit' || !selectedNodeId) return null;
    const id = selectedNodeId.replace(/^org-/, '');
    return alignmentData.orgUnits.find((u) => u.id === id) ?? null;
  }, [selectedNodeId, selectedNodeType, alignmentData.orgUnits]);

  const selectedObjective = useMemo(() => {
    if (selectedNodeType !== 'objective' || !selectedNodeId) return null;
    const id = selectedNodeId.replace(/^obj-/, '');
    return alignmentData.objectives.find((o) => o.id === id) ?? null;
  }, [selectedNodeId, selectedNodeType, alignmentData.objectives]);

  const cascadeObjectives = useMemo(() => {
    const rootId = focusedObjectiveId ?? selectedObjective?.id;
    if (!rootId) return [];
    return getCascadeChain(alignmentData.objectives, rootId);
  }, [focusedObjectiveId, selectedObjective, alignmentData.objectives]);

  const projectsByUnitForCascade = useMemo(() => {
    const unitIds = new Set(cascadeObjectives.map((o) => o.orgUnitId));
    const result: { orgUnit: OrgUnit; objectives: { objective: Objective; projects: Project[] }[] }[] = [];
    const units = alignmentData.orgUnits.filter((u) => unitIds.has(u.id));
    for (const orgUnit of units) {
      const unitObjs = cascadeObjectives.filter((o) => o.orgUnitId === orgUnit.id);
      const objectivesWithProjects = unitObjs.map((objective) => ({
        objective,
        projects: alignmentData.projects.filter(
          (p) => p.orgUnitId === orgUnit.id && p.connectedObjectiveIds.includes(objective.id)
        ),
      }));
      result.push({ orgUnit, objectives: objectivesWithProjects });
    }
    return result;
  }, [cascadeObjectives, alignmentData.orgUnits, alignmentData.projects]);

  const projectsForSelectedObjective = useMemo(() => {
    const obj = selectedObjective ?? (focusedObjectiveId ? alignmentData.objectives.find((o) => o.id === focusedObjectiveId) ?? null : null);
    if (!obj) return [];
    return alignmentData.projects.filter((p) => p.connectedObjectiveIds.includes(obj.id));
  }, [selectedObjective, focusedObjectiveId, alignmentData.objectives, alignmentData.projects]);

  const title =
    selectedOrg?.name ??
    selectedObjective?.title ??
    (focusedObjectiveId ? alignmentData.objectives.find((o) => o.id === focusedObjectiveId)?.title : null) ??
    'Selection';

  if (!selectedNodeId && !focusedObjectiveId) {
    return (
      <div className="flex h-full flex-col p-4">
        <p className="text-sm text-gray-500">Select a node or an objective to see details.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="flex border-b border-gray-200">
        {(['summary', 'objectives', 'projects'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-xs font-medium capitalize',
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {tab === 'summary' && (
          <div className="space-y-3 text-sm">
            {(selectedOrg || selectedObjective) && (
              <>
                {selectedOrg && (
                  <div>
                    <p className="font-medium text-gray-700">Unit: {selectedOrg.name}</p>
                    <p className="text-gray-500">
                      Status: {selectedOrg.status} · {selectedOrg.metricsSummary.green}G /{' '}
                      {selectedOrg.metricsSummary.yellow}Y / {selectedOrg.metricsSummary.red}R
                    </p>
                    <p className="mt-1 text-gray-500">
                      {alignmentData.objectives.filter((o) => o.orgUnitId === selectedOrg.id).length} objectives,{' '}
                      {alignmentData.projects.filter((p) => p.orgUnitId === selectedOrg.id).length} projects
                    </p>
                  </div>
                )}
                {selectedObjective && (
                  <div>
                    <p className="font-medium text-gray-700">Objective: {selectedObjective.title}</p>
                    <p className="text-gray-500">Status: {selectedObjective.status}</p>
                    <p className="mt-1 text-gray-500">
                      {alignmentData.projects.filter((p) =>
                        p.connectedObjectiveIds.includes(selectedObjective.id)
                      ).length}{' '}
                      linked projects — see Projects tab to drill down
                    </p>
                  </div>
                )}
              </>
            )}
            {focusedObjectiveId && !selectedObjective && (
              <p className="text-gray-600">Viewing cascade for selected objective. Use Objectives / Projects tabs.</p>
            )}
          </div>
        )}
        {tab === 'objectives' && (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-gray-700">Cascade path</p>
            <ul className="list-inside list-disc space-y-1 text-gray-600">
              {cascadeObjectives.map((o) => (
                <li key={o.id}>
                  <span className={o.id === focusedObjectiveId ? 'font-medium text-amber-700' : ''}>
                    {o.title}
                  </span>
                  <span className="ml-1 text-gray-400">
                    ({alignmentData.orgUnits.find((u) => u.id === o.orgUnitId)?.name})
                  </span>
                </li>
              ))}
            </ul>
            {cascadeObjectives.length === 0 && (
              <p className="text-gray-500">Select an objective to see its cascade.</p>
            )}
          </div>
        )}
        {tab === 'projects' && (
          <div className="space-y-4 text-sm">
            {projectsForSelectedObjective.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">
                  Projects for {selectedObjective?.title ?? alignmentData.objectives.find((o) => o.id === focusedObjectiveId)?.title ?? 'objective'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Drill-down: project-level details</p>
                <ul className="mt-2 space-y-3">
                  {projectsForSelectedObjective.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'size-2.5 shrink-0 rounded-full',
                            p.status === 'green' && 'bg-emerald-500',
                            p.status === 'yellow' && 'bg-amber-500',
                            p.status === 'red' && 'bg-red-500'
                          )}
                          title={p.status}
                        />
                        <span className="font-medium">{p.title}</span>
                      </div>
                      {p.description && (
                        <p className="mt-1.5 text-xs text-gray-600">{p.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                        {p.owner && <span>Owner: {p.owner}</span>}
                        {p.dueDate && <span>Due: {p.dueDate}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {focusedObjectiveId && projectsByUnitForCascade.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <p className="font-medium text-gray-700">Cascade: connected projects by level</p>
                {projectsByUnitForCascade.map(({ orgUnit, objectives }) => (
                  <div key={orgUnit.id} className="mt-2">
                    <p className="font-medium text-gray-800">{orgUnit.name}</p>
                    <ul className="mt-1 space-y-1 pl-2">
                      {objectives.flatMap(({ objective, projects }) =>
                        projects.map((p) => (
                          <li key={p.id} className="flex items-center gap-2 text-gray-600">
                            <span
                              className={cn(
                                'size-2 rounded-full',
                                p.status === 'green' && 'bg-emerald-500',
                                p.status === 'yellow' && 'bg-amber-500',
                                p.status === 'red' && 'bg-red-500'
                              )}
                            />
                            <span>{p.title}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {projectsForSelectedObjective.length === 0 && projectsByUnitForCascade.length === 0 && (
              <p className="text-gray-500">Select an objective to see and drill down into its linked projects.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowInner() {
  const [graphState, setGraphState] = useState<GraphState>({
    expandedUnitIds: new Set(),
    focusedObjectiveId: null,
    showOnlyAtRisk: false,
  });
  const [strategyYear, setStrategyYear] = useState<StrategyYear>('2025');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();
  const hasFittedInitial = useRef(false);
  const previousNodeIds = useRef<Set<string>>(new Set());
  const positionByNodeId = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastFullLayoutAtRisk = useRef<boolean | null>(null);

  const runLayout = useCallback(
    async (state: GraphState, options?: { fitViewAfter?: boolean }) => {
      const needFullLayout =
        positionByNodeId.current.size === 0 ||
        lastFullLayoutAtRisk.current !== state.showOnlyAtRisk;

      if (needFullLayout) {
        const { getLayoutedElements } = await import('@/lib/alignment-checker/layout');
        const { nodes: fullNodes, edges: fullEdges } = buildFullGraph(data, {
          showOnlyAtRisk: state.showOnlyAtRisk,
        }, { compact: COMPACT_LAYOUT });
        const { nodes: layouted } = await getLayoutedElements(fullNodes, fullEdges, { compact: COMPACT_LAYOUT });
        const nextPositions = new Map<string, { x: number; y: number }>();
        for (const n of layouted) {
          nextPositions.set(n.id, n.position);
        }
        positionByNodeId.current = nextPositions;
        lastFullLayoutAtRisk.current = state.showOnlyAtRisk;
      }

      const { nodes: visibleNodes, edges: visibleEdges } = buildGraph(data, state, { compact: COMPACT_LAYOUT });
      const positions = positionByNodeId.current;
      const nodesWithPositions = visibleNodes.map((node) => {
        const pos = positions.get(node.id) ?? { x: 0, y: 0 };
        return {
          ...node,
          position: pos,
          data: {
            ...node.data,
            animateIn: !previousNodeIds.current.has(node.id),
          },
        };
      });
      previousNodeIds.current = new Set(nodesWithPositions.map((n) => n.id));
      setNodes(nodesWithPositions);
      setEdges(visibleEdges);

      const shouldFit = options?.fitViewAfter ?? !hasFittedInitial.current;
      if (shouldFit) {
        hasFittedInitial.current = true;
        requestAnimationFrame(() => fitView?.({ padding: 0.2, duration: 300 }));
      }
    },
    [setNodes, setEdges, fitView]
  );

  const layoutKey = `${[...graphState.expandedUnitIds].sort().join(',')}-${graphState.focusedObjectiveId}-${graphState.showOnlyAtRisk}`;
  useEffect(() => {
    runLayout(graphState);
  }, [layoutKey]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setSelectedNodeType(node.type ?? null);
      if (node.type === 'orgUnit') {
        const id = node.id.replace(/^org-/, '');
        setGraphState((s) => {
          const next = new Set(s.expandedUnitIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { ...s, expandedUnitIds: next };
        });
      }
      if (node.type === 'objective') {
        const id = (node.data as { objective?: { id: string } }).objective?.id ?? node.id.replace(/^obj-/, '');
        const cascade = getCascadeChain(data.objectives, id);
        const unitIdsInCascade = new Set(cascade.map((o) => o.orgUnitId));
        setGraphState((s) => {
          const nextExpanded = new Set(s.expandedUnitIds);
          unitIdsInCascade.forEach((uid) => nextExpanded.add(uid));
          return {
            ...s,
            expandedUnitIds: nextExpanded,
            focusedObjectiveId: s.focusedObjectiveId === id ? null : id,
          };
        });
      }
    },
    []
  );

  const resetView = useCallback(() => {
    setGraphState({
      expandedUnitIds: new Set(),
      focusedObjectiveId: null,
      showOnlyAtRisk: false,
    });
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    runLayout(
      {
        expandedUnitIds: new Set(),
        focusedObjectiveId: null,
        showOnlyAtRisk: false,
      },
      { fitViewAfter: true }
    );
  }, [runLayout]);

  const onViewObjectiveFromDashboard = useCallback(
    (objectiveId: string, orgUnitId?: string) => {
      const cascade = getCascadeChain(data.objectives, objectiveId);
      const unitIdsInCascade = new Set(cascade.map((o) => o.orgUnitId));
      if (orgUnitId) unitIdsInCascade.add(orgUnitId);
      setGraphState((s) => ({
        ...s,
        expandedUnitIds: new Set([...s.expandedUnitIds, ...unitIdsInCascade]),
        focusedObjectiveId: objectiveId,
      }));
      setSelectedNodeId(`obj-${objectiveId}`);
      setSelectedNodeType('objective');
      requestAnimationFrame(() => fitView?.({ padding: 0.15, duration: 400 }));
    },
    [fitView]
  );

  const onViewProjectFromDashboard = useCallback((projectId: string) => {
    const proj = data.projects.find((p) => p.id === projectId);
    if (!proj || proj.connectedObjectiveIds.length === 0) return;
    const objectiveId = proj.connectedObjectiveIds[0];
    onViewObjectiveFromDashboard(objectiveId, proj.orgUnitId);
  }, [onViewObjectiveFromDashboard]);

  const onViewProblemSources = useCallback(() => {
    setGraphState((s) => ({ ...s, showOnlyAtRisk: true }));
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    requestAnimationFrame(() => fitView?.({ padding: 0.15, duration: 400 }));
  }, [fitView]);

  return (
    <div className="flex h-full w-full">
      <div className="w-1/2 flex-shrink-0 min-h-0 flex flex-col border-r border-gray-200">
        <ExecutiveDashboard
          onViewObjective={onViewObjectiveFromDashboard}
          onViewProject={onViewProjectFromDashboard}
          onViewProblemSources={onViewProblemSources}
        />
      </div>
      <div className="flex w-1/2 min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-1.5">
          <span className="text-sm font-medium text-gray-700">Strategy year</span>
          <select
            value={strategyYear}
            onChange={(e) => setStrategyYear(e.target.value as StrategyYear)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {STRATEGY_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={graphState.showOnlyAtRisk}
              onChange={(e) =>
                setGraphState((s) => ({ ...s, showOnlyAtRisk: e.target.checked }))
              }
            />
            Only at-risk branches
          </label>
          <Button variant="outline" size="sm" onClick={resetView}>
            Reset
          </Button>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as OnNodesChange}
            onEdgesChange={onEdgesChange as OnEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView={false}
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedNodeType(null);
            }}
          >
            <Background />
            <Panel position="top-left" className="m-1.5 text-[10px] text-gray-500">
              Unit = expand · Objective = cascade · Dashboard (right) drives canvas
            </Panel>
          </ReactFlow>
          </div>
        <aside className="w-64 shrink-0 border-l border-gray-200 bg-white overflow-auto">
          <SidebarContent
            data={data}
            selectedNodeId={selectedNodeId}
            selectedNodeType={selectedNodeType}
            focusedObjectiveId={graphState.focusedObjectiveId}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedNodeType(null);
              setGraphState((s) => ({ ...s, focusedObjectiveId: null }));
            }}
          />
        </aside>
        </div>
      </div>
    </div>
  );
}

export default function AlignmentCheckerCanvasPage() {
  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Alignment Checker Canvas</h1>
        <p className="text-sm text-gray-500">
          Overview of cascading objectives and projects. Expand units, click objectives to see cascade and projects.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <FlowInner />
        </ReactFlowProvider>
      </div>
    </section>
  );
}
