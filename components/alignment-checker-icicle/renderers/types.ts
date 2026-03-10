import type { IcicleNode, StatusCounts } from '@/lib/alignment-checker-icicle/types';

export interface RenderRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  w: number;
  h: number;
}

export interface NodeRenderContext {
  node: IcicleNode;
  rect: RenderRect;
  aggregatesCurrent: StatusCounts;
  aggregatesPrev: StatusCounts;
  deltas: { riskScore: number; red: number; yellow: number; green: number };
  priorityScore: number;
  impactScore: number;
  impactBadges: string[];
  selected: boolean;
  hovered: boolean;
  inSubtree: boolean;
  dimmed: boolean;
  fitsLabel: boolean;
  fitsBadges: boolean;
  compareEnabled: boolean;
  hasChildrenInView: boolean;
  /** 0..1 for legend filter + deterioration filter. */
  opacityMultiplier?: number;
  /** Called when a contributing objective row is clicked inside a country block. */
  onRowClick?: (contributingObjectiveId: string) => void;
  /** Currently selected contributing objective id (for highlighting the active row). */
  selectedContributingObjectiveId?: string | null;
}
