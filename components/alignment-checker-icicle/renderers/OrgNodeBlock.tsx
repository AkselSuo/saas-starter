'use client';

import React from 'react';
import type { NodeRenderContext } from './types';
import type { TrafficStatus } from '@/lib/alignment-checker-icicle/types';

const STATUS_COLOR: Record<TrafficStatus, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const STATUS_SORT: Record<TrafficStatus, number> = { red: 0, yellow: 1, green: 2 };
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E6E8EB';
const CARD_RADIUS = 7;
const ACCENT_W = 4;
const PAD = 10;
const DOT_R = 3.5;
const PROJ_ROW_H = 18;
const PROJ_FONT = 11;
const FONT_FAMILY = 'system-ui, sans-serif';

const TREND_PILL_H = 18;
const TREND_PILL_RX = 9;
const TREND_PILL_FONT = 9;

function TrendPill({ x, y, delta }: { x: number; y: number; delta: number }) {
  if (delta === 0) return null;
  const worsening = delta > 0;
  const bg = worsening ? '#fef2f2' : '#f0fdf4';
  const border = worsening ? '#ef4444' : '#22c55e';
  const textColor = worsening ? '#b91c1c' : '#15803d';
  const arrow = worsening ? '▲' : '▼';
  const label = `${arrow} ${Math.abs(delta)}`;
  const textW = label.length * (TREND_PILL_FONT * 0.58);
  const pillW = textW + 14;
  return (
    <g className="pointer-events-none" transform={`translate(${x}, ${y})`}>
      <rect width={pillW} height={TREND_PILL_H} rx={TREND_PILL_RX} fill={bg} stroke={border} strokeWidth={0.5} strokeOpacity={0.35} />
      <text x={pillW / 2} y={TREND_PILL_H / 2} dy="0.35em" textAnchor="middle" fill={textColor} fontSize={TREND_PILL_FONT} fontWeight={600} fontFamily={FONT_FAMILY}>
        {label}
      </text>
    </g>
  );
}

export function OrgNodeBlock({ ctx }: { ctx: NodeRenderContext }) {
  const { node, rect, deltas, selected, hovered, dimmed, fitsLabel, compareEnabled } = ctx;
  const status = node.status;
  const accentColor = STATUS_COLOR[status];
  const opacity = (dimmed ? 0.2 : 1) * (ctx.opacityMultiplier ?? 1);
  const isGrowth = node.depth === 0;
  const titleFontSize = isGrowth ? Math.min(15, Math.max(12, rect.w / 20)) : Math.min(13, Math.max(11, rect.w / 22));
  const maxChars = Math.max(6, Math.floor((rect.w - ACCENT_W - PAD * 2) / (titleFontSize * 0.58)));
  const label = node.name.length > maxChars ? node.name.slice(0, maxChars) + '…' : node.name;
  const showTrend = compareEnabled && deltas.riskScore !== 0 && rect.w > 100;

  const projects = node.projectsPreview
    ? [...node.projectsPreview].sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status])
    : [];
  const totalProjects = node.projectCount ?? projects.length;

  const titleBottomY = PAD + titleFontSize * 0.85 + 6;
  const availableH = rect.h - titleBottomY - PAD;
  const maxVisibleProjects = Math.max(0, Math.floor(availableH / PROJ_ROW_H));
  const maxProjectsToShow = Math.min(maxVisibleProjects, 3);
  const showProjects = fitsLabel && rect.w >= 100 && rect.h >= 52 && projects.length > 0 && maxProjectsToShow > 0;
  const displayedProjects = projects.slice(0, maxProjectsToShow);
  const remaining = totalProjects - maxProjectsToShow;
  const projMaxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 2 - DOT_R * 2 - 12) / (PROJ_FONT * 0.55)));

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
      <rect
        x={0}
        y={CARD_RADIUS}
        width={ACCENT_W}
        height={rect.h - CARD_RADIUS * 2}
        fill={accentColor}
        className="pointer-events-none"
      />
      <rect
        x={0}
        y={0}
        width={ACCENT_W}
        height={rect.h}
        rx={CARD_RADIUS}
        fill={accentColor}
        clipPath={`inset(0 ${rect.w - ACCENT_W}px 0 0)`}
        className="pointer-events-none"
      />
      {fitsLabel && (
        <g className="pointer-events-none">
          <text
            x={ACCENT_W + PAD}
            y={PAD + titleFontSize * 0.85}
            fill="#1e293b"
            fontSize={titleFontSize}
            fontWeight={600}
            fontFamily={FONT_FAMILY}
          >
            {label}
          </text>
        </g>
      )}
      {showTrend && (
        <TrendPill
          x={rect.w - PAD - (Math.abs(deltas.riskScore).toString().length + 3) * (TREND_PILL_FONT * 0.58) - 14}
          y={PAD - 1}
          delta={deltas.riskScore}
        />
      )}
      {showProjects && (
        <g className="pointer-events-none">
          {displayedProjects.map((p, idx) => {
            const rowY = titleBottomY + idx * PROJ_ROW_H;
            const projLabel = p.title.length > projMaxChars ? p.title.slice(0, projMaxChars) + '…' : p.title;
            return (
              <g key={p.id}>
                <circle
                  cx={ACCENT_W + PAD + DOT_R}
                  cy={rowY + PROJ_ROW_H / 2}
                  r={DOT_R}
                  fill={STATUS_COLOR[p.status]}
                />
                <text
                  x={ACCENT_W + PAD + DOT_R * 2 + 6}
                  y={rowY + PROJ_ROW_H / 2}
                  dy="0.35em"
                  fill="#475569"
                  fontSize={PROJ_FONT}
                  fontWeight={500}
                  fontFamily={FONT_FAMILY}
                >
                  {projLabel}
                </text>
              </g>
            );
          })}
          {remaining > 0 && (
            <text
              x={ACCENT_W + PAD}
              y={titleBottomY + maxProjectsToShow * PROJ_ROW_H + PROJ_ROW_H / 2}
              dy="0.35em"
              fill="#94a3b8"
              fontSize={10}
              fontFamily={FONT_FAMILY}
            >
              +{remaining} more
            </text>
          )}
        </g>
      )}
    </g>
  );
}
