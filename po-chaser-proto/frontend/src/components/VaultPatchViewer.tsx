import React, { useState } from 'react';
import { VaultUpdate } from '../types';
import { BrainCircuit, Check, CheckCircle2, FileCode, Database } from 'lucide-react';
import { applyVaultUpdate } from '../services/api';

interface VaultPatchViewerProps {
  updates: VaultUpdate[];
  onPatchApproved: (updateId: string, dailyLog: string) => void;
}

export const VaultPatchViewer: React.FC<VaultPatchViewerProps> = ({ updates, onPatchApproved }) => {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [isSavingId, setIsSavingId] = useState<string | null>(null);

  const handleApprove = async (patch: VaultUpdate) => {
    setIsSavingId(patch.id);
    try {
      const res = await applyVaultUpdate({
        update_id: patch.id,
        target_file: patch.target_file,
        patch_content: patch.patch_content,
        reason: patch.reason,
        author: 'Human Operator via PO Chaser Dashboard',
      });
      setApprovedIds((prev) => new Set(prev).add(patch.id));
      onPatchApproved(patch.id, res.daily_log_file);
    } catch (err: any) {
      alert(`Failed to approve patch: ${err.message}`);
    } finally {
      setIsSavingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Proposed Vault Memory Patches</h2>
          <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-semibold">
            {updates.length} Pending Approval
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Appends to vault/suppliers/*.md & logs to vault/daily-logs/</span>
        </div>
      </div>

      {/* List of Proposed Patches */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {updates.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No vault memory patches proposed in current analysis.
          </div>
        ) : (
          updates.map((patch) => {
            const isApproved = approvedIds.has(patch.id);
            const isSaving = isSavingId === patch.id;

            return (
              <div
                key={patch.id}
                className={`rounded-xl border p-4 bg-slate-950 transition-all ${
                  isApproved
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-purple-500/30'
                }`}
              >
                {/* Target File & Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                        {patch.target_file}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">{patch.supplier}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{patch.reason}</p>
                  </div>

                  {/* "Approve & Save to Vault" Button */}
                  <button
                    onClick={() => handleApprove(patch)}
                    disabled={isApproved || isSaving}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                      isApproved
                        ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400 cursor-default'
                        : isSaving
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30 active:scale-95'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Approved & Saved to Vault!</span>
                      </>
                    ) : isSaving ? (
                      <span>Saving to Disk...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Save to Vault</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Diff Preview Container */}
                <div className="rounded-lg bg-slate-900 border border-slate-800/80 overflow-hidden font-mono text-xs">
                  <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Proposed Memory Patch Diff</span>
                    <span className="text-emerald-400 font-semibold">+ Added to Memory</span>
                  </div>
                  <pre className="p-3 text-emerald-300/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {patch.patch_content}
                  </pre>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
