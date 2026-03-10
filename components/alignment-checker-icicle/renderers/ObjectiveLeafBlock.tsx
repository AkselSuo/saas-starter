'use client';

import React from 'react';
import type { NodeRenderContext } from './types';
import type { TrafficStatus } from '@/lib/alignment-checker-icicle/types';

const STATUS_COLOR: Record<TrafficStatus, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const PILL_BG: Record<TrafficStatus, string> = { green: '#f0fdf4', yellow: '#fefce8', red: '#fef2f2' };
const PILL_TEXT: Record<TrafficStatus, string> = { green: '#15803d', yellow: '#a16207', red: '#b91c1c' };
const STATUS_LABEL: Record<TrafficStatus, string> = { green: 'On track', yellow: 'At risk', red: 'Off track' };
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E6E8EB';
const CARD_RADIUS = 6;
const ACCENT_W = 3;
const PAD = 8;
const PILL_H = 16;
const PILL_RX = 8;
const PILL_DOT_R = 3;
const PILL_FONT = 9;

export function ObjectiveLeafBlock({ ctx }: { ctx: NodeRenderContext }) {
  const { node, rect, deltas, selected, hovered, dimmed, fitsLabel, compareEnabled } = ctx;
  const accentColor = STATUS_COLOR[node.status];
  const opacity = (dimmed ? 0.2 : 1) * (ctx.opacityMultiplier ?? 1);
  const fontSize = Math.min(11, Math.max(10, rect.w / 24));
  const maxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 2) / (fontSize * 0.56)));
  const label = node.name.length > maxChars ? node.name.slice(0, maxChars) + '…' : node.name;

  const statusText = STATUS_LABEL[node.status];
  const statusPillTextW = statusText.length * (PILL_FONT * 0.55);
  const statusPillW = PILL_DOT_R * 2 + 6 + statusPillTextW + 8;
  const showStatusPill = rect.w >= 70 && rect.h >= 40;
  const showStatusPillCompact = !showStatusPill && rect.w >= 30 && rect.h >= 20;

  const showTrend = compareEnabled && deltas.riskScore !== 0 && rect.w > 80 && rect.h >= 40;
  const trendWorsening = deltas.riskScore > 0;
  const trendBg = trendWorsening ? '#fef2f2' : '#f0fdf4';
  const trendBorder = trendWorsening ? '#ef4444' : '#22c55e';
  const trendTextColor = trendWorsening ? '#b91c1c' : '#15803d';
  const trendLabel = `${trendWorsening ? '▲' : '▼'} ${Math.abs(deltas.riskScore)}`;
  const trendPillW = trendLabel.length * (PILL_FONT * 0.58) + 12;

  return (
    <g opacity={opacity}>
      <rect
        width={rect.w}
        height={rect.h}
        rx={CARD_RADIUS}
        fill={CARD_BG}
        stroke={selected ? '#3B82F6' : hovered ? 'rgba(59,130,246,0.45)' : CARD_BORDER}
        strokeWidth={selected ? 2 : hovered ? 1.5 : 1}
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
        <text
          x={ACCENT_W + PAD}
          y={PAD + fontSize * 0.85}
          fill="#334155"
          fontSize={fontSize}
          fontWeight={500}
          fontFamily="system-ui, sans-serif"
          className="pointer-events-none"
        >
          {label}
        </text>
      )}
      {showStatusPill && (
        <g className="pointer-events-none" transform={`translate(${ACCENT_W + PAD}, ${rect.h - PAD - PILL_H})`}>
          <rect width={statusPillW} height={PILL_H} rx={PILL_RX} fill={PILL_BG[node.status]} stroke={STATUS_COLOR[node.status]} strokeWidth={0.5} strokeOpacity={0.3} />
          <circle cx={8} cy={PILL_H / 2} r={PILL_DOT_R} fill={STATUS_COLOR[node.status]} />
          <text x={8 + PILL_DOT_R + 5} y={PILL_H / 2} dy="0.35em" fill={PILL_TEXT[node.status]} fontSize={PILL_FONT} fontWeight={600} fontFamily="system-ui, sans-serif">
            {statusText}
          </text>
        </g>
      )}
      {showStatusPillCompact && !showStatusPill && (
        <circle cx={ACCENT_W + PAD + 4} cy={rect.h - PAD - 2} r={PILL_DOT_R} fill={accentColor} className="pointer-events-none" />
      )}
      {showTrend && (
        <g className="pointer-events-none" transform={`translate(${rect.w - PAD - trendPillW}, ${PAD - 1})`}>
          <rect width={trendPillW} height={PILL_H} rx={PILL_RX} fill={trendBg} stroke={trendBorder} strokeWidth={0.5} strokeOpacity={0.35} />
          <text x={trendPillW / 2} y={PILL_H / 2} dy="0.35em" textAnchor="middle" fill={trendTextColor} fontSize={PILL_FONT} fontWeight={600} fontFamily="system-ui, sans-serif">
            {trendLabel}
          </text>
        </g>
      )}
    </g>
  );
}
