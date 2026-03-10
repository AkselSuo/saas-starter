'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface StrategicRiskCard {
  id: string;
  title: string;
  summary: string;
  status: 'red' | 'yellow';
  impactObjective: string;
  kpisAtRisk: number;
  projectsAtRisk: number;
  department: string;
  objectiveId?: string;
  orgUnitId?: string;
}

export interface AlertItem {
  id: string;
  title: string;
  department: string;
  description: string;
  objectiveId?: string;
  projectId?: string;
  date: string;
}

export interface ExecutiveDashboardProps {
  /** Strategic risks; clicking focuses that objective on the canvas */
  onViewObjective?: (objectiveId: string, orgUnitId?: string) => void;
  onViewProject?: (projectId: string) => void;
  onViewProblemSources?: () => void;
  /** Pre-wired mock data for demo */
  strategicRisks?: StrategicRiskCard[];
  alerts?: AlertItem[];
  objectivesTotal?: number;
  objectivesGreen?: number;
  objectivesYellow?: number;
  objectivesRed?: number;
  projectsTotal?: number;
  projectsGreen?: number;
  projectsYellow?: number;
  projectsRed?: number;
  problemSourcesCount?: number;
}

const defaultRisks: StrategicRiskCard[] = [
  {
    id: '1',
    title: 'Digital Experience Transformation',
    summary: 'delays are threatening enhance digital customer experience.',
    status: 'red',
    impactObjective: 'Enhance Digital Customer Experience',
    kpisAtRisk: 2,
    projectsAtRisk: 1,
    department: 'Denmark Sales',
    objectiveId: 'obj-dk-sales-ebit',
    orgUnitId: 'dept-dk-sales',
  },
  {
    id: '2',
    title: 'Product Line Expansion',
    summary: 'risks are impacting expand revenue streams.',
    status: 'yellow',
    impactObjective: 'Expand Revenue Streams',
    kpisAtRisk: 2,
    projectsAtRisk: 2,
    department: 'Finland',
    objectiveId: 'obj-fi-op',
    orgUnitId: 'country-fi',
  },
  {
    id: '3',
    title: 'Digital Experience Transformation',
    summary: 'delays are threatening improve customer satisfaction by 35%.',
    status: 'yellow',
    impactObjective: 'Improve Customer Satisfaction by 35%',
    kpisAtRisk: 2,
    projectsAtRisk: 1,
    department: 'Group (Global)',
    objectiveId: 'obj-group-ebit',
    orgUnitId: 'group',
  },
];

const defaultAlerts: AlertItem[] = [
  {
    id: 'a1',
    title: 'Digital Platform Uptime Below Target',
    department: 'Denmark Sales',
    description: 'KPI variance detected. Uptime at 94% vs 99% target.',
    objectiveId: 'obj-dk-sales-ebit',
    projectId: 'proj-dk-s1',
    date: '30.1.2026',
  },
  {
    id: 'a2',
    title: 'NPS Score Significantly Behind Target',
    department: 'Group (Global)',
    description: 'Net Promoter Score variance and contributing factors.',
    objectiveId: 'obj-group-growth',
    date: '30.1.2026',
  },
];

export function ExecutiveDashboard({
  onViewObjective,
  onViewProject,
  onViewProblemSources,
  strategicRisks = defaultRisks,
  alerts = defaultAlerts,
  objectivesTotal = 7,
  objectivesGreen = 4,
  objectivesYellow = 2,
  objectivesRed = 1,
  projectsTotal = 7,
  projectsGreen = 4,
  projectsYellow = 2,
  projectsRed = 1,
  problemSourcesCount = 11,
}: ExecutiveDashboardProps) {
  return (
    <div className="flex h-full flex-col overflow-auto bg-gray-50/80 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Executive Dashboard</h2>
        <select className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700">
          <option>All Organizations</option>
        </select>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        High-level overview of strategic objectives, KPIs, and initiatives.
      </p>

      {/* Strategic Impact */}
      <section className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Strategic Impact — Top strategic risks requiring executive attention
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {strategicRisks.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => card.objectiveId && onViewObjective?.(card.objectiveId, card.orgUnitId)}
              className={cn(
                'relative rounded-lg border-2 bg-white p-3 text-left shadow-sm transition hover:shadow',
                card.status === 'red' && 'border-red-400',
                card.status === 'yellow' && 'border-amber-400'
              )}
            >
              <span
                className={cn(
                  'absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-xs font-medium text-white',
                  card.status === 'red' && 'bg-red-500',
                  card.status === 'yellow' && 'bg-amber-500'
                )}
              >
                {card.id}
              </span>
              <p className="pr-8 text-sm font-medium text-gray-900">{card.title}</p>
              <p className="mt-0.5 text-xs text-gray-600">{card.summary}</p>
              <p className="mt-2 text-xs text-gray-500">
                Impacts: {card.impactObjective}; {card.kpisAtRisk} KPIs at risk, {card.projectsAtRisk} key project
                {card.projectsAtRisk !== 1 ? 's' : ''} at risk. Affects {card.department} performance.
              </p>
              <p className="mt-1 text-xs font-medium text-gray-600">Dept: {card.department}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Summary cards */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Objectives</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{objectivesTotal} total</p>
          <div className="mt-1 flex gap-1">
            <span className="size-2 rounded-full bg-emerald-500" title="green" />
            <span className="text-xs text-gray-600">{objectivesGreen}</span>
            <span className="size-2 rounded-full bg-amber-500" title="yellow" />
            <span className="text-xs text-gray-600">{objectivesYellow}</span>
            <span className="size-2 rounded-full bg-red-500" title="red" />
            <span className="text-xs text-gray-600">{objectivesRed}</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">KPIs</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">12 tracked</p>
          <div className="mt-1 flex gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-600">7</span>
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-600">3</span>
            <span className="size-2 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">2</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Projects</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{projectsTotal} active</p>
          <div className="mt-1 flex gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-600">{projectsGreen}</span>
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-600">{projectsYellow}</span>
            <span className="size-2 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">{projectsRed}</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Overall Health</p>
          <p className="mt-1 text-sm font-medium text-amber-700">At Risk</p>
          <p className="text-xs text-gray-600">Action required on critical items</p>
          <Button
            size="sm"
            variant="destructive"
            className="mt-2 w-full text-xs"
            onClick={onViewProblemSources}
          >
            View Problem Sources ({problemSourcesCount})
          </Button>
        </div>
      </section>

      {/* Situation overview */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700">Situation Overview</h3>
        <p className="mt-1 text-xs text-gray-600">
          <strong>CURRENT STATUS:</strong> Strategy execution shows warning signs with 4 items at risk across 14 total
          initiatives. Immediate attention needed on Denmark Sales and Group objectives.
        </p>
        <p className="mt-2 text-xs text-gray-600">
          <strong>RISK ANALYSIS:</strong> Critical issues detected in 1 strategic objective, 1 project, 2 KPIs. Primary
          impact areas: Denmark Sales and Customer.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Analysis generated from 14 active items · Updated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </section>

      {/* Recent alerts */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-gray-700">Recent Alerts & Issues</h3>
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex gap-2 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm"
            >
              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="text-xs text-gray-500">{alert.department} · {alert.date}</p>
                <p className="mt-1 text-xs text-gray-600">{alert.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {alert.objectiveId && (
                    <button
                      type="button"
                      onClick={() => onViewObjective?.(alert.objectiveId!)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View Objective →
                    </button>
                  )}
                  {alert.projectId && (
                    <button
                      type="button"
                      onClick={() => onViewProject?.(alert.projectId!)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View Project →
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
