'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { buildAlignmentDatasets } from '@/lib/alignment-checker-icicle/mock-data';
import {
  buildPartitionNodes,
  getSubtreeIds,
  getBreadcrumb,
} from '@/lib/alignment-checker-icicle/hierarchy';
import { computeImpactAndPriority, impactScoreToChip } from '@/lib/alignment-checker-icicle/impact';
import type { IcicleNode, AlignmentSnapshot, GrowthObjective } from '@/lib/alignment-checker-icicle/types';
import { IcicleChart, type LegendFilter } from '@/components/alignment-checker-icicle/IcicleChart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MONTHS_CURRENT = 'Jan 2026';
const MONTHS_PREV = 'Dec 2025';

const data = buildAlignmentDatasets();

function getImpactSentence(
  node: IcicleNode,
  parentName: string | null,
  deltaRiskScore: number
): string {
  const direction = deltaRiskScore > 0 ? 'deterioration is increasing' : deltaRiskScore < 0 ? 'improvement is reducing' : 'is stable vs';
  const base = `${node.name} ${direction} ${parentName ?? 'overall'}`;
  const badge = node.impactBadges?.[0];
  if (badge) return `${base} (${badge}).`;
  if (deltaRiskScore > 0) return `${base} objective risk (+${deltaRiskScore} pts).`;
  if (deltaRiskScore < 0) return `${base} risk by ${Math.abs(deltaRiskScore)} pts.`;
  return `${base} targets.`;
}

