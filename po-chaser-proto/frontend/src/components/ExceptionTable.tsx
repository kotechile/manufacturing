import React, { useState } from 'react';
import { POException, RiskLevel } from '../types';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';

interface ExceptionTableProps {
  exceptions: POException[];
  onSelectPO?: (poNumber: string) => void;
}

export const ExceptionTable: React.FC<ExceptionTableProps> = ({ exceptions, onSelectPO }) => {
  const [filter, setFilter] = useState<'ALL' | RiskLevel>('ALL');

  const filtered = exceptions.filter((ex) => (filter === 'ALL' ? true : ex.risk_level === filter));

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            MEDIUM
          </span>
        );
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            ON TRACK
          </span>
        );
    }
  };

  const getCountdownBadge = (days: number) => {
    if (days <= 0) {
      return <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">Past Dock!</span>;
    }
    if (days <= 4) {
      return <span className="text-xs font-bold text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60">{days}d left</span>;
    }
    if (days <= 7) {
      return <span className="text-xs font-semibold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">{days}d left</span>;
    }
    return <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{days}d left</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
      {/* Header and Filter Controls */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white">At-Risk PO Exception Table</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
            {exceptions.length} Reviewed
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(['ALL', 'HIGH', 'MEDIUM', 'ON_TRACK'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === r
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'ALL' ? 'All' : r === 'ON_TRACK' ? 'On Track' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Exception Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-4">PO & Supplier</th>
              <th className="py-3 px-4">Item / Part</th>
              <th className="py-3 px-3">Dock Date</th>
              <th className="py-3 px-3">Countdown</th>
              <th className="py-3 px-3">Risk Level</th>
              <th className="py-3 px-4">Root Cause & Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No exceptions match the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((ex) => (
                <tr
                  key={ex.po_number}
                  onClick={() => onSelectPO?.(ex.po_number)}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white font-mono text-sm group-hover:text-sky-400 transition-colors">
                      {ex.po_number}
                    </div>
                    <div className="text-slate-400 text-[11px]">{ex.supplier}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate" title={ex.item_description}>
                    {ex.item_description}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">
                    {ex.dock_date}
                  </td>
                  <td className="py-3.5 px-3">
                    {getCountdownBadge(ex.days_to_dock)}
                  </td>
                  <td className="py-3.5 px-3">
                    {getRiskBadge(ex.risk_level)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium mb-1">{ex.root_cause}</div>
                    <div className="text-sky-400/90 text-[11px] flex items-center space-x-1">
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span>{ex.action_required}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
