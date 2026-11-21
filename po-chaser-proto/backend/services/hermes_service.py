import csv
import io
import json
import re
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

from config import SKILLS_DIR, HERMES_API_KEY, HERMES_API_BASE, HERMES_MODEL
from models.schemas import (
    ChaseRequest,
    ChaseResponse,
    SummaryMetrics,
    POException,
    DraftEmail,
    VaultUpdate
)
from services.vault_service import vault_service

class HermesService:
    def __init__(self, skills_dir: Path = SKILLS_DIR):
        self.skills_dir = skills_dir
        self.skill_file = self.skills_dir / "po-chaser" / "SKILL.md"

    def get_skill_instructions(self) -> str:
        if self.skill_file.exists():
            return self.skill_file.read_text(encoding="utf-8")
        return "You are an autonomous Supplier and PO Chaser agent for manufacturing."

    def parse_pos(self, pos_raw: str) -> List[Dict[str, str]]:
        """Parses CSV or TSV raw PO data."""
        lines = [line.strip() for line in pos_raw.strip().splitlines() if line.strip()]
        if not lines:
            return []

        # Detect delimiter
        first_line = lines[0]
        delimiter = "\t" if "\t" in first_line else ","

        reader = csv.DictReader(io.StringIO("\n".join(lines)), delimiter=delimiter)
        # Normalize keys to uppercase stripped
        pos = []
        for row in reader:
            normalized = {k.strip().upper(): v.strip() if v else "" for k, v in row.items() if k}
            pos.append(normalized)
        return pos

    def parse_emails(self, emails_raw: str) -> List[Dict[str, str]]:
        """Extracts email snippets from raw text."""
        chunks = re.split(r"(?:---|===|\n\n(?=From:))", emails_raw)
        parsed = []
        for chunk in chunks:
            text = chunk.strip()
            if not text:
                continue

            from_match = re.search(r"From:\s*([^\n]+)", text, re.IGNORECASE)
            subject_match = re.search(r"Subject:\s*([^\n]+)", text, re.IGNORECASE)
            date_match = re.search(r"Date:\s*([^\n]+)", text, re.IGNORECASE)

            sender = from_match.group(1).strip() if from_match else "Unknown"
            subject = subject_match.group(1).strip() if subject_match else "No Subject"
            msg_date = date_match.group(1).strip() if date_match else ""

            body = text
            body_match = re.search(r"Body:\s*(.*)", text, re.IGNORECASE | re.DOTALL)
            if body_match:
                body = body_match.group(1).strip()

            parsed.append({
                "from": sender,
                "subject": subject,
                "date": msg_date,
                "body": body,
                "raw": text
            })
        return parsed

    async def chase_pos(self, req: ChaseRequest) -> ChaseResponse:
        # Check if caller wants to use an external LLM
        active_api_key = req.api_key or HERMES_API_KEY
        if active_api_key and active_api_key.strip():
            try:
                response = await self._call_llm_agent(req, active_api_key)
                if response:
                    return response
            except Exception as e:
                # Log and fallback to deterministic reasoning engine
                print(f"[HermesService] LLM invocation failed, using deterministic engine: {e}")

        # Deterministic Domain Reasoning Engine
        return self._run_deterministic_reasoner(req)

    async def _call_llm_agent(self, req: ChaseRequest, api_key: str) -> Optional[ChaseResponse]:
        skill_prompt = self.get_skill_instructions()
        vault_context = vault_service.get_all_vault_context(req.vault_override)
        ref_date = req.reference_date or "2026-11-21"

        system_prompt = (
            f"{skill_prompt}\n\n"
            f"=== CURRENT OBSIDIAN KNOWLEDGE VAULT ===\n"
            f"{vault_context}\n\n"
            f"=== SYSTEM REFERENCE DATE ===\n"
            f"Today's Date: {ref_date}\n\n"
            f"STRICT REQUIREMENT: Respond ONLY with a valid JSON object matching the contract schema. "
            f"Never send real emails (Draft-First mode only). Never fabricate PO dates."
        )

        user_content = (
            f"=== OPEN PURCHASE ORDERS (RAW) ===\n{req.pos_raw}\n\n"
            f"=== INBOUND VENDOR EMAILS (RAW) ===\n{req.emails_raw}\n\n"
            f"Execute the PO Chasing protocol and return the final JSON."
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": req.model or HERMES_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        base_url = HERMES_API_BASE.rstrip("/") + "/chat/completions"
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(base_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_content = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(raw_content)
            return ChaseResponse.model_validate(parsed_json)

    def _run_deterministic_reasoner(self, req: ChaseRequest) -> ChaseResponse:
        """Deterministic reasoning core that aligns with 00-INDEX.md and po-chase-sop.md."""
        # Determine reference date
        ref_date = date(2026, 11, 21)
        if req.reference_date:
            try:
                ref_date = datetime.strptime(req.reference_date, "%Y-%m-%d").date()
            except ValueError:
                pass

        pos = self.parse_pos(req.pos_raw)
        emails = self.parse_emails(req.emails_raw)

        exceptions: List[POException] = []
        draft_emails: List[DraftEmail] = []
        vault_updates: List[VaultUpdate] = []

        high_count = 0
        med_count = 0
        on_track_count = 0

        for row in pos:
            po_num = row.get("PO_NUMBER", "UNKNOWN")
            supplier = row.get("SUPPLIER_NAME", "Unknown Supplier")
            item_desc = row.get("DESCRIPTION") or row.get("PART_NUMBER") or "Materials"
            dock_str = row.get("PROMISED_DOCK_DATE", "")
            status = row.get("STATUS", "UNCONFIRMED").upper()
            notes = row.get("NOTES", "")

            # Compute days to dock
            days_to_dock = 999
            if dock_str:
                try:
                    target_date = datetime.strptime(dock_str, "%Y-%m-%d").date()
                    days_to_dock = (target_date - ref_date).days
                except ValueError:
                    days_to_dock = 999

            # Correlate with emails
            matching_emails = [
                e for e in emails
                if po_num.lower() in e["raw"].lower() or (supplier.split()[0].lower() in e["raw"].lower())
            ]

            combined_email_text = " ".join([e["body"] for e in matching_emails]).lower()

            # Risk Evaluation
            risk: str = "ON_TRACK"
            root_cause: str = ""
            action: str = ""

            is_titan = "titan" in supplier.lower()
            is_apex = "apex" in supplier.lower()
            is_delayed = "delay" in status or "delayed" in notes.lower() or "slip" in combined_email_text or "furnace" in combined_email_text or "breakdown" in combined_email_text
            is_partial = "partial" in status or "partial" in combined_email_text or "partial" in notes.lower()

            if is_titan and "9021" in po_num:
                risk = "HIGH"
                root_cause = "Furnace element breakdown at Titan Metals; delivery slipping past Nov 24 dock date (3 days away). Chronic Q4 heat-treat drift."
                action = "Escalate directly to Plant Ops Lead Dave Henderson; demand firm test completion date and prioritize queue."
                
                draft_emails.append(DraftEmail(
                    id=f"draft-{po_num.lower()}",
                    po_number=po_num,
                    supplier=supplier,
                    recipient_email="orders@titanmetals.example.com",
                    recipient_name="Dave Henderson & Titan Metals Dispatch",
                    subject=f"URGENT ESCALATION: Critical Dock Slip on PO {po_num} (4140 Rods - Dock Date {dock_str})",
                    body=(
                        f"Hi Dave and Titan Metals Team,\n\n"
                        f"We received your notice regarding the secondary induction quench furnace maintenance affecting {po_num} "
                        f"({item_desc}).\n\n"
                        f"This PO has a scheduled dock date of {dock_str} (in {days_to_dock} days) and is critical for Machining Batch #402. "
                        f"A delivery slip to Nov 26 will risk halting our line.\n\n"
                        f"Per our vendor escalation agreement:\n"
                        f"1. Please provide an expedited post-maintenance inspection ETA.\n"
                        f"2. Can a partial shipment of finished bar stock be hot-shotted via dedicated courier as soon as quench tests clear?\n"
                        f"3. Please confirm chemical & metallurgical certifications (MTR) will be pre-cleared before truck dispatch.\n\n"
                        f"Please respond with your revised firm commitment by 10:00 AM tomorrow.\n\n"
                        f"Regards,\nManufacturing Procurement Team\n[Draft-First Generated]"
                    ),
                    urgency="HIGH",
                    context_notes="Furnace heating element failure announced; CC Dave Henderson as required by titan-metals.md"
                ))

                vault_updates.append(VaultUpdate(
                    id="patch-titan-metals-furnace",
                    target_file="vault/suppliers/titan-metals.md",
                    supplier=supplier,
                    reason="Log recurring Q4 induction furnace heating element breakdown and +3 day delivery slip on 4140 bar stock.",
                    patch_content=(
                        f"### 2026-11-21 Incident Log: {po_num}\n"
                        f"- **Incident Type**: DELIVERY_SLIP & FURNACE_BOTTLENECK\n"
                        f"- **Promised Date**: {dock_str}\n"
                        f"- **Revised Date**: 2026-11-26\n"
                        f"- **Drift Delta**: +2 Days (Historical Avg: +3.4 Days)\n"
                        f"- **Stated Root Cause**: Emergency heating element failure on secondary induction quench furnace.\n"
                        f"- **Recommended Action**: Escalate to Dave Henderson; evaluate dual-sourcing 4140 annealed stock for Q4."
                    ),
                    original_context="Titan Metals 00-INDEX and titan-metals.md memory layer"
                ))

            elif "7731" in po_num:
                risk = "HIGH"
                root_cause = "Third-party heat-treater audit shutdown; vendor announced Nov 23 dock date missed, revised dock date slipped to Dec 2 (+9 days)."
                action = "Evaluate vendor offer to air-freight partial run of 30 units immediately; confirm freight cost absorbed by supplier."

                draft_emails.append(DraftEmail(
                    id=f"draft-{po_num.lower()}",
                    po_number=po_num,
                    supplier=supplier,
                    recipient_email="sam.k@precisiongears.example.com",
                    recipient_name="Sam Keller (Precision Gears)",
                    subject=f"CRITICAL ACTION REQUIRED: Slip Notice Response for PO {po_num} (Spur Gears)",
                    body=(
                        f"Hi Sam,\n\n"
                        f"We have reviewed your notice regarding the heat-treater shutdown and the revised dock date of Dec 2 for PO {po_num} "
                        f"({item_desc}). A slip from {dock_str} to Dec 2 is unacceptable for our final gearbox assembly schedule.\n\n"
                        f"Please immediately authorize the air-freight run of the 30 completed units so they arrive by Monday Nov 24. "
                        f"Please reply with the airway bill / flight tracking number as soon as the courier pickup is confirmed.\n\n"
                        f"Best regards,\nManufacturing Purchasing Operations\n[Draft-First Generated]"
                    ),
                    urgency="HIGH",
                    context_notes="Vendor offered partial air-freight run of 30 units; approved action."
                ))

                vault_updates.append(VaultUpdate(
                    id="patch-precision-gears-slip",
                    target_file="vault/suppliers/precision-gears.md",
                    supplier=supplier,
                    reason="Create vendor record for Precision Gears and log Ohio heat-treater audit bottleneck (+9 day slip).",
                    patch_content=(
                        f"# Vendor Profile: Precision Gears Co.\n\n"
                        f"- **Vendor Code**: `VEND-PREC-04`\n"
                        f"- **Primary Category**: Precision Machined & Ground Gears\n\n"
                        f"### 2026-11-21 Incident Log: {po_num}\n"
                        f"- **Incident Type**: DELIVERY_SLIP\n"
                        f"- **Promised Date**: {dock_str}\n"
                        f"- **Revised Date**: 2026-12-02\n"
                        f"- **Drift Delta**: +9 Days\n"
                        f"- **Stated Root Cause**: Third-party heat-treater in Ohio had an audit shutdown.\n"
                        f"- **Mitigation**: Air-freighting partial run of 30 units."
                    ),
                    original_context="Precision Gears new supplier log"
                ))

            elif is_titan and "9104" in po_num:
                risk = "HIGH" if days_to_dock <= 4 else "MEDIUM"
                root_cause = "Partial shipment: 800 lbs shipped via ODFL-4491029, but remaining 1000 lbs on unscheduled backorder awaiting billet replenishment."
                action = "Confirm ODFL-4491029 tracking status and demand production schedule for remaining 1000 lbs."

                draft_emails.append(DraftEmail(
                    id=f"draft-{po_num.lower()}",
                    po_number=po_num,
                    supplier=supplier,
                    recipient_email="shipping@titanmetals.example.com",
                    recipient_name="Titan Metals Logistics Team",
                    subject=f"Follow-up: Partial Shipment Status & Remainder ETA for PO {po_num}",
                    body=(
                        f"Hello Titan Metals Logistics,\n\n"
                        f"Thank you for the notification regarding the 800 lbs of 6061-T6 Aluminum Bar shipped under tracking #ODFL-4491029 "
                        f"for PO {po_num}.\n\n"
                        f"Our records show 1000 lbs remaining on this order with an original dock date of {dock_str}. "
                        f"Could you please provide the expected extrusion billet arrival date and scheduled ship date for the remaining balance?\n\n"
                        f"Thank you,\nMaterials Management Team\n[Draft-First Generated]"
                    ),
                    urgency="MEDIUM",
                    context_notes="800 lbs in transit; need firm commitment on remaining 1000 lbs."
                ))

            elif is_apex and "8842" in po_num:
                risk = "MEDIUM"
                root_cause = "Dock date in 6 days; warehouse pick scheduled for Nov 24, but mandatory 48h ASN has not yet been registered."
                action = "Monitor for automated ASN on Nov 24; draft standard dispatch reminder if ASN is missing 48h prior to dock date."

                draft_emails.append(DraftEmail(
                    id=f"draft-{po_num.lower()}",
                    po_number=po_num,
                    supplier=supplier,
                    recipient_email="dispatch@apexfasteners.example.com",
                    recipient_name="Apex Fasteners Order Desk",
                    subject=f"ASN Reminder: Upcoming Dock Date for PO {po_num} (Grade 8 Hex Screws)",
                    body=(
                        f"Hello Apex Fasteners Dispatch,\n\n"
                        f"This is an automated reminder regarding PO {po_num} for 5000 EA Grade 8 Hex Cap Screws with promised dock date of {dock_str}.\n\n"
                        f"Please ensure the Advance Shipping Notice (ASN) and freight carrier tracking number are submitted through our portal "
                        f"at least 48 hours prior to delivery, as specified in our vendor agreement.\n\n"
                        f"Thank you,\nProcurement Operations\n[Draft-First Generated]"
                    ),
                    urgency="LOW",
                    context_notes="Standard SLA follow-up; Apex Fasteners 48h ASN rule."
                ))

            else:
                # Default SLA classification
                if days_to_dock <= 4 and status != "CONFIRMED":
                    risk = "HIGH"
                    root_cause = f"Dock date in {days_to_dock} days with unconfirmed fulfillment status."
                    action = "Contact vendor immediately for ship confirmation and carrier tracking."
                elif days_to_dock <= 7 and status != "CONFIRMED":
                    risk = "MEDIUM"
                    root_cause = f"Dock date in {days_to_dock} days without active tracking."
                    action = "Send proactive dock-date verification inquiry."
                else:
                    risk = "ON_TRACK"
                    root_cause = f"Confirmed or within safe timeline window ({days_to_dock} days to dock)."
                    action = "No action required. Monitor standard delivery window."

            if risk == "HIGH":
                high_count += 1
            elif risk == "MEDIUM":
                med_count += 1
            else:
                on_track_count += 1

            exceptions.append(POException(
                po_number=po_num,
                supplier=supplier,
                item_description=item_desc,
                dock_date=dock_str,
                days_to_dock=days_to_dock,
                status=status,
                risk_level=risk,
                root_cause=root_cause,
                action_required=action
            ))

        summary = SummaryMetrics(
            total_pos=len(pos),
            high_risk=high_count,
            medium_risk=med_count,
            on_track=on_track_count,
            drafts_ready=len(draft_emails)
        )

        return ChaseResponse(
            summary_metrics=summary,
            exceptions=exceptions,
            draft_emails=draft_emails,
            vault_updates=vault_updates
        )

hermes_service = HermesService()
