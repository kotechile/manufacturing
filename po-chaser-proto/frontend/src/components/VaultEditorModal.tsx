import React, { useState, useEffect } from 'react';
import { VaultDocument } from '../types';
import { X, Save, FileText, Check, AlertCircle } from 'lucide-react';
import { saveVaultDocument } from '../services/api';

interface VaultEditorModalProps {
  document: VaultDocument | null;
  onClose: () => void;
  onSaved: (path: string, newContent: string) => void;
}

export const VaultEditorModal: React.FC<VaultEditorModalProps> = ({ document, onClose, onSaved }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setContent(document.content);
      setStatusMsg(null);
    }
  }, [document]);

  if (!document) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await saveVaultDocument(document.path, content);
      setStatusMsg('Saved successfully to disk!');
      onSaved(document.path, content);
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white font-mono">{document.path}</h3>
              <p className="text-xs text-slate-400">Category: {document.category} | Live Markdown Vault File</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[400px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none leading-relaxed"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <div>
            {statusMsg && (
              <span className={`text-xs font-medium flex items-center space-x-1 ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
                {statusMsg.includes('Error') ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{statusMsg}</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center space-x-1.5 shadow-md shadow-sky-900/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
