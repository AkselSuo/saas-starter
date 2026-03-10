import type { AlignmentData, OrgUnit, Objective, Project } from './types';

export function buildAlignmentMockData(): AlignmentData {
  const orgUnits: OrgUnit[] = [
    { id: 'group', name: 'Group', level: 'group', parentId: null, status: 'yellow', metricsSummary: { green: 4, yellow: 5, red: 2 } },
    { id: 'country-dk', name: 'Denmark', level: 'country', parentId: 'group', status: 'yellow', metricsSummary: { green: 2, yellow: 3, red: 1 } },
    { id: 'country-fi', name: 'Finland', level: 'country', parentId: 'group', status: 'green', metricsSummary: { green: 4, yellow: 1, red: 0 } },
    { id: 'country-us', name: 'USA', level: 'country', parentId: 'group', status: 'red', metricsSummary: { green: 1, yellow: 2, red: 3 } },
    { id: 'dept-dk-prod', name: 'Production', level: 'department', parentId: 'country-dk', status: 'green', metricsSummary: { green: 2, yellow: 0, red: 0 } },
    { id: 'dept-dk-sales', name: 'Sales', level: 'department', parentId: 'country-dk', status: 'red', metricsSummary: { green: 0, yellow: 2, red: 1 } },
    { id: 'dept-fi-prod', name: 'Production', level: 'department', parentId: 'country-fi', status: 'green', metricsSummary: { green: 2, yellow: 1, red: 0 } },
    { id: 'dept-fi-ops', name: 'Operations', level: 'department', parentId: 'country-fi', status: 'green', metricsSummary: { green: 2, yellow: 0, red: 0 } },
    { id: 'dept-us-prod', name: 'Production', level: 'department', parentId: 'country-us', status: 'red', metricsSummary: { green: 0, yellow: 1, red: 2 } },
  ];

  const objectives: Objective[] = [
    // Group
    { id: 'obj-group-ebit', title: 'Increase EBITDA by 20%', status: 'yellow', orgUnitId: 'group', parentObjectiveId: null, connectedObjectiveIds: ['obj-dk-ebit', 'obj-fi-op', 'obj-us-rev'] },
    { id: 'obj-group-cost', title: 'Reduce operating cost', status: 'red', orgUnitId: 'group', parentObjectiveId: null, connectedObjectiveIds: ['obj-dk-cost', 'obj-fi-cost'] },
    { id: 'obj-group-growth', title: 'Revenue growth +15%', status: 'green', orgUnitId: 'group', parentObjectiveId: null, connectedObjectiveIds: ['obj-dk-growth'] },
    // Denmark
    { id: 'obj-dk-ebit', title: 'EBIT +9%', status: 'yellow', orgUnitId: 'country-dk', parentObjectiveId: 'obj-group-ebit', connectedObjectiveIds: ['obj-dk-prod-ebit', 'obj-dk-sales-ebit'] },
    { id: 'obj-dk-cost', title: 'Cut costs 5%', status: 'red', orgUnitId: 'country-dk', parentObjectiveId: 'obj-group-cost', connectedObjectiveIds: ['obj-dk-prod-cost'] },
    { id: 'obj-dk-growth', title: 'Market share +2%', status: 'green', orgUnitId: 'country-dk', parentObjectiveId: 'obj-group-growth', connectedObjectiveIds: ['obj-dk-sales-growth'] },
    // Denmark Production
    { id: 'obj-dk-prod-ebit', title: 'Improve productivity', status: 'green', orgUnitId: 'dept-dk-prod', parentObjectiveId: 'obj-dk-ebit', connectedObjectiveIds: [] },
    { id: 'obj-dk-prod-cost', title: 'Reduce waste', status: 'yellow', orgUnitId: 'dept-dk-prod', parentObjectiveId: 'obj-dk-cost', connectedObjectiveIds: [] },
    // Denmark Sales
    { id: 'obj-dk-sales-ebit', title: 'Margin improvement', status: 'yellow', orgUnitId: 'dept-dk-sales', parentObjectiveId: 'obj-dk-ebit', connectedObjectiveIds: [] },
    { id: 'obj-dk-sales-growth', title: 'New customer acquisition', status: 'green', orgUnitId: 'dept-dk-sales', parentObjectiveId: 'obj-dk-growth', connectedObjectiveIds: [] },
    // Finland
    { id: 'obj-fi-op', title: 'Operating profit +14%', status: 'green', orgUnitId: 'country-fi', parentObjectiveId: 'obj-group-ebit', connectedObjectiveIds: ['obj-fi-prod-op', 'obj-fi-ops-op'] },
    { id: 'obj-fi-cost', title: 'OPEX -10%', status: 'green', orgUnitId: 'country-fi', parentObjectiveId: 'obj-group-cost', connectedObjectiveIds: ['obj-fi-ops-cost'] },
    // Finland Production
    { id: 'obj-fi-prod-op', title: 'Output +8%', status: 'green', orgUnitId: 'dept-fi-prod', parentObjectiveId: 'obj-fi-op', connectedObjectiveIds: [] },
    // Finland Operations
    { id: 'obj-fi-ops-op', title: 'Efficiency gains', status: 'green', orgUnitId: 'dept-fi-ops', parentObjectiveId: 'obj-fi-op', connectedObjectiveIds: [] },
    { id: 'obj-fi-ops-cost', title: 'Process optimization', status: 'green', orgUnitId: 'dept-fi-ops', parentObjectiveId: 'obj-fi-cost', connectedObjectiveIds: [] },
    // USA
    { id: 'obj-us-rev', title: 'Revenue recovery', status: 'red', orgUnitId: 'country-us', parentObjectiveId: 'obj-group-ebit', connectedObjectiveIds: ['obj-us-prod-rev'] },
    { id: 'obj-us-prod-rev', title: 'Capacity utilization', status: 'red', orgUnitId: 'dept-us-prod', parentObjectiveId: 'obj-us-rev', connectedObjectiveIds: [] },
  ];

  const projects: Project[] = [
    { id: 'proj-dk-p1', title: 'Production improvement program', status: 'green', orgUnitId: 'country-dk', connectedObjectiveIds: ['obj-dk-ebit'], description: 'Cross-site productivity program; phase 1 complete.', owner: 'Lars M.', dueDate: '2025-06' },
    { id: 'proj-dk-p2', title: 'New factory project', status: 'yellow', orgUnitId: 'country-dk', connectedObjectiveIds: ['obj-dk-ebit', 'obj-dk-growth'], description: 'Greenfield expansion; permitting in progress.', owner: 'Anna K.', dueDate: '2026-Q2' },
    { id: 'proj-dk-p3', title: 'Lean manufacturing phase 2', status: 'green', orgUnitId: 'dept-dk-prod', connectedObjectiveIds: ['obj-dk-prod-ebit', 'obj-dk-prod-cost'], description: 'Waste reduction and flow improvements.', owner: 'Jens P.', dueDate: '2025-09' },
    { id: 'proj-dk-p4', title: 'Automation pilot', status: 'green', orgUnitId: 'dept-dk-prod', connectedObjectiveIds: ['obj-dk-prod-ebit'], description: 'Pilot line automation; ROI on track.', owner: 'Maria S.', dueDate: '2025-04' },
    { id: 'proj-dk-s1', title: 'CRM rollout', status: 'red', orgUnitId: 'dept-dk-sales', connectedObjectiveIds: ['obj-dk-sales-growth', 'obj-dk-sales-ebit'], description: 'New CRM deployment; adoption below target.', owner: 'Thomas B.', dueDate: '2025-03' },
    { id: 'proj-dk-s2', title: 'Pricing initiative', status: 'yellow', orgUnitId: 'dept-dk-sales', connectedObjectiveIds: ['obj-dk-sales-ebit'], description: 'Dynamic pricing and margin analysis.', owner: 'Sofia L.', dueDate: '2025-05' },
    { id: 'proj-fi-1', title: 'Plant upgrade Finland', status: 'green', orgUnitId: 'country-fi', connectedObjectiveIds: ['obj-fi-op'], description: 'Major upgrade to Line 1 and 2.', owner: 'Erik N.', dueDate: '2025-08' },
    { id: 'proj-fi-2', title: 'Supply chain optimization', status: 'green', orgUnitId: 'country-fi', connectedObjectiveIds: ['obj-fi-cost', 'obj-fi-op'], description: 'Vendor consolidation and logistics.', owner: 'Kaisa V.', dueDate: '2025-07' },
    { id: 'proj-fi-3', title: 'Line 3 expansion', status: 'green', orgUnitId: 'dept-fi-prod', connectedObjectiveIds: ['obj-fi-prod-op'], description: 'Capacity increase; commissioning Q3.', owner: 'Mikko T.', dueDate: '2025-09' },
    { id: 'proj-fi-4', title: 'Maintenance 4.0', status: 'green', orgUnitId: 'dept-fi-ops', connectedObjectiveIds: ['obj-fi-ops-op', 'obj-fi-ops-cost'], description: 'Predictive maintenance and IoT.', owner: 'Laura H.', dueDate: '2025-06' },
    { id: 'proj-us-1', title: 'Restructuring program', status: 'red', orgUnitId: 'country-us', connectedObjectiveIds: ['obj-us-rev'], description: 'Site consolidation; delays in labor talks.', owner: 'James R.', dueDate: '2025-12' },
    { id: 'proj-us-2', title: 'Capacity review', status: 'yellow', orgUnitId: 'dept-us-prod', connectedObjectiveIds: ['obj-us-prod-rev'], description: 'Utilization analysis and rebalancing.', owner: 'Chris M.', dueDate: '2025-04' },
    { id: 'proj-us-3', title: 'Equipment overhaul', status: 'red', orgUnitId: 'dept-us-prod', connectedObjectiveIds: ['obj-us-prod-rev'], description: 'Critical machinery upgrade; budget overrun.', owner: 'Patricia D.', dueDate: '2025-08' },
  ];

  return { orgUnits, objectives, projects };
}
