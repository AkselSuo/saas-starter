import type { Node, Edge } from '@xyflow/react';

const elkOptionsDefault = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.spacing.nodeNodeBetweenLayers': 60,
  'elk.spacing.nodeNode': 40,
};

const elkOptionsCompact = {
  ...elkOptionsDefault,
  'elk.layered.spacing.nodeNodeBetweenLayers': 32,
  'elk.spacing.nodeNode': 22,
};

export interface ElkNodeInput {
  id: string;
  width: number;
  height: number;
}

export async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: { direction?: 'DOWN' | 'RIGHT'; compact?: boolean } = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const ELK = (await import('elkjs/lib/elk.bundled.js')).default;
  const elk = new ELK();

  const direction = options.direction ?? 'DOWN';
  const elkOptions = options.compact ? elkOptionsCompact : elkOptionsDefault;

  const graph = {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': direction,
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: (node.measured?.width ?? (node as Node & { width?: number }).width) ?? 180,
      height: (node.measured?.height ?? (node as Node & { height?: number }).height) ?? 56,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layouted = await elk.layout(graph);

  const layoutedNodes = (layouted.children ?? []).map((n: { id: string; x?: number; y?: number }) => ({
    ...nodes.find((nn) => nn.id === n.id)!,
    position: { x: n.x ?? 0, y: n.y ?? 0 },
  }));

  return {
    nodes: layoutedNodes,
    edges: layouted.edges
      ? (layouted.edges as { id: string; sources: string[]; targets: string[] }[]).map((e) => ({
          id: e.id,
          source: e.sources[0],
          target: e.targets[0],
        }))
      : edges,
  };
}
