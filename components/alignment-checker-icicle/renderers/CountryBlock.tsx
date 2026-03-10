'use client';

import React from 'react';
import type { NodeRenderContext } from './types';
import type { TrafficStatus, ContributingObjective, ProjectPreviewItem } from '@/lib/alignment-checker-icicle/types';

const STATUS_COLOR: Record<TrafficStatus, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E6E8EB';
const CARD_RADIUS = 7;
const ACCENT_W = 4;
const PAD = 10;
const HEADER_MIN = 28;
const OBJ_TITLE_H = 20;
const PROJ_ROW_H = 16;
const PROJ_DOT_R = 3;
const SEP_COLOR = '#F0F1F3';
const DOT_R = 4;
const FONT_FAMILY = 'system-ui, sans-serif';
const MAX_PROJECTS_PER_OBJ = 3;

function CompactFallback({ ctx }: { ctx: NodeRenderContext }) {
  const { node, rect, selected, hovered, dimmed } = ctx;
  const opacity = (dimmed ? 0.2 : 1) * (ctx.opacityMultiplier ?? 1);
  const accentColor = STATUS_COLOR[node.status];
  const fontSize = Math.min(12, Math.max(10, rect.w / 20));
  const maxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 2) / (fontSize * 0.58)));
  const label = node.name.length > maxChars ? node.name.slice(0, maxChars) + '…' : node.name;

  return (
    <g opacity={opacity}>
      <rect
        width={rect.w}
        height={rect.h}
        rx={CARD_RADIUS}
        fill={CARD_BG}
        stroke={selected ? '#3B82F6' : hovered ? 'rgba(59,130,246,0.45)' : CARD_BORDER}
        strokeWidth={selected ? 2 : hovered ? 2 : 1}
        filter={selected ? 'url(#card-shadow-strong)' : hovered ? 'url(#card-shadow-hover)' : undefined}
      />
      <rect x={0} y={CARD_RADIUS} width={ACCENT_W} height={rect.h - CARD_RADIUS * 2} fill={accentColor} className="pointer-events-none" />
      <rect x={0} y={0} width={ACCENT_W} height={rect.h} rx={CARD_RADIUS} fill={accentColor} clipPath={`inset(0 ${rect.w - ACCENT_W}px 0 0)`} className="pointer-events-none" />
      {rect.w >= 40 && rect.h >= 18 && (
        <text x={ACCENT_W + PAD} y={rect.h / 2} dy="0.35em" fill="#1e293b" fontSize={fontSize} fontWeight={600} fontFamily={FONT_FAMILY} className="pointer-events-none">
          {label}
        </text>
      )}
    </g>
  );
}

interface ObjectiveSection {
  co: ContributingObjective;
  projects: ProjectPreviewItem[];
  moreCount: number;
  totalH: number;
}

function planSections(
  objectives: ContributingObjective[],
  availableH: number,
  showProjectDetails: boolean,
): { sections: ObjectiveSection[]; overflowObjectives: number } {
  const sections: ObjectiveSection[] = [];
  let usedH = 0;

  for (const co of objectives) {
    const titleH = OBJ_TITLE_H;
    if (usedH + titleH > availableH) break;

    let projsToShow: ProjectPreviewItem[] = [];
    let moreCount = 0;
    let blockH = titleH;

    if (showProjectDetails && co.projects.length > 0) {
      const remainingH = availableH - usedH - titleH;
      const maxBySpace = Math.max(0, Math.floor(remainingH / PROJ_ROW_H));
      const maxProjs = Math.min(maxBySpace, MAX_PROJECTS_PER_OBJ, co.projects.length);

      if (maxProjs > 0) {
        projsToShow = co.projects.slice(0, maxProjs);
        moreCount = co.projects.length - maxProjs;
        blockH += maxProjs * PROJ_ROW_H;
        if (moreCount > 0) blockH += PROJ_ROW_H;
      }
    }

    usedH += blockH;
    sections.push({ co, projects: projsToShow, moreCount, totalH: blockH });
  }

  return { sections, overflowObjectives: objectives.length - sections.length };
}

