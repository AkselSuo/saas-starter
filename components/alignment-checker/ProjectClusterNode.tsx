'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Project } from '@/lib/alignment-checker/types';
import { cn } from '@/lib/utils';

export type ProjectClusterNodeData = {
  objectiveId: string;
  orgUnitId: string;
  projectCount: number;
  projects: Project[];
  isInCascade?: boolean;
  isDimmed?: boolean;
  animateIn?: boolean;
};

type ProjectClusterNodeType = Node<ProjectClusterNodeData, 'projectCluster'>;
function ProjectClusterNodeComponent(props: NodeProps<ProjectClusterNodeType>) {
  const { data } = props;
  const { projectCount, isInCascade, isDimmed, animateIn } = data ?? {};

  return (
    <div
      className={cn(
        'rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-center text-xs text-gray-600 transition-all duration-200',
        isDimmed && 'opacity-40',
        animateIn && 'alignment-node-enter'
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <span className={isInCascade ? 'font-medium' : ''}>{projectCount} projects</span>
    </div>
  );
}

export const ProjectClusterNode = memo(ProjectClusterNodeComponent);
