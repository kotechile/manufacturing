# Standard Operating Procedure (SOP): PO Chasing & Exception Triage

- **SOP ID**: `SOP-PROC-042`
- **Version**: 2.1
- **Effective Date**: 2026-11-21
- **Target Audience**: Autonomous Procurement Agent & Production Control Team

---

## 1. Objective
Provide a deterministic, repeatable workflow for monitoring open purchase orders (POs), reconciling inbound supplier communications, computing dock-date countdowns, and executing standardized Draft-First follow-up workflows.

---

## 2. Triage Decision Tree

### Scenario A: Unconfirmed PO with Dock Date $\le$ 4 Days
- **Risk Level**: **HIGH**
- **Action**:
  1. Inspect vendor profile for contact escalation chain.
  2. Draft urgent confirmation email requesting:
     - Exact ship date and scheduled carrier.
     - Confirmation of part number, quantity, and packaging specs.
     - Required tracking number / PRO / Airway Bill.
  3. If vendor history shows chronic drift (e.g., Titan Metals), ask for plant status.

### Scenario B: Vendor Delivery Slip Notice
- **Risk Level**: **HIGH**
- **Action**:
  1. Calculate net slip: $\Delta = \text{Revised Date} - \text{Promised Dock Date}$.
  2. Flag impact on downstream manufacturing assembly or customer delivery.
  3. Draft response acknowledging slip, requiring firm delivery commitment, and inquiring if expedited/split air freight is feasible.
  4. Propose memory patch to `vault/suppliers/<vendor>.md` capturing slip delta and stated root cause.

### Scenario C: Partial Shipment
- **Risk Level**: **MEDIUM** (unless remaining quantity halts line $\rightarrow$ **HIGH**)
- **Action**:
  1. Confirm tracking number and ETA for the shipped portion.
  2. Request firm production release date and ship date for remaining balance.
  3. Propose memory patch to record partial shipment pattern.

### Scenario D: Silent Vendor ($>$ 48 Hours Unresponsive)
- **Risk Level**: **HIGH** if dock date $\le 4$ days; **MEDIUM** if dock date $5\text{--}7$ days.
- **Action**:
  1. Escalate to secondary executive contact in vendor profile.
  2. Suggest phone call escalation note for buyer.

### Scenario E: Confirmed PO with Valid ASN / Tracking
- **Risk Level**: **ON_TRACK**
- **Action**:
  1. Verify carrier tracking shows scheduled delivery on or before dock date.
  2. No outbound email required.

---

## 3. Approved Memory Update Formatting
When proposing updates to the knowledge vault, follow this strict Markdown structure:

```markdown
### YYYY-MM-DD Incident Log: [PO_NUMBER]
- **Incident Type**: [DELIVERY_SLIP | PARTIAL_SHIPMENT | UNCONFIRMED_ESCALATION | LEAD_TIME_DRIFT]
- **Promised Date**: [YYYY-MM-DD]
- **Revised / Observed Date**: [YYYY-MM-DD]
- **Drift Delta**: [+X Days]
- **Stated Root Cause**: [Summary of vendor explanation]
- **Recommended Action**: [Vendor management recommendation]
```