export function CountryBlock({ ctx }: { ctx: NodeRenderContext }) {
  const { node, rect, selected, hovered, dimmed, onRowClick, selectedContributingObjectiveId } = ctx;
  const objectives = node.contributingObjectives ?? [];
  const opacity = (dimmed ? 0.2 : 1) * (ctx.opacityMultiplier ?? 1);
  const accentColor = STATUS_COLOR[node.status];

  if (objectives.length === 0 || rect.h < HEADER_MIN + OBJ_TITLE_H || rect.w < 60) {
    return <CompactFallback ctx={ctx} />;
  }

  const headerH = Math.min(32, Math.max(HEADER_MIN, rect.h * 0.18));
  const availableH = rect.h - headerH - 4;
  const showProjectDetails = rect.w >= 140;

  const { sections, overflowObjectives } = planSections(objectives, availableH, showProjectDetails);

  const headerFontSize = Math.min(14, Math.max(11, rect.w / 18));
  const objFontSize = Math.min(12, Math.max(10, rect.w / 24));
  const projFontSize = Math.min(10, Math.max(9, rect.w / 28));
  const countryLabel = node.name;
  const headerMaxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 2) / (headerFontSize * 0.58)));
  const headerLabel = countryLabel.length > headerMaxChars ? countryLabel.slice(0, headerMaxChars) + '…' : countryLabel;
  const objMaxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 2 - DOT_R * 2 - 14 - 40) / (objFontSize * 0.56)));
  const projMaxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 3 - PROJ_DOT_R * 2 - 10) / (projFontSize * 0.52)));

  const sectionYOffsets: number[] = [];
  let accY = headerH;
  for (const s of sections) {
    sectionYOffsets.push(accY);
    accY += s.totalH;
  }

  return (
    <g opacity={opacity}>
      <rect
        width={rect.w}
        height={rect.h}
        rx={CARD_RADIUS}
        fill={CARD_BG}
        stroke={selected ? '#3B82F6' : hovered ? 'rgba(59,130,246,0.45)' : CARD_BORDER}
        strokeWidth={selected ? 2 : hovered ? 2 : 1}
        filter={selected ? 'url(#card-shadow-strong)' : hovered ? 'url(#card-shadow-hover)' : undefined}
      />
      <rect x={0} y={CARD_RADIUS} width={ACCENT_W} height={rect.h - CARD_RADIUS * 2} fill={accentColor} className="pointer-events-none" />
      <rect x={0} y={0} width={ACCENT_W} height={rect.h} rx={CARD_RADIUS} fill={accentColor} clipPath={`inset(0 ${rect.w - ACCENT_W}px 0 0)`} className="pointer-events-none" />

      <text
        x={ACCENT_W + PAD}
        y={headerH / 2}
        dy="0.35em"
        fill="#0f172a"
        fontSize={headerFontSize}
        fontWeight={700}
        fontFamily={FONT_FAMILY}
        className="pointer-events-none"
      >
        {headerLabel}
      </text>
      <line x1={ACCENT_W + 4} y1={headerH} x2={rect.w - 4} y2={headerH} stroke={SEP_COLOR} strokeWidth={1} className="pointer-events-none" />

      {sections.map((section, sIdx) => {
        const { co, projects: projs, moreCount } = section;
        const sectionY = sectionYOffsets[sIdx];
        const isSelectedRow = selectedContributingObjectiveId === co.id;
        const coLabel = co.title.length > objMaxChars ? co.title.slice(0, objMaxChars) + '…' : co.title;
        const showProgress = rect.w >= 160;

        return (
          <g key={co.id}>
            <rect
              x={ACCENT_W}
              y={sectionY}
              width={rect.w - ACCENT_W}
              height={section.totalH}
              fill={isSelectedRow ? 'rgba(59,130,246,0.08)' : 'transparent'}
              rx={0}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onRowClick?.(co.id);
              }}
            >
              <title>{co.title} — {Math.round(co.progress)}% — {co.projectCount} projects</title>
            </rect>

            {sIdx > 0 && (
              <line
                x1={ACCENT_W + 6}
                y1={sectionY}
                x2={rect.w - 6}
                y2={sectionY}
                stroke={SEP_COLOR}
                strokeWidth={0.5}
                className="pointer-events-none"
              />
            )}

            <circle
              cx={ACCENT_W + PAD + DOT_R}
              cy={sectionY + OBJ_TITLE_H / 2}
              r={DOT_R}
              fill={STATUS_COLOR[co.status]}
              className="pointer-events-none"
            />

            <text
              x={ACCENT_W + PAD + DOT_R * 2 + 8}
              y={sectionY + OBJ_TITLE_H / 2}
              dy="0.35em"
              fill="#334155"
              fontSize={objFontSize}
              fontWeight={500}
              fontFamily={FONT_FAMILY}
              className="pointer-events-none"
            >
              {coLabel}
            </text>

            {showProgress && (
              <text
                x={rect.w - PAD}
                y={sectionY + OBJ_TITLE_H / 2}
                dy="0.35em"
                textAnchor="end"
                fill="#94a3b8"
                fontSize={projFontSize}
                fontFamily={FONT_FAMILY}
                className="pointer-events-none"
              >
                {Math.round(co.progress)}%
              </text>
            )}

            {projs.map((p, pIdx) => {
              const py = sectionY + OBJ_TITLE_H + pIdx * PROJ_ROW_H;
              const pLabel = p.title.length > projMaxChars ? p.title.slice(0, projMaxChars) + '…' : p.title;
              return (
                <g key={p.id} className="pointer-events-none">
                  <circle
                    cx={ACCENT_W + PAD + 10 + PROJ_DOT_R}
                    cy={py + PROJ_ROW_H / 2}
                    r={PROJ_DOT_R}
                    fill={STATUS_COLOR[p.status]}
                  />
                  <text
                    x={ACCENT_W + PAD + 10 + PROJ_DOT_R * 2 + 5}
                    y={py + PROJ_ROW_H / 2}
                    dy="0.35em"
                    fill="#64748b"
                    fontSize={projFontSize}
                    fontWeight={400}
                    fontFamily={FONT_FAMILY}
                  >
                    {pLabel}
                  </text>
                </g>
              );
            })}

            {moreCount > 0 && (
              <text
                x={ACCENT_W + PAD + 10}
                y={sectionY + OBJ_TITLE_H + projs.length * PROJ_ROW_H + PROJ_ROW_H / 2}
                dy="0.35em"
                fill="#94a3b8"
                fontSize={projFontSize - 1}
                fontFamily={FONT_FAMILY}
                className="pointer-events-none"
              >
                +{moreCount} more
              </text>
            )}

            {isSelectedRow && (
              <rect
                x={ACCENT_W}
                y={sectionY}
                width={3}
                height={section.totalH}
                fill="#3B82F6"
                className="pointer-events-none"
              />
            )}
          </g>
        );
      })}

      {overflowObjectives > 0 && (
        <text
          x={ACCENT_W + PAD}
          y={rect.h - 4}
          fill="#94a3b8"
          fontSize={9}
          fontFamily={FONT_FAMILY}
          className="pointer-events-none"
        >
          +{overflowObjectives} more
        </text>
      )}
    </g>
  );
}
