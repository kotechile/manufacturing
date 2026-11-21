export type RiskLevel = 'HIGH' | 'MEDIUM' | 'ON_TRACK';
export type Urgency = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SummaryMetrics {
  total_pos: number;
  high_risk: number;
  medium_risk: number;
  on_track: number;
  drafts_ready: number;
}

export interface POException {
  po_number: string;
  supplier: string;
  item_description: string;
  dock_date: string;
  days_to_dock: number;
  status: string;
  risk_level: RiskLevel;
  root_cause: string;
  action_required: string;
}

export interface DraftEmail {
  id: string;
  po_number: string;
  supplier: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  urgency: Urgency;
  context_notes: string;
}

export interface VaultUpdate {
  id: string;
  target_file: string;
  supplier: string;
  reason: string;
  patch_content: string;
  original_context?: string;
}

export interface ChaseResponse {
  summary_metrics: SummaryMetrics;
  exceptions: POException[];
  draft_emails: DraftEmail[];
  vault_updates: VaultUpdate[];
}

export interface VaultDocument {
  path: string;
  name: string;
  category: string;
  content: string;
  last_modified?: string;
}

export interface ApplyVaultUpdateRequest {
  update_id: string;
  target_file: string;
  patch_content: string;
  reason: string;
  author?: string;
}

export interface ApplyVaultUpdateResponse {
  success: boolean;
  target_file: string;
  daily_log_file: string;
  message: string;
}
