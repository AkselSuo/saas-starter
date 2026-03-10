'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { IcicleNode } from '@/lib/alignment-checker-icicle/types';
import { buildNodeRenderContext, renderNode } from './NodeRenderer';
import type { RenderRect } from './renderers/types';

export type LegendFilter = 'all' | 'red' | 'yellow' | 'green';

export interface IcicleChartProps {
  nodes: IcicleNode[];
  width: number;
  height: number;
  selectedId: string | null;
  subtreeIds: Set<string>;
  hoverId: string | null;
  subtreeIdsHover: Set<string>;
  compareEnabled: boolean;
  showDeteriorationOnly: boolean;
  legendFilter: LegendFilter;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  selectedContributingObjectiveId?: string | null;
  onSelectContributingObjective?: (id: string | null) => void;
}

const STATUS_DOT: Record<string, string> = { red: 'bg-red-500', yellow: 'bg-amber-500', green: 'bg-emerald-500' };

export function IcicleChart({
  nodes,
  width,
  height,
  selectedId,
  subtreeIds,
  hoverId,
  subtreeIdsHover,
  compareEnabled,
  showDeteriorationOnly,
  legendFilter,
  onSelect,
  onHover,
  selectedContributingObjectiveId,
  onSelectContributingObjective,
}: IcicleChartProps) {
  const [tooltip, setTooltip] = useState<{ node: IcicleNode; anchor: { left: number; top: number; width: number } } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const childIdsByParent = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of nodes) {
      if (n.parentId) {
        const set = m.get(n.parentId) ?? new Set();
        set.add(n.id);
        m.set(n.parentId, set);
      }
    }
    return m;
  }, [nodes]);

  const handleMouseEnter = (node: IcicleNode, e: React.MouseEvent) => {
    onHover(node.id);
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    setTooltip({ node, anchor: { left: r.left, top: r.top, width: r.width } });
  };

  const handleMouseLeave = () => {
    onHover(null);
    setTooltip(null);
  };

  const handleClick = (node: IcicleNode, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(selectedId === node.id ? null : node.id);
    onSelectContributingObjective?.(null);
  };

  return (
    <div className="relative h-full w-full min-w-0 min-h-0" style={{ background: '#F7F8FA' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-pointer"
        onClick={() => { onSelect(null); onSelectContributingObjective?.(null); }}
      >
        <defs>
          <filter id="card-shadow-hover" x="-4%" y="-4%" width="108%" height="116%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
          </filter>
          <filter id="card-shadow-strong" x="-4%" y="-4%" width="108%" height="116%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#000" floodOpacity="0.12" />
          </filter>
          <filter id="priority-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {nodes.map((node) => {
          const w = node.x1 - node.x0;
          const h = node.y1 - node.y0;
          const hasChildrenInView = (childIdsByParent.get(node.id)?.size ?? 0) > 0;
          const inSelectedSubtree = selectedId != null && subtreeIds.has(node.id);
          const inHoverSubtree = hoverId != null && subtreeIdsHover.has(node.id);
          const dimmed = selectedId != null ? !inSelectedSubtree : hoverId != null ? !inHoverSubtree : false;
          let filterOpacity = 1;
          if (legendFilter === 'red') filterOpacity = node.riskDensity >= 0.6 ? 1 : 0.25;
          else if (legendFilter === 'yellow') filterOpacity = node.riskDensity > 0 && node.riskDensity < 0.6 ? 1 : 0.25;
          else if (legendFilter === 'green') filterOpacity = node.riskDensity <= 0 ? 0.2 : 1;
          const deteriorationDim = showDeteriorationOnly && node.deltaRiskScore <= 0 ? 0.15 : 1;
          const opacityMultiplier = filterOpacity * deteriorationDim;
          const rect: RenderRect = { x0: node.x0, y0: node.y0, x1: node.x1, y1: node.y1, w, h };

          const isCountry = node.level === 'country';
          const rowClickHandler = isCountry
            ? (coId: string) => {
                onSelect(node.id);
                onSelectContributingObjective?.(coId);
              }
            : undefined;

          const ctx = buildNodeRenderContext(
            node,
            rect,
            selectedId === node.id,
            hoverId === node.id,
            inSelectedSubtree || inHoverSubtree,
            dimmed,
            compareEnabled,
            hasChildrenInView,
            opacityMultiplier,
            rowClickHandler,
            selectedContributingObjectiveId,
          );
          return (
            <g
              key={node.id}
              transform={`translate(${node.x0},${node.y0})`}
              onMouseEnter={(e) => handleMouseEnter(node, e)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => handleClick(node, e)}
              className="transition-opacity duration-150"
            >
              {renderNode(ctx)}
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg px-3 py-2.5 text-xs shadow-xl"
          style={{
            left: tooltip.anchor.left + tooltip.anchor.width / 2,
            top: tooltip.anchor.top - 10,
            transform: 'translate(-50%, -100%)',
            maxWidth: 300,
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p className="font-semibold text-white" style={{ fontSize: 13 }}>{tooltip.node.name}</p>
          {tooltip.node.contributingObjectives && tooltip.node.contributingObjectives.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {tooltip.node.contributingObjectives.map((co) => (
                <div key={co.id} className="flex items-center gap-2" style={{ fontSize: 11 }}>
                  <span className="inline-block size-2 rounded-full" style={{ background: co.status === 'red' ? '#f87171' : co.status === 'yellow' ? '#fbbf24' : '#4ade80' }} />
                  <span className="truncate" style={{ color: '#D1D5DB', maxWidth: 180 }}>{co.title}</span>
                  <span style={{ color: '#9CA3AF' }}>{Math.round(co.progress)}%</span>
                </div>
              ))}
            </div>
          )}
          {!tooltip.node.contributingObjectives && (
            <div className="mt-1.5 flex items-center gap-3" style={{ fontSize: 11 }}>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-red-400" />
                {tooltip.node.statusCountsCurrent.red}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-amber-400" />
                {tooltip.node.statusCountsCurrent.yellow}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-emerald-400" />
                {tooltip.node.statusCountsCurrent.green}
              </span>
            </div>
          )}
          {compareEnabled && (
            <p className="mt-1" style={{ color: '#9CA3AF', fontSize: 11 }}>
              Risk {tooltip.node.riskScorePrev} → {tooltip.node.riskScoreCurrent}
              <span style={{ color: tooltip.node.deltaRiskScore > 0 ? '#f87171' : tooltip.node.deltaRiskScore < 0 ? '#4ade80' : '#9CA3AF' }}>
                {' '}({tooltip.node.deltaRiskScore >= 0 ? '+' : ''}{tooltip.node.deltaRiskScore})
              </span>
            </p>
          )}
          {tooltip.node.progressCurrent != null && (
            <p className="mt-0.5" style={{ color: '#9CA3AF', fontSize: 11 }}>
              Progress: {Math.round(tooltip.node.progressCurrent)}%
            </p>
          )}
          <p className="mt-0.5" style={{ color: '#6B7280', fontSize: 10 }}>
            {tooltip.node.objectiveCount} objectives · {tooltip.node.projectCount} projects
          </p>
          {tooltip.node.projectsPreview && tooltip.node.projectsPreview.length > 0 && (
            <div className="mt-1.5 border-t pt-1.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.05em' }} className="font-medium uppercase">Projects</p>
              <ul className="mt-1 space-y-0.5">
                {tooltip.node.projectsPreview.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                    <span className={`inline-block size-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status] ?? 'bg-slate-400'}`} />
                    <span className="truncate" style={{ color: '#D1D5DB' }}>{p.title}</span>
                  </li>
                ))}
                {tooltip.node.projectsPreview.length > 5 && (
                  <li style={{ color: '#6B7280', fontSize: 10 }}>+{tooltip.node.projectsPreview.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
