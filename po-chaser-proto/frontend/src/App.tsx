import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KPIStrip } from './components/KPIStrip';
import { LeftPanel } from './components/LeftPanel';
import { ExceptionTable } from './components/ExceptionTable';
import { EmailDrafts } from './components/EmailDrafts';
import { VaultPatchViewer } from './components/VaultPatchViewer';
import { VaultEditorModal } from './components/VaultEditorModal';
import { SettingsModal } from './components/SettingsModal';
import { ChaseResponse, VaultDocument } from './types';
import { fetchSampleData, chasePOs, fetchVaultDocuments } from './services/api';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const App: React.FC = () => {
  const [posRaw, setPosRaw] = useState('');
  const [emailsRaw, setEmailsRaw] = useState('');
  const [results, setResults] = useState<ChaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  // Vault Management
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>([]);
  const [editingDoc, setEditingDoc] = useState<VaultDocument | null>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('nousresearch/hermes-3-llama-3.1-70b');

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadVaultDocs = async () => {
    try {
      const docs = await fetchVaultDocuments();
      setVaultDocs(docs);
    } catch (err: any) {
      console.error('Failed to load vault docs:', err);
    }
  };

  useEffect(() => {
    loadVaultDocs();
  }, []);

  const handleLoadSample = async () => {
    try {
      const data = await fetchSampleData();
      setPosRaw(data.pos_raw);
      setEmailsRaw(data.emails_raw);
      showToast('Loaded 5 sample manufacturing POs & 4 vendor delay snippets', 'info');
    } catch (err: any) {
      setError(`Failed to load sample data: ${err.message}`);
    }
  };

  const handleChase = async () => {
    if (!posRaw.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await chasePOs({
        pos_raw: posRaw,
        emails_raw: emailsRaw,
        reference_date: '2026-11-21',
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
      });
      setResults(res);
      showToast(`Analysis complete: ${res.exceptions.length} POs reviewed, ${res.draft_emails.length} drafts prepared.`, 'success');
    } catch (err: any) {
      setError(err.message || 'Error occurred while chasing POs');
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatchApproved = (updateId: string, dailyLog: string) => {
    showToast(`Patch ${updateId} committed to vault! Logged in ${dailyLog}`, 'success');
    loadVaultDocs();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        vaultCount={vaultDocs.length}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-emerald-900/30'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-300 border-rose-500/40 shadow-rose-900/30'
                : 'bg-sky-950 text-sky-300 border-sky-500/40 shadow-sky-900/30'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Info className="w-4 h-4 text-sky-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        {/* Left Panel: Inputs & Vault (5 cols) */}
        <div className="lg:col-span-5 h-[calc(100vh-120px)] sticky top-[88px]">
          <LeftPanel
            posRaw={posRaw}
            setPosRaw={setPosRaw}
            emailsRaw={emailsRaw}
            setEmailsRaw={setEmailsRaw}
            onLoadSample={handleLoadSample}
            onChase={handleChase}
            isLoading={isLoading}
            vaultDocs={vaultDocs}
            onOpenVaultDoc={(doc) => setEditingDoc(doc)}
          />
        </div>

        {/* Right Panel: Agent Outputs & Action Center (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. KPI Metric Strip */}
          <KPIStrip
            metrics={results?.summary_metrics || null}
            updatesCount={results?.vault_updates.length || 0}
          />

          {/* 2. Exception Table */}
          <ExceptionTable
            exceptions={results?.exceptions || []}
            onSelectPO={(po) => setSelectedPO(po)}
          />

          {/* 3. Draft Follow-Up Emails */}
          <EmailDrafts
            drafts={results?.draft_emails || []}
            selectedPO={selectedPO}
          />

          {/* 4. Proposed Vault Patches */}
          <VaultPatchViewer
            updates={results?.vault_updates || []}
            onPatchApproved={handlePatchApproved}
          />
        </div>
      </main>

      {/* Modals */}
      <VaultEditorModal
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
        onSaved={() => loadVaultDocs()}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        model={model}
        setModel={setModel}
      />
    </div>
  );
};
