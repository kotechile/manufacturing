import { ChaseResponse, VaultDocument, ApplyVaultUpdateRequest, ApplyVaultUpdateResponse } from '../types';

const API_BASE = '/api';

export async function fetchSampleData(): Promise<{ pos_raw: string; emails_raw: string; reference_date: string }> {
  const res = await fetch(`${API_BASE}/sample-data`);
  if (!res.ok) throw new Error(`Failed to load sample data: ${res.statusText}`);
  return res.json();
}

export async function chasePOs(params: {
  pos_raw: string;
  emails_raw: string;
  reference_date?: string;
  vault_override?: Record<string, string>;
  apiKey?: string;
  model?: string;
}): Promise<ChaseResponse> {
  const res = await fetch(`${API_BASE}/chase-pos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pos_raw: params.pos_raw,
      emails_raw: params.emails_raw,
      reference_date: params.reference_date || '2026-11-21',
      vault_override: params.vault_override,
      api_key: params.apiKey,
      model: params.model,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to analyze POs');
  }

  return res.json();
}

export async function applyVaultUpdate(req: ApplyVaultUpdateRequest): Promise<ApplyVaultUpdateResponse> {
  const res = await fetch(`${API_BASE}/apply-vault-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to apply vault update');
  }

  return res.json();
}

export async function fetchVaultDocuments(): Promise<VaultDocument[]> {
  const res = await fetch(`${API_BASE}/vault`);
  if (!res.ok) throw new Error('Failed to load vault documents');
  const data = await res.json();
  return data.documents;
}

export async function saveVaultDocument(path: string, content: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/vault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  if (!res.ok) throw new Error('Failed to save vault document');
  return true;
}
