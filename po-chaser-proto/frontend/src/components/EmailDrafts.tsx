import React, { useState } from 'react';
import { DraftEmail } from '../types';
import { Mail, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface EmailDraftsProps {
  drafts: DraftEmail[];
  selectedPO?: string | null;
}

export const EmailDrafts: React.FC<EmailDraftsProps> = ({ drafts, selectedPO }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (draft: DraftEmail) => {
    const fullText = `To: ${draft.recipient_email}\nSubject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(draft.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === draft.id ? null : curr));
    }, 2500);
  };

  const sortedDrafts = selectedPO
    ? [...drafts].sort((a, b) => (a.po_number === selectedPO ? -1 : b.po_number === selectedPO ? 1 : 0))
    : drafts;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white">Draft Follow-Up Emails</h2>
          <span className="text-xs bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full font-semibold">
            {drafts.length} Ready for Review
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Draft-First Mode (No external sending)</span>
        </div>
      </div>

      {/* Draft Cards List */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {sortedDrafts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No draft emails pending review. Run PO analysis to generate drafts.
          </div>
        ) : (
          sortedDrafts.map((draft) => {
            const isCopied = copiedId === draft.id;
            const isSelected = selectedPO === draft.po_number;

            return (
              <div
                key={draft.id}
                className={`rounded-xl border p-4 bg-slate-950 transition-all ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Draft Metadata Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {draft.po_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {draft.supplier}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        draft.urgency === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : draft.urgency === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {draft.urgency} URGENCY
                    </span>
                  </div>

                  {/* 1-Click Copy Draft Button */}
                  <button
                    onClick={() => handleCopy(draft)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-900/20 active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Email Recipient & Subject Header */}
                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="font-semibold text-slate-500 w-14">To:</span>
                    <span className="text-slate-200 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {draft.recipient_name} &lt;{draft.recipient_email}&gt;
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="font-semibold text-slate-500 w-14">Subject:</span>
                    <span className="text-slate-100 font-semibold">{draft.subject}</span>
                  </div>
                </div>

                {/* Email Body in email container */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {draft.body}
                </div>

                {/* Context Note */}
                {draft.context_notes && (
                  <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>Context Grounding: {draft.context_notes}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
