/**
 * Custom icicle layout — proper waterfall/partition.
 *
 * Each depth level gets a horizontal band (row).
 * Within each band, children split their parent's width proportionally by value.
 *
 * Visual result (top-down):
 *   ┌────── Growth Objective ───────┐  ← depth 0
 *   ├── Finland ──┬──── Denmark ────┤  ← depth 1 (countries with internal objective rows)
 *   ├─Proj─┬─Proj─┤──Proj──┬─Proj──┤  ← depth 2 (projects)
 *   └──────────────────────────────┘
 */

import type { HierarchyNode } from 'd3';

export interface IcicleLayoutOptions {
  /** Horizontal padding between sibling nodes in px (default 4). */
  padding?: number;
  /** Vertical gap between depth bands in px (default 4). */
  verticalGap?: number;
  /** Max depth to include in band calculation (default: auto from tree). */
  maxDepth?: number;
  /** Horizontal offset applied to all node positions (default 0). */
  offsetX?: number;
  /** Vertical offset applied to all node positions (default 0). */
  offsetY?: number;
  /** Minimum content width by depth (px) so blocks do not get too cramped. Depth 0/1 none, 2 = org units, 3+ = projects. */
  minWidthByDepth?: (depth: number) => number;
}

const DEFAULT_OPTS: Omit<Required<IcicleLayoutOptions>, 'maxDepth' | 'offsetX' | 'offsetY'> = {
  padding: 4,
  verticalGap: 4,
};

export type LaidOutNode<T> = HierarchyNode<T> & { x0: number; x1: number; y0: number; y1: number };

export function layoutIcicle<T>(
  root: HierarchyNode<T>,
  width: number,
  height: number,
  options?: IcicleLayoutOptions
): void {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const opts = { ...DEFAULT_OPTS, ...options };
  const pad = opts.padding ?? DEFAULT_OPTS.padding;
  const vGap = opts.verticalGap ?? DEFAULT_OPTS.verticalGap;
  const offX = options?.offsetX ?? 0;
  const offY = options?.offsetY ?? 0;

  let treeMaxDepth = 0;
  root.each((n) => { if (n.depth > treeMaxDepth) treeMaxDepth = n.depth; });
  const maxDepth = opts.maxDepth != null ? Math.min(opts.maxDepth, treeMaxDepth) : treeMaxDepth;
  const levels = maxDepth + 1;
  const totalVGap = vGap * (levels - 1);
  const bandH = (h - totalVGap) / levels;

  const getMinWidth = opts.minWidthByDepth;

  function assign(node: HierarchyNode<T>, x0: number, x1: number): void {
    const n = node as LaidOutNode<T>;
    const d = node.depth;
    n.x0 = x0 + offX;
    n.x1 = x1 + offX;
    n.y0 = d * (bandH + vGap) + offY;
    n.y1 = d * (bandH + vGap) + bandH + offY;

    const children = node.children;
    if (!children || children.length === 0) return;

    const totalValue = children.reduce((s, c) => s + (c.value ?? 0), 0) || 1;
    const parentW = x1 - x0;

    if (getMinWidth) {
      let totalMinSegment = 0;
      for (const child of children) {
        const minW = getMinWidth(child.depth) ?? 0;
        totalMinSegment += minW + 2 * pad;
      }
      const remaining = parentW - totalMinSegment;
      if (remaining >= 0) {
        let x = x0;
        for (const child of children) {
          const minW = getMinWidth(child.depth) ?? 0;
          const frac = (child.value ?? 0) / totalValue;
          const cw = Math.max(1, minW + 2 * pad + remaining * frac);
          assign(child, x + pad, x + cw - pad);
          x += cw;
        }
        return;
      }
    }

    let x = x0;
    for (const child of children) {
      const frac = (child.value ?? 0) / totalValue;
      const cw = Math.max(1, parentW * frac);
      assign(child, x + pad, x + cw - pad);
      x += cw;
    }
  }

  assign(root, 0, w);
}
