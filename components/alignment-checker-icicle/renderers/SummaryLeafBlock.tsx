'use client';

import React from 'react';
import type { NodeRenderContext } from './types';
import type { TrafficStatus, StatusCounts } from '@/lib/alignment-checker-icicle/types';

const STATUS_COLOR: Record<TrafficStatus, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const PILL_BG: Record<TrafficStatus, string> = { green: '#f0fdf4', yellow: '#fefce8', red: '#fef2f2' };
const PILL_TEXT: Record<TrafficStatus, string> = { green: '#15803d', yellow: '#a16207', red: '#b91c1c' };
const STATUS_LABEL: Record<TrafficStatus, string> = { green: 'On track', yellow: 'At risk', red: 'Off track' };
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E6E8EB';
const CARD_RADIUS = 7;
const ACCENT_W = 4;
const PAD = 10;
const PILL_H = 18;
const PILL_GAP = 5;
const PILL_RX = 9;
const PILL_DOT_R = 3;
const PILL_FONT = 10;

const TREND_PILL_H = 18;
const TREND_PILL_RX = 9;
const TREND_PILL_FONT = 9;

function StatusPills({ counts, x, y, maxW }: { counts: StatusCounts; x: number; y: number; maxW: number }) {
  const entries: { status: TrafficStatus; count: number }[] = [];
  if (counts.red > 0) entries.push({ status: 'red', count: counts.red });
  if (counts.yellow > 0) entries.push({ status: 'yellow', count: counts.yellow });
  if (counts.green > 0) entries.push({ status: 'green', count: counts.green });
  if (entries.length === 0) return null;

  let cx = x;
  return (
    <g className="pointer-events-none">
      {entries.map((e) => {
        const text = `${e.count} ${STATUS_LABEL[e.status]}`;
        const textW = text.length * (PILL_FONT * 0.55);
        const pillW = PILL_DOT_R * 2 + 6 + textW + 8;
        if (cx + pillW > x + maxW) return null;
        const px = cx;
        cx += pillW + PILL_GAP;
        return (
          <g key={e.status} transform={`translate(${px}, ${y})`}>
            <rect width={pillW} height={PILL_H} rx={PILL_RX} fill={PILL_BG[e.status]} stroke={STATUS_COLOR[e.status]} strokeWidth={0.5} strokeOpacity={0.3} />
            <circle cx={8} cy={PILL_H / 2} r={PILL_DOT_R} fill={STATUS_COLOR[e.status]} />
            <text x={8 + PILL_DOT_R + 5} y={PILL_H / 2} dy="0.35em" fill={PILL_TEXT[e.status]} fontSize={PILL_FONT} fontWeight={600} fontFamily="system-ui, sans-serif">
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

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
      <text x={pillW / 2} y={TREND_PILL_H / 2} dy="0.35em" textAnchor="middle" fill={textColor} fontSize={TREND_PILL_FONT} fontWeight={600} fontFamily="system-ui, sans-serif">
        {label}
      </text>
    </g>
  );
}

export function SummaryLeafBlock({ ctx }: { ctx: NodeRenderContext }) {
  const { node, rect, aggregatesCurrent, deltas, selected, hovered, dimmed, fitsLabel, compareEnabled } = ctx;
  const accentColor = STATUS_COLOR[node.status];
  const opacity = (dimmed ? 0.2 : 1) * (ctx.opacityMultiplier ?? 1);
  const fontSize = Math.min(12, Math.max(11, rect.w / 22));
  const maxChars = Math.max(4, Math.floor((rect.w - ACCENT_W - PAD * 2) / (fontSize * 0.58)));
  const label = node.name.length > maxChars ? node.name.slice(0, maxChars) + '…' : node.name;
  const { red: r, yellow: y, green: g } = aggregatesCurrent;
  const total = r + y + g;
  const showTrend = compareEnabled && deltas.riskScore !== 0 && rect.w > 80;
  const showPills = total > 0 && rect.w >= 80 && rect.h >= 52;

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
            y={PAD + fontSize * 0.85}
            fill="#1e293b"
            fontSize={fontSize}
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
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
      {showPills && (
        <StatusPills
          counts={aggregatesCurrent}
          x={ACCENT_W + PAD}
          y={rect.h - PAD - PILL_H}
          maxW={rect.w - ACCENT_W - PAD * 2}
        />
      )}
      {!showPills && total > 0 && fitsLabel && rect.h >= 38 && (
        <g className="pointer-events-none">
          <text
            x={ACCENT_W + PAD}
            y={PAD + fontSize * 0.85 + fontSize + 4}
            fill="#94a3b8"
            fontSize={10}
            fontFamily="system-ui, sans-serif"
          >
            {node.projectCount > 0 ? `${node.projectCount} projects` : `${total} items`}
          </text>
        </g>
      )}
    </g>
  );
}
