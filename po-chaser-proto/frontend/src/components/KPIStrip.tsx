import React from 'react';
import { SummaryMetrics } from '../types';
import { Package, AlertTriangle, Clock, CheckCircle2, Mail, BrainCircuit } from 'lucide-react';

interface KPIStripProps {
  metrics: SummaryMetrics | null;
  updatesCount: number;
}

export const KPIStrip: React.FC<KPIStripProps> = ({ metrics, updatesCount }) => {
  const cards = [
    {
      label: 'Total POs Reviewed',
      value: metrics ? metrics.total_pos : '--',
      icon: Package,
      color: 'from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20',
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
    {
      label: 'High Risk (Urgent)',
      value: metrics ? metrics.high_risk : '--',
      icon: AlertTriangle,
      color: 'from-rose-500/15 to-rose-600/5 text-rose-400 border-rose-500/30',
      badgeColor: 'bg-rose-500/20 text-rose-300',
      highlight: true,
    },
    {
      label: 'Medium Risk',
      value: metrics ? metrics.medium_risk : '--',
      icon: Clock,
      color: 'from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      label: 'On Track',
      value: metrics ? metrics.on_track : '--',
      icon: CheckCircle2,
      color: 'from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      label: 'Draft Follow-Ups',
      value: metrics ? metrics.drafts_ready : '--',
      icon: Mail,
      color: 'from-sky-500/10 to-sky-600/5 text-sky-400 border-sky-500/20',
      badgeColor: 'bg-sky-500/20 text-sky-300',
    },
    {
      label: 'Vault Patches',
      value: updatesCount > 0 ? updatesCount : (metrics ? 0 : '--'),
      icon: BrainCircuit,
      color: 'from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20',
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3.5 rounded-xl border bg-gradient-to-br ${c.color} flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span className="truncate">{c.label}</span>
              <Icon className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-white flex items-baseline justify-between">
              <span>{c.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
