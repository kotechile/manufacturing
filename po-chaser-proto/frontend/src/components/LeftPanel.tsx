import React, { useState } from 'react';
import { Database, FileText, Mail, Play, Sparkles, BookOpen, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import { VaultDocument } from '../types';

interface LeftPanelProps {
  posRaw: string;
  setPosRaw: (val: string) => void;
  emailsRaw: string;
  setEmailsRaw: (val: string) => void;
  onLoadSample: () => void;
  onChase: () => void;
  isLoading: boolean;
  vaultDocs: VaultDocument[];
  onOpenVaultDoc: (doc: VaultDocument) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  posRaw,
  setPosRaw,
  emailsRaw,
  setEmailsRaw,
  onLoadSample,
  onChase,
  isLoading,
  vaultDocs,
  onOpenVaultDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'inputs' | 'vault'>('inputs');
  const [isVaultExpanded, setIsVaultExpanded] = useState(false);

  const poRowCount = posRaw.trim() ? posRaw.trim().split('\n').length - 1 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full shadow-md overflow-hidden">
      {/* Tab bar & Quick Actions */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('inputs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'inputs'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Inputs
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
              activeTab === 'vault'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vault Memory</span>
          </button>
        </div>

        <button
          onClick={onLoadSample}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all transform active:scale-95"
          title="Pre-loads 5 realistic sample manufacturing POs & 4 vendor delay/ASN emails"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Mfg Data</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {activeTab === 'inputs' ? (
          <>
            {/* Open POs Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Open PO Rows (CSV / TSV / Excel Copy-Paste)</span>
                </label>
                <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {poRowCount > 0 ? `${poRowCount} PO rows detected` : 'Empty'}
                </span>
              </div>
              <textarea
                value={posRaw}
                onChange={(e) => setPosRaw(e.target.value)}
                rows={7}
                placeholder="Paste CSV rows here: PO_NUMBER, SUPPLIER_NAME, PART_NUMBER, PROMISED_DOCK_DATE, STATUS..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-y placeholder:text-slate-600"
              />
            </div>

            {/* Inbound Emails Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Inbound Vendor Email Snippets</span>
                </label>
                <span className="text-[11px] text-slate-400">Headers: From, Subject, Date, Body</span>
              </div>
              <textarea
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                rows={7}
                placeholder="--- EMAIL 1 ---&#10;From: orders@titanmetals.example.com&#10;Subject: Delivery notice PO-9021&#10;Body: Furnace maintenance is causing a delay..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-y placeholder:text-slate-600"
              />
            </div>

            {/* Collapsible Vault Quick Inspector */}
            <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
              <button
                onClick={() => setIsVaultExpanded(!isVaultExpanded)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>Active Knowledge Vault ({vaultDocs.length} files grounded)</span>
                </div>
                {isVaultExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isVaultExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-800/80">
                  {vaultDocs.map((doc) => (
                    <div
                      key={doc.path}
                      onClick={() => onOpenVaultDoc(doc)}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-850 cursor-pointer border border-slate-800 hover:border-sky-500/30 text-xs transition-all group"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400" />
                        <span className="font-mono text-slate-300 truncate">{doc.path}</span>
                      </div>
                      <span className="text-[10px] text-sky-400 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="w-3 h-3" />
                        <span>Inspect</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Dedicated Vault Explorer Tab */
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Select any Markdown knowledge document below to inspect or edit the operating SLAs, escalation SOPs, or vendor lead-time memory.
            </div>
            <div className="space-y-2">
              {vaultDocs.map((doc) => (
                <div
                  key={doc.path}
                  onClick={() => onOpenVaultDoc(doc)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-sky-400 font-mono">{doc.path}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {doc.content.slice(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Execute Button */}
      <div className="p-4 bg-slate-850 border-t border-slate-800">
        <button
          onClick={onChase}
          disabled={isLoading || !posRaw.trim()}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
            isLoading || !posRaw.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-900/30 hover:shadow-sky-900/50 transform active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Hermes Reasoning & Reconciling Vault...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Chase POs & Run Analysis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
