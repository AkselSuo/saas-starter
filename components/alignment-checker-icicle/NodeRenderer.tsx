'use client';

import React from 'react';
import type { IcicleNode } from '@/lib/alignment-checker-icicle/types';
import type { NodeRenderContext, RenderRect } from './renderers/types';
import { OrgNodeBlock } from './renderers/OrgNodeBlock';
import { CountryBlock } from './renderers/CountryBlock';
import { ObjectiveLeafBlock } from './renderers/ObjectiveLeafBlock';

const MIN_LABEL_W = 40;
const MIN_LABEL_H = 18;
const MIN_BADGE_W = 52;
const MIN_BADGE_H = 22;

export type IcicleNodeRenderType = 'org' | 'country' | 'objectiveLeaf';

export function getNodeRenderType(
  node: IcicleNode,
): IcicleNodeRenderType {
  if (node.level === 'project') return 'objectiveLeaf';
  if (node.level === 'country') return 'country';
  return 'org';
}

export function renderNode(
  ctx: NodeRenderContext
): React.ReactElement {
  const type = getNodeRenderType(ctx.node);

  switch (type) {
    case 'org':
      return <OrgNodeBlock key={ctx.node.id} ctx={ctx} />;
    case 'country':
      return <CountryBlock key={ctx.node.id} ctx={ctx} />;
    case 'objectiveLeaf':
      return <ObjectiveLeafBlock key={ctx.node.id} ctx={ctx} />;
    default:
      return <OrgNodeBlock key={ctx.node.id} ctx={ctx} />;
  }
}

export function buildNodeRenderContext(
  node: IcicleNode,
  rect: RenderRect,
  selected: boolean,
  hovered: boolean,
  inSubtree: boolean,
  dimmed: boolean,
  compareEnabled: boolean,
  hasChildrenInView: boolean,
  opacityMultiplier?: number,
  onRowClick?: (contributingObjectiveId: string) => void,
  selectedContributingObjectiveId?: string | null,
): NodeRenderContext {
  const fitsLabel = rect.w >= MIN_LABEL_W && rect.h >= MIN_LABEL_H;
  const fitsBadges = rect.w >= MIN_BADGE_W && rect.h >= MIN_BADGE_H;
  const renderType = getNodeRenderType(node);
  const useSummaryLeaf = renderType === 'country' && !hasChildrenInView;

  return {
    node,
    rect,
    aggregatesCurrent: node.statusCountsCurrent,
    aggregatesPrev: node.statusCountsPrev,
    deltas: {
      riskScore: node.deltaRiskScore,
      red: node.deltaRed,
      yellow: node.deltaYellow,
      green: node.deltaGreen,
    },
    priorityScore: node.priorityScore ?? 0,
    impactScore: node.impactScore ?? 0,
    impactBadges: node.impactBadges ?? [],
    selected,
    hovered,
    inSubtree,
    dimmed,
    fitsLabel: fitsLabel && (useSummaryLeaf ? rect.h >= 28 : true),
    fitsBadges,
    compareEnabled,
    hasChildrenInView,
    opacityMultiplier: opacityMultiplier ?? 1,
    onRowClick,
    selectedContributingObjectiveId,
  };
}
