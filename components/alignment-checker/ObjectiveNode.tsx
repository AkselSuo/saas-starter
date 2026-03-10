'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Objective as ObjectiveType, OrgUnit as OrgUnitType } from '@/lib/alignment-checker/types';
import type { Node } from '@xyflow/react';
import { cn } from '@/lib/utils';

export type ObjectiveNodeData = {
  objective: ObjectiveType;
  orgUnit: OrgUnitType;
  projectCount: number;
  isFocused?: boolean;
  isInCascade?: boolean;
  isDimmed?: boolean;
  animateIn?: boolean;
};

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  return (
    <span
      className={cn(
        'size-2.5 shrink-0 rounded-full',
        status === 'green' && 'bg-emerald-500',
        status === 'yellow' && 'bg-amber-500',
        status === 'red' && 'bg-red-500'
      )}
      title={status}
    />
  );
}

type ObjectiveNodeType = Node<ObjectiveNodeData, 'objective'>;
function ObjectiveNodeComponent(props: NodeProps<ObjectiveNodeType>) {
  const { data, selected } = props;
  const { objective, projectCount, isFocused, isInCascade, isDimmed, animateIn } = data ?? {};
  const status = objective?.status ?? 'green';

  return (
    <div
      className={cn(
        'rounded-md border-2 bg-white px-2.5 py-1.5 shadow-sm transition-all duration-200',
        isDimmed && 'opacity-40',
        Boolean(selected) && 'border-primary ring-2 ring-primary/20',
        isFocused && 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/40',
        isInCascade && !isFocused && !selected && 'border-amber-400 bg-amber-50/80',
        status === 'red' && !selected && !isFocused && 'border-red-400 bg-red-50/80',
        status === 'yellow' && !selected && !isFocused && !isInCascade && 'border-amber-300 bg-amber-50/50',
        !selected && !isFocused && !isInCascade && status !== 'red' && status !== 'yellow' && 'border-gray-200 hover:border-gray-300',
        animateIn && 'alignment-node-enter'
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="flex items-center gap-2">
        {objective && <StatusDot status={objective.status} />}
        <span className="min-w-0 truncate text-xs font-medium text-gray-800">{objective?.title ?? ''}</span>
        {(projectCount ?? 0) > 0 && (
          <span className="shrink-0 text-[10px] text-gray-500">{projectCount} proj</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}

export const ObjectiveNode = memo(ObjectiveNodeComponent);
