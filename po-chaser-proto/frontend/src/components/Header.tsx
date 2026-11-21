import React from 'react';
import { ShieldCheck, Cpu, Database, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  vaultCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, vaultCount }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-900/30">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Hermes Supplier & PO Chaser
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              v1.0 Prototype
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Autonomous Manufacturing Procurement Digital Employee backed by Obsidian Markdown Vault
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {/* Guardrail badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Draft-First Guardrail Active</span>
        </div>

        {/* Knowledge Vault Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Vault: {vaultCount} Docs Active</span>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          title="LLM & OpenRouter Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
