/**
 * Mock data generator for Alignment Checker Icicle.
 * X-Matrix model: GrowthObjective → Country (multiple contributing objectives) → Project
 */

import type {
  AlignmentSnapshot,
  AlignmentDatasets,
  GrowthObjective,
  CountryObjective,
  Project,
  KPI,
  StrategicObjective,
  TrafficStatus,
  OrganisationUnit,
} from './types';

const STATUSES: TrafficStatus[] = ['green', 'yellow', 'red'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function nudgeStatus(status: TrafficStatus, bias: 'current' | 'previous', id: string): TrafficStatus {
  const r = (Math.abs(hash(id + bias)) % 1000) / 1000;
  if (r > 0.85) {
    if (status === 'red') return 'yellow';
    if (status === 'yellow') return r > 0.92 ? 'red' : 'green';
    if (status === 'green') return 'yellow';
  }
  return status;
}

const COUNTRIES = ['Finland', 'Denmark', 'Nordics', 'USA'];

/** Organisation structure: all org units per country (defines level 3; not derived from projects). */
const ORG_UNIT_NAMES = ['Operations', 'Sales', 'R&D', 'Logistics', 'Production'];

function buildOrganisationUnits(): OrganisationUnit[] {
  const list: OrganisationUnit[] = [];
  for (const country of COUNTRIES) {
    for (const name of ORG_UNIT_NAMES) {
      list.push({
        id: `ou-${country.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`,
        name,
        country,
      });
    }
  }
  return list;
}

const GROWTH_OBJECTIVES: GrowthObjective[] = [
  { id: 'go-revenue', title: 'Revenue growth +15%', owner: 'CEO' },
  { id: 'go-ebitda', title: 'EBITDA margin > 20%', owner: 'CFO' },
  { id: 'go-customer', title: 'Customer satisfaction NPS 50+', owner: 'CCO' },
  { id: 'go-sustainability', title: 'Carbon neutral by 2028', owner: 'CSO' },
];

const OBJECTIVE_TITLES_BY_GO: Record<string, string[]> = {
  'go-revenue': [
    'Expand enterprise accounts', 'New market channel', 'Upsell revenue +20%',
    'Pipeline growth Q2', 'Key account retention', 'Cross-sell initiative',
    'Pricing model refresh', 'Channel partner program', 'West coast expansion',
  ],
  'go-ebitda': [
    'Cost reduction program', 'Lean manufacturing', 'Procurement optimization',
    'Operational efficiency', 'Overhead reduction', 'Process automation',
    'Vendor consolidation', 'Energy cost reduction', 'Labour optimization',
  ],
  'go-customer': [
    'Service quality improvement', 'Customer portal 2.0', 'Response time ↓40%',
    'Loyalty program launch', 'NPS feedback loop', 'Onboarding optimization',
    'Support SLA upgrade', 'Self-service expansion', 'Community platform',
  ],
  'go-sustainability': [
    'Fleet electrification', 'Zero-waste operations', 'Supply chain sustainability',
    'Energy reduction 15%', 'Carbon offset program', 'Circular economy pilot',
    'Green packaging', 'Renewable energy switch', 'Scope 3 reporting',
  ],
};

const PROJECT_NAMES = [
  'ERP Migration', 'CRM Rollout', 'Cloud Platform', 'Data Pipeline',
  'Mobile App v2', 'Supply Chain Opt', 'Customer Portal', 'AI Forecasting',
  'Quality Dashboard', 'Logistics Hub', 'E-commerce Relaunch',
  'Compliance Audit', 'Lean Manufacturing', 'Partner API', 'Brand Refresh',
  'Cost Optimizer', 'Sales Enablement', 'Process Automation',
  'Sustainability Report', 'Talent Platform', 'Market Expansion', 'Digital Twin',
  'Pricing Engine', 'Vendor Portal', 'Analytics Suite', 'Training Platform',
  'Fleet Manager', 'Payroll Upgrade', 'KPI Dashboard', 'Knowledge Base',
  'Onboarding Flow', 'Campaign Tracker', 'Billing System', 'R&D Lab Portal',
];

const OWNER_NAMES = [
  'Anna Lindström', 'Mikko Lahtinen', 'Erik Hansen', 'Sofia Johansson',
  'James Miller', 'Katrine Berg', 'Tommi Virtanen', 'Lisa Chen',
];

function buildBaseStructure(): AlignmentSnapshot {
  const countryObjectives: CountryObjective[] = [];
  const projects: Project[] = [];
  let coIdx = 0;
  let projIdx = 0;
  let titleIdx = 0;

  for (const go of GROWTH_OBJECTIVES) {
    const titles = OBJECTIVE_TITLES_BY_GO[go.id] ?? [];
    titleIdx = 0;

    for (let ci = 0; ci < COUNTRIES.length; ci++) {
      const country = COUNTRIES[ci];
      const nObjectives = 2 + ((ci + hash(go.id)) % 2);

      for (let oi = 0; oi < nObjectives; oi++) {
        const coId = `co-${go.id}-${country.toLowerCase()}-${oi}`;
        const objTitle = titles[titleIdx % titles.length];
        titleIdx++;

        const statusSeed = (coIdx * 7 + ci + oi * 3) % 10;
        const status: TrafficStatus = statusSeed < 2 ? 'red' : statusSeed < 5 ? 'yellow' : 'green';
        const progress = 30 + ((coIdx * 13 + ci * 7 + oi * 11) % 61);

        const connectedProjectIds: string[] = [];
        const nProjects = 1 + ((coIdx + ci + oi) % 3);
        for (let pi = 0; pi < nProjects; pi++) {
          const pid = `proj-${coId}-${pi}`;
          const pStatus: TrafficStatus = STATUSES[(statusSeed + pi) % 3];
          const orgUnitIndex = (coIdx + ci + oi + pi) % ORG_UNIT_NAMES.length;
          const orgUnit = ORG_UNIT_NAMES[orgUnitIndex];
          projects.push({
            id: pid,
            title: PROJECT_NAMES[projIdx % PROJECT_NAMES.length],
            status: pStatus,
            countryObjectiveId: coId,
            organisationUnit: orgUnit,
            owner: OWNER_NAMES[(projIdx + pi) % OWNER_NAMES.length],
          });
          connectedProjectIds.push(pid);
          projIdx++;
        }

        countryObjectives.push({
          id: coId,
          title: objTitle,
          country,
          status,
          progress,
          growthObjectiveId: go.id,
          owner: OWNER_NAMES[coIdx % OWNER_NAMES.length],
          connectedProjectIds,
        });
        coIdx++;
      }
    }
  }

  const strategicObjectives: StrategicObjective[] = [
    { id: 'so-ebitda', title: 'Group EBITDA target', importanceWeight: 3 },
    { id: 'so-revenue', title: 'Revenue growth', importanceWeight: 2 },
    { id: 'so-customer', title: 'Customer Satisfaction', importanceWeight: 2 },
    { id: 'so-cost', title: 'Cost reduction', importanceWeight: 1 },
  ];

  const kpis: KPI[] = [
    { id: 'kpi-rev', title: 'Revenue', status: 'green', current: 100, target: 100, unit: '%', connectedObjectiveIds: [], strategicWeight: 3 },
    { id: 'kpi-ebitda', title: 'EBITDA margin', status: 'green', current: 18, target: 20, unit: '%', connectedObjectiveIds: [], strategicWeight: 3 },
    { id: 'kpi-csat', title: 'Customer NPS', status: 'yellow', current: 42, target: 50, unit: 'pts', connectedObjectiveIds: [], strategicWeight: 2 },
    { id: 'kpi-delivery', title: 'On-time delivery', status: 'green', current: 92, target: 90, unit: '%', connectedObjectiveIds: [], strategicWeight: 1 },
  ];

  countryObjectives.forEach((co, idx) => {
    const soLink = idx % strategicObjectives.length;
    const kpiLink = idx % kpis.length;
    co.connectedKpiIds = [kpis[kpiLink].id];
    co.connectedStrategicObjectiveIds = [strategicObjectives[soLink].id];
    kpis[kpiLink].connectedObjectiveIds.push(co.id);
  });

  GROWTH_OBJECTIVES.forEach((go, idx) => {
    go.connectedKpiIds = [kpis[idx % kpis.length].id];
  });

  const organisationUnits = buildOrganisationUnits();

  return {
    growthObjectives: GROWTH_OBJECTIVES.map((g) => ({ ...g })),
    countryObjectives,
    projects,
    organisationUnits,
    kpis,
    strategicObjectives,
  };
}

function cloneAndMutate(snapshot: AlignmentSnapshot, bias: 'current' | 'previous'): AlignmentSnapshot {
  return {
    growthObjectives: snapshot.growthObjectives.map((g) => ({ ...g })),
    countryObjectives: snapshot.countryObjectives.map((co) => ({
      ...co,
      connectedProjectIds: [...co.connectedProjectIds],
      status: nudgeStatus(co.status, bias, co.id),
      progress: Math.min(100, Math.max(0, co.progress + ((Math.abs(hash(co.id + bias + 'p')) % 41) - 20))),
    })),
    projects: snapshot.projects.map((p) => ({
      ...p,
      status: nudgeStatus(p.status, bias, p.id),
    })),
    organisationUnits: snapshot.organisationUnits,
    kpis: snapshot.kpis?.map((k) => ({ ...k, connectedObjectiveIds: [...k.connectedObjectiveIds] })),
    strategicObjectives: snapshot.strategicObjectives?.map((s) => ({ ...s })),
  };
}

export function buildAlignmentDatasets(): AlignmentDatasets {
  const base = buildBaseStructure();
  const current = cloneAndMutate(base, 'current');
  const previous = cloneAndMutate(base, 'previous');
  return {
    datasetCurrent: current,
    datasetPrevious: previous,
    growthObjectives: base.growthObjectives.map((g) => ({ ...g })),
  };
}

export function worstStatus(statuses: TrafficStatus[]): TrafficStatus {
  if (statuses.some((s) => s === 'red')) return 'red';
  if (statuses.some((s) => s === 'yellow')) return 'yellow';
  return 'green';
}