function StrategicAttentionRequired({
  nodes,
  onSelect,
  onHover,
  selectedId,
}: {
  nodes: IcicleNode[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  selectedId: string | null;
}) {
  const branchNodes = useMemo(() => nodes.filter((n) => n.depth >= 1 && n.depth <= 4), [nodes]);

  const byCurrentRisk = useMemo(
    () => [...branchNodes].sort((a, b) => b.riskScoreCurrent - a.riskScoreCurrent).slice(0, 5),
    [branchNodes]
  );
  const byDeterioration = useMemo(
    () => [...branchNodes].sort((a, b) => b.deltaRiskScore - a.deltaRiskScore).slice(0, 5),
    [branchNodes]
  );
  const byImpact = useMemo(
    () =>
      [...branchNodes]
        .sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))
        .slice(0, 5),
    [branchNodes]
  );

  const renderItem = (n: IcicleNode) => (
    <button
      key={n.id}
      type="button"
      onClick={() => onSelect(n.id)}
      onMouseEnter={() => onHover(n.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors',
        selectedId === n.id && 'bg-primary/10 ring-1 ring-primary/20'
      )}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          n.riskDensity >= 0.6 && 'bg-red-500',
          n.riskDensity > 0 && n.riskDensity < 0.6 && 'bg-amber-500',
          n.riskDensity <= 0 && 'bg-emerald-500'
        )}
      />
      <span className="truncate font-medium">{n.name}</span>
      <span className="text-gray-500 tabular-nums">{n.riskScoreCurrent}</span>
      {n.deltaRiskScore !== 0 && (
        <span className={n.deltaRiskScore > 0 ? 'text-red-600 tabular-nums' : 'text-emerald-600 tabular-nums'}>
          {n.deltaRiskScore > 0 ? '↑' : '↓'}{Math.abs(n.deltaRiskScore)}
        </span>
      )}
      {(n.impactScore ?? 0) > 0 && (
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
            (n.impactScore ?? 0) >= 0.6 && 'bg-red-100 text-red-700',
            (n.impactScore ?? 0) >= 0.3 && (n.impactScore ?? 0) < 0.6 && 'bg-amber-100 text-amber-800',
            (n.impactScore ?? 0) > 0 && (n.impactScore ?? 0) < 0.3 && 'bg-gray-100 text-gray-600'
          )}
        >
          {impactScoreToChip(n.impactScore ?? 0)}
        </span>
      )}
    </button>
  );

  const [openSection, setOpenSection] = useState<'risk' | 'deterioration' | 'impact' | null>('risk');

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Focus</p>
      <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'risk' ? null : 'risk')}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"
          >
            <span className="font-medium text-slate-700">High current risk</span>
            <span className="text-slate-400">{openSection === 'risk' ? '−' : '+'}</span>
          </button>
          {openSection === 'risk' && <ul className="space-y-1 border-t border-slate-50 px-2 pb-3 pt-2">{byCurrentRisk.map(renderItem)}</ul>}
        </div>
        <div className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'deterioration' ? null : 'deterioration')}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"
          >
            <span className="font-medium text-slate-600">Fastest deterioration</span>
            <span className="text-slate-400">{openSection === 'deterioration' ? '−' : '+'}</span>
          </button>
          {openSection === 'deterioration' && <ul className="space-y-1 border-t border-slate-50 px-2 pb-3 pt-2">{byDeterioration.map(renderItem)}</ul>}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'impact' ? null : 'impact')}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"
          >
            <span className="font-medium text-slate-600">Highest impact</span>
            <span className="text-slate-400">{openSection === 'impact' ? '−' : '+'}</span>
          </button>
          {openSection === 'impact' && (
            <div className="border-t border-slate-50 px-2 pb-2 pt-1">
              {byImpact.length ? <ul className="space-y-1">{byImpact.map(renderItem)}</ul> : <p className="py-1 text-xs text-slate-400">No high-impact branches</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  nodes,
  selectedId,
  selectedContributingObjectiveId,
  current,
  previous,
  compareEnabled,
  onSelect,
  onHover,
}: {
  nodes: IcicleNode[];
  selectedId: string | null;
  selectedContributingObjectiveId: string | null;
  current: AlignmentSnapshot;
  previous: AlignmentSnapshot;
  compareEnabled: boolean;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<'summary' | 'objectives' | 'projects'>('summary');

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const subtreeIds = useMemo(() => (selectedId ? getSubtreeIds(nodes, selectedId) : new Set<string>()), [nodes, selectedId]);
  const breadcrumb = useMemo(() => (selectedId ? getBreadcrumb(nodes, selectedId) : []), [nodes, selectedId]);

  const selectedContributingObj = useMemo(() => {
    if (!selectedContributingObjectiveId) return null;
    return current.countryObjectives.find((co) => co.id === selectedContributingObjectiveId) ?? null;
  }, [selectedContributingObjectiveId, current.countryObjectives]);

  const objectivesInSubtree = useMemo(() => {
    if (selectedContributingObj) {
      return [selectedContributingObj];
    }
    if (!selectedNode) return [];
    const coIds = new Set<string>();
    for (const n of nodes) {
      if (subtreeIds.has(n.id) && n.level === 'country') {
        for (const oid of n.objectiveIds ?? []) coIds.add(oid);
      }
    }
    if (selectedNode.objectiveIds) {
      for (const id of selectedNode.objectiveIds) coIds.add(id);
    }
    return current.countryObjectives.filter((co) => coIds.has(co.id));
  }, [selectedNode, selectedContributingObj, current.countryObjectives, nodes, subtreeIds]);

  const projectsInSubtree = useMemo(() => {
    const coIds = new Set(objectivesInSubtree.map((co) => co.id));
    return current.projects.filter((p) => coIds.has(p.countryObjectiveId));
  }, [current.projects, objectivesInSubtree]);

  const projectsByObjective = useMemo(() => {
    const map = new Map<string, typeof current.projects>();
    for (const p of projectsInSubtree) {
      const list = map.get(p.countryObjectiveId) ?? [];
      list.push(p);
      map.set(p.countryObjectiveId, list);
    }
    const statusOrder = { red: 0, yellow: 1, green: 2 };
    const objOrder = [...objectivesInSubtree].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    return objOrder.map((co) => {
      const projects = (map.get(co.id) ?? []).slice().sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      return { objective: co, projects };
    });
  }, [objectivesInSubtree, projectsInSubtree]);

  const redObjectives = useMemo(
    () => objectivesInSubtree.filter((co) => co.status === 'red').slice(0, 5),
    [objectivesInSubtree]
  );

  const threatenedStrategicObjectives = useMemo(() => {
    const ids = new Set<string>();
    for (const co of objectivesInSubtree) {
      if (co.status === 'red' || co.status === 'yellow') {
        for (const sid of co.connectedStrategicObjectiveIds ?? []) ids.add(sid);
      }
    }
    return (current.strategicObjectives ?? []).filter((s) => ids.has(s.id)).slice(0, 3);
  }, [objectivesInSubtree, current.strategicObjectives]);

  const impactedKpis = useMemo(() => {
    const ids = new Set<string>();
    for (const co of objectivesInSubtree) {
      if (co.status === 'red' || co.status === 'yellow') {
        for (const kid of co.connectedKpiIds ?? []) ids.add(kid);
      }
    }
    return (current.kpis ?? [])
      .filter((k) => ids.has(k.id))
      .sort((a, b) => (b.strategicWeight ?? 0) - (a.strategicWeight ?? 0))
      .slice(0, 5);
  }, [objectivesInSubtree, current.kpis]);

  const criticalProjects = useMemo(() => {
    return projectsInSubtree.filter((p) => p.status === 'red' || p.status === 'yellow').slice(0, 5);
  }, [projectsInSubtree]);

  if (!selectedId) {
    return (
      <div className="p-4 space-y-5">
        <p className="text-sm text-slate-500">Click a block in the chart to see details.</p>
        <StrategicAttentionRequired nodes={nodes} onSelect={onSelect} onHover={onHover} selectedId={selectedId} />
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold text-slate-600">Summary</p>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
            {current.countryObjectives.length} contributing objectives · {current.countryObjectives.filter((co) => co.status === 'red').length} red · {current.countryObjectives.filter((co) => co.status === 'yellow').length} yellow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 bg-slate-50/50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white hover:text-slate-700"
          >
            All
          </button>
          {breadcrumb.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white"
            >
              {n.name} →
            </button>
          ))}
          {selectedContributingObj && (
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {selectedContributingObj.title}
            </span>
          )}
        </div>
      </div>
      <div className="flex border-b border-slate-100">
        {(['summary', 'objectives', 'projects'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium capitalize transition-colors',
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto px-4 py-5">
        {tab === 'summary' && selectedNode && (
          <div className="space-y-4 text-sm">
            <p className="font-medium text-gray-700">
              {selectedNode.name}
              {selectedContributingObj && (
                <span className="ml-2 text-xs text-blue-600">→ {selectedContributingObj.title}</span>
              )}
            </p>

            {selectedContributingObj && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'size-2.5 rounded-full',
                    selectedContributingObj.status === 'red' && 'bg-red-500',
                    selectedContributingObj.status === 'yellow' && 'bg-amber-500',
                    selectedContributingObj.status === 'green' && 'bg-emerald-500',
                  )} />
                  <span className="font-medium text-slate-700">{selectedContributingObj.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                  <span>Progress:</span>
                  <span className="tabular-nums font-medium">{Math.round(selectedContributingObj.progress)}%</span>
                  <span>Projects:</span>
                  <span className="tabular-nums">{selectedContributingObj.connectedProjectIds.length}</span>
                  {selectedContributingObj.owner && (
                    <>
                      <span>Owner:</span>
                      <span>{selectedContributingObj.owner}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
              <p className="font-medium text-slate-700">Impact</p>
              <p className="mt-0.5 text-slate-600">
                {getImpactSentence(
                  selectedNode,
                  breadcrumb.length >= 2 ? breadcrumb[breadcrumb.length - 2]?.name ?? null : null,
                  selectedNode.deltaRiskScore
                )}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
              <p className="font-medium text-slate-700">Summary</p>
              <p className="mt-0.5 text-slate-600">
                R{selectedNode.statusCountsCurrent.red} Y{selectedNode.statusCountsCurrent.yellow} G{selectedNode.statusCountsCurrent.green} · RiskScore {selectedNode.riskScoreCurrent} · {selectedNode.projectCount} projects
                {selectedNode.progressCurrent != null && ` · Progress avg ${Math.round(selectedNode.progressCurrent)}%`}
              </p>
            </div>
            {compareEnabled && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2">
                <p className="font-medium text-slate-700">Trend (MoM)</p>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600">
                  <span>RiskScore:</span>
                  <span className="tabular-nums">{selectedNode.riskScorePrev} → {selectedNode.riskScoreCurrent} ({selectedNode.deltaRiskScore >= 0 ? '+' : ''}{selectedNode.deltaRiskScore})</span>
                  <span>Red:</span>
                  <span className="tabular-nums">{selectedNode.statusCountsPrev.red} → {selectedNode.statusCountsCurrent.red} ({selectedNode.deltaRed >= 0 ? '+' : ''}{selectedNode.deltaRed})</span>
                  <span>Yellow:</span>
                  <span className="tabular-nums">{selectedNode.statusCountsPrev.yellow} → {selectedNode.statusCountsCurrent.yellow} ({selectedNode.deltaYellow >= 0 ? '+' : ''}{selectedNode.deltaYellow})</span>
                </div>
              </div>
            )}

            {impactedKpis.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-2">
                <p className="font-medium text-slate-700">Critical KPIs</p>
                <ul className="mt-0.5 list-disc pl-4 text-xs text-slate-600">
                  {impactedKpis.map((k) => (
                    <li key={k.id}>
                      <span className={cn(
                        'inline-block size-1.5 rounded-full mr-1 align-middle',
                        k.status === 'red' && 'bg-red-500',
                        k.status === 'yellow' && 'bg-amber-500',
                        k.status === 'green' && 'bg-emerald-500',
                      )} />
                      {k.title}: {k.current}{k.unit} / {k.target}{k.unit}
                      {k.strategicWeight && <span className="text-slate-400"> (weight {k.strategicWeight})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {criticalProjects.length > 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50/30 p-2">
                <p className="font-medium text-slate-700">Critical Projects</p>
                <ul className="mt-0.5 list-disc pl-4 text-xs text-slate-600">
                  {criticalProjects.map((p) => (
                    <li key={p.id}>
                      <span className={cn(
                        'inline-block size-1.5 rounded-full mr-1 align-middle',
                        p.status === 'red' && 'bg-red-500',
                        p.status === 'yellow' && 'bg-amber-500',
                      )} />
                      {p.title}
                      {p.owner && <span className="text-slate-400"> · {p.owner}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {threatenedStrategicObjectives.length > 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50/30 p-2">
                <p className="font-medium text-slate-700">Threatened strategic objectives</p>
                <ul className="mt-0.5 list-disc pl-4 text-xs text-slate-600">
                  {threatenedStrategicObjectives.map((s) => (
                    <li key={s.id}>{s.title} (weight {s.importanceWeight})</li>
                  ))}
                </ul>
              </div>
            )}
            {redObjectives.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-700">Top red objectives</p>
                <ul className="mt-0.5 space-y-1.5 text-xs text-slate-600">
                  {redObjectives.map((co) => (
                    <li key={co.id} className="rounded-lg border border-slate-100 p-2">
                      <span className={cn('inline-block size-2 rounded-full mr-1.5 align-middle', 'bg-red-500')} />
                      <span className="font-medium">{co.title}</span>
                      {co.owner && <span className="text-gray-500"> · {co.owner}</span>}
                      <span className="tabular-nums"> · {co.progress}%</span>
                      <span className="text-slate-500"> · {co.connectedProjectIds.length} projects</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {tab === 'objectives' && (
          <ul className="space-y-1 text-xs">
            {[...objectivesInSubtree]
              .sort((a, b) => (a.status === 'red' ? -1 : a.status === 'yellow' ? 0 : 1) - (b.status === 'red' ? -1 : b.status === 'yellow' ? 0 : 1))
              .map((co) => (
                <li key={co.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                  <span className={cn('size-2 rounded-full', co.status === 'red' && 'bg-red-500', co.status === 'yellow' && 'bg-amber-500', co.status === 'green' && 'bg-emerald-500')} />
                  <span className="flex-1 truncate">{co.title}</span>
                  <span className="text-gray-500 tabular-nums">{co.progress}%</span>
                </li>
              ))}
          </ul>
        )}
        {tab === 'projects' && (
          <div className="space-y-3 text-xs">
            <p className="font-medium text-slate-700">Projects by contributing objective</p>
            {projectsByObjective.map(({ objective, projects }) => (
              <div key={objective.id} className="rounded-lg border border-slate-100 p-2">
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', objective.status === 'red' && 'bg-red-500', objective.status === 'yellow' && 'bg-amber-500', objective.status === 'green' && 'bg-emerald-500')} />
                  <span className="flex-1 truncate font-medium">{objective.title}</span>
                  <span className="text-slate-400 tabular-nums">{Math.round(objective.progress)}%</span>
                </div>
                {projects.length > 0 ? (
                  <ul className="mt-1 pl-4 space-y-0.5">
                    {projects.map((p) => (
                      <li key={p.id} className="flex items-center gap-2">
                        <span className={cn('size-1.5 rounded-full', p.status === 'red' && 'bg-red-500', p.status === 'yellow' && 'bg-amber-500', p.status === 'green' && 'bg-emerald-500')} />
                        <span className="truncate">{p.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-0.5 pl-4 text-slate-400">No projects</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlignmentCheckerIciclePage() {
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  const [hasMeasured, setHasMeasured] = useState(false);
  const [depth, setDepth] = useState(4);
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showStableBranches, setShowStableBranches] = useState(true);
  const showDeteriorationOnly = !showStableBranches;
  const [legendFilter, setLegendFilter] = useState<LegendFilter>('all');
  const growthObjectives: GrowthObjective[] = data.growthObjectives ?? [];
  const firstGoId = growthObjectives[0]?.id ?? '';
  const [selectedGrowthObjectiveId, setSelectedGrowthObjectiveId] = useState<string>(firstGoId);
  const [selectedContributingObjectiveId, setSelectedContributingObjectiveId] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedContributingObjectiveId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (!selectedGrowthObjectiveId || !growthObjectives.some((g) => g.id === selectedGrowthObjectiveId)) {
      setSelectedGrowthObjectiveId(firstGoId);
    }
  }, [selectedGrowthObjectiveId, growthObjectives, firstGoId]);

  React.useEffect(() => {
    setSelectedId(null);
    setSelectedContributingObjectiveId(null);
  }, [selectedGrowthObjectiveId]);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) setSelectedContributingObjectiveId(null);
  }, []);

  const input = useMemo(
    () => ({
      current: data.datasetCurrent,
      previous: data.datasetPrevious,
      maxDepth: depth,
      atRiskOnly,
      selectedGrowthObjectiveId,
    }),
    [depth, atRiskOnly, selectedGrowthObjectiveId]
  );

  const chartColumnRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  const resize = useCallback(() => {
    const el = chartAreaRef.current ?? chartColumnRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 0 && h > 0) {
        setWidth(w);
        setHeight(h);
        setHasMeasured(true);
      }
    }
  }, []);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  React.useLayoutEffect(() => {
    if (!mounted) return;
    const rafId = requestAnimationFrame(() => {
      resize();
      resizeObserverRef.current = new ResizeObserver(resize);
      const el = chartAreaRef.current ?? chartColumnRef.current;
      if (el) resizeObserverRef.current.observe(el);
    });
    const t = window.setTimeout(resize, 100);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [mounted, resize]);

  const chartReady = mounted && hasMeasured && width > 0 && height > 0;
  const chartWidth = chartReady ? width : 800;
  const chartHeight = chartReady ? height : 500;
  const partitionNodes = useMemo(() => {
    if (!chartReady) return [];
    const nodes = buildPartitionNodes(input, chartWidth, chartHeight);
    const impactMap = computeImpactAndPriority(nodes, data.datasetCurrent, data.datasetPrevious);
    return nodes.map((n) => {
      const impact = impactMap.get(n.id);
      return impact
        ? { ...n, priorityScore: impact.priorityScore, impactScore: impact.impactScore, impactBadges: impact.impactBadges }
        : n;
    });
  }, [chartReady, input, chartWidth, chartHeight]);
  const subtreeIds = useMemo(
    () => (selectedId && partitionNodes.length ? getSubtreeIds(partitionNodes, selectedId) : new Set<string>()),
    [partitionNodes, selectedId]
  );
  const subtreeIdsHover = useMemo(
    () => (hoverId && partitionNodes.length ? getSubtreeIds(partitionNodes, hoverId) : new Set<string>()),
    [partitionNodes, hoverId]
  );

  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50/50">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-base font-semibold text-slate-800">Alignment Checker</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Growth objective</label>
            <select
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800"
              value={selectedGrowthObjectiveId}
              onChange={(e) => setSelectedGrowthObjectiveId(e.target.value)}
            >
              {growthObjectives.map((go) => (
                <option key={go.id} value={go.id}>{go.title}</option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={compareEnabled}
              onChange={(e) => setCompareEnabled(e.target.checked)}
              className="rounded border-slate-300"
            />
            Compare {MONTHS_PREV} → {MONTHS_CURRENT}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={atRiskOnly}
              onChange={(e) => setAtRiskOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            At risk only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showStableBranches}
              onChange={(e) => setShowStableBranches(e.target.checked)}
              className="rounded border-slate-300"
            />
            Stable branches
          </label>
          <span className="text-slate-400">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Depth</span>
            <input
              type="range"
              min={1}
              max={5}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="h-1.5 w-20 rounded accent-slate-600"
            />
            <span className="w-5 text-right text-xs tabular-nums text-slate-500">{depth}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setSelectedContributingObjectiveId(null); }} className="text-slate-600">
            Clear selection
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
          <div className="flex-1 min-h-0 overflow-auto">
            <SidebarContent
              nodes={partitionNodes}
              selectedId={selectedId}
              selectedContributingObjectiveId={selectedContributingObjectiveId}
              current={data.datasetCurrent}
              previous={data.datasetPrevious}
              compareEnabled={compareEnabled}
              onSelect={handleSelect}
              onHover={setHoverId}
            />
          </div>
        </aside>
        <div
          ref={chartColumnRef}
          className="min-w-0 flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0, flexBasis: 0 }}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ minHeight: 400 }}>
            <div
              ref={chartAreaRef}
              className="absolute inset-0"
              style={{ background: '#F7F8FA' }}
            >
              {!chartReady ? (
                <p className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart…</p>
              ) : (
                <IcicleChart
                  nodes={partitionNodes}
                  width={chartWidth}
                  height={chartHeight}
                  selectedId={selectedId}
                  subtreeIds={subtreeIds}
                  hoverId={hoverId}
                  subtreeIdsHover={subtreeIdsHover}
                  compareEnabled={compareEnabled}
                  showDeteriorationOnly={showDeteriorationOnly}
                  legendFilter={legendFilter}
                  onSelect={handleSelect}
                  onHover={setHoverId}
                  selectedContributingObjectiveId={selectedContributingObjectiveId}
                  onSelectContributingObjective={setSelectedContributingObjectiveId}
                />
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-t bg-white px-4 py-2.5" style={{ borderColor: '#F0F1F3' }}>
            {compareEnabled && (
              <span className="text-xs text-slate-400">↑ worse · ↓ better · • same</span>
            )}
            <div className="flex items-center gap-2">
              {(['red', 'yellow', 'green'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLegendFilter(legendFilter === f ? 'all' : f)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                    legendFilter === f ? 'ring-1 ring-slate-300 bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      f === 'red' && 'bg-red-500',
                      f === 'yellow' && 'bg-amber-500',
                      f === 'green' && 'bg-emerald-500'
                    )}
                  />
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              {legendFilter !== 'all' && (
                <button type="button" onClick={() => setLegendFilter('all')} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
                  Show all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
