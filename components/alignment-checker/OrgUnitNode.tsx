'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { OrgUnit as OrgUnitType } from '@/lib/alignment-checker/types';
import type { Node } from '@xyflow/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function TrafficLights({ g, y, r }: { g: number; y: number; r: number }) {
  return (
    <div className="flex items-center gap-1">
      {([
        ['green', g, 'bg-emerald-500'],
        ['yellow', y, 'bg-amber-500'],
        ['red', r, 'bg-red-500'],
      ] as const).map(([color, count, bg]) =>
        count > 0 ? (
          <span
            key={color}
            className={cn('size-2.5 rounded-full', bg)}
            title={`${color}: ${count}`}
          />
        ) : null
      )}
    </div>
  );
}

export type OrgUnitNodeData = {
  orgUnit: OrgUnitType;
  objectiveCount: number;
  projectCount: number;
  isExpanded?: boolean;
  isHighlighted?: boolean;
  hasRedBelow?: boolean;
  isDimmed?: boolean;
  animateIn?: boolean;
};

type OrgUnitNodeType = Node<OrgUnitNodeData, 'orgUnit'>;
function OrgUnitNodeComponent(props: NodeProps<OrgUnitNodeType>) {
  const { data, selected } = props;
  const { orgUnit, objectiveCount, projectCount, isExpanded, isHighlighted, hasRedBelow, isDimmed, animateIn } = data ?? {};
  const { name, metricsSummary, status } = orgUnit ?? { name: '', metricsSummary: { green: 0, yellow: 0, red: 0 }, status: 'green' as const };
  const hasChildren = (objectiveCount ?? 0) > 0;
  const isRed = status === 'red';
  const isParentOfRed = hasRedBelow && !isRed;

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-white px-3 py-2 shadow-sm transition-all duration-200',
        isDimmed && 'opacity-40',
        Boolean(selected) && 'border-primary ring-2 ring-primary/20',
        isHighlighted && !selected && 'border-amber-500 bg-amber-50 ring-1 ring-amber-400/50',
        isRed && !selected && 'border-red-500 bg-red-50/90',
        isParentOfRed && !selected && !isHighlighted && 'border-amber-400 bg-amber-50/70',
        !selected && !isHighlighted && !isRed && !isParentOfRed && 'border-gray-200 hover:border-gray-300',
        isExpanded && 'ring-inset ring-2 ring-gray-300/60',
        animateIn && 'alignment-node-enter'
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {hasChildren && (
            <span
              className={cn(
                'shrink-0 text-gray-400 transition-transform',
                isExpanded && 'rotate-90'
              )}
              aria-hidden
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight className="size-4" />
            </span>
          )}
          <span className="truncate text-sm font-medium text-gray-900">{name}</span>
        </div>
        <TrafficLights
          g={metricsSummary.green}
          y={metricsSummary.yellow}
          r={metricsSummary.red}
        />
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
        <span>{objectiveCount} obj</span>
        <span>·</span>
        <span>{projectCount} proj</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}

export const OrgUnitNode = memo(OrgUnitNodeComponent);
