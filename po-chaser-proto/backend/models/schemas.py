from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class SummaryMetrics(BaseModel):
    total_pos: int = Field(..., description="Total purchase orders analyzed")
    high_risk: int = Field(..., description="POs requiring urgent intervention")
    medium_risk: int = Field(..., description="POs with upcoming delivery or ASN risk")
    on_track: int = Field(..., description="POs confirmed and within schedule")
    drafts_ready: int = Field(..., description="Follow-up email drafts prepared for review")

class POException(BaseModel):
    po_number: str
    supplier: str
    item_description: str
    dock_date: str
    days_to_dock: int
    status: str
    risk_level: Literal["HIGH", "MEDIUM", "ON_TRACK"]
    root_cause: str
    action_required: str

class DraftEmail(BaseModel):
    id: str
    po_number: str
    supplier: str
    recipient_email: str
    recipient_name: str
    subject: str
    body: str
    urgency: Literal["HIGH", "MEDIUM", "LOW"]
    context_notes: str

class VaultUpdate(BaseModel):
    id: str
    target_file: str
    supplier: str
    reason: str
    patch_content: str
    original_context: Optional[str] = ""

class ChaseRequest(BaseModel):
    pos_raw: str
    emails_raw: str
    vault_override: Optional[Dict[str, str]] = None
    reference_date: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None

class ChaseResponse(BaseModel):
    summary_metrics: SummaryMetrics
    exceptions: List[POException]
    draft_emails: List[DraftEmail]
    vault_updates: List[VaultUpdate]

class ApplyVaultUpdateRequest(BaseModel):
    update_id: str
    target_file: str
    patch_content: str
    reason: str
    author: Optional[str] = "PO Chaser Digital Employee"

class ApplyVaultUpdateResponse(BaseModel):
    success: bool
    target_file: str
    daily_log_file: str
    message: str

class VaultDocument(BaseModel):
    path: str
    name: str
    category: str
    content: str
    last_modified: Optional[str] = None

class VaultListResponse(BaseModel):
    documents: List[VaultDocument]

class VaultSaveRequest(BaseModel):
    path: str
    content: str
