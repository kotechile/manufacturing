# Vendor Profile: Titan Metals Ltd

- **Vendor Code**: `VEND-TITAN-01`
- **Primary Category**: Raw Bar Stock, Structural Alloys & Plate Extrusions
- **Overall Reliability Rating**: **C+** (Frequent furnace bottlenecks in Q3/Q4)

---

## Key Contacts
- **Primary Sales Desk**: `orders@titanmetals.example.com`
- **Customer Service Rep**: Brenda Watson (`b.watson@titanmetals.example.com`)
- **Escalation Contact (Plant Operations)**: Dave Henderson (`dave.henderson@titanmetals.example.com`, Mobile: +1-555-019-8234)
- **Shipping / ASN Notification**: `shipping@titanmetals.example.com`

---

## Lead-Time Drift History & Known Vulnerabilities
- **Historical Drift Average**: +3.4 days beyond promise date on 4140, 4340, and specialty tool steel.
- **Root Cause Vulnerabilities**:
  - Titan's heat-treat induction quench furnace experiences recurring coil failures under heavy seasonal loads.
  - Secondary processing (centerless grinding and saw cutting) frequently incurs an uncommunicated 48-hour backlog.
- **Communication Pattern**: Reactive. Rarely alerts purchasing proactively until 24–48 hours before dock date.

---

## Specific Escalation Rules for PO Chaser
1. **Unconfirmed Threshold**: If any PO is unconfirmed within **3 business days** of dock date, flag as **HIGH RISK**.
2. **Escalation Trigger**: Always CC `dave.henderson@titanmetals.example.com` when drafting escalation emails for delays exceeding 48 hours.
3. **Verification Question**: Inquire explicitly whether heat-treat and chemical certifications (MTRs) have cleared metallurgical QA before release.


<!-- APPROVED MEMORY PATCH [2026-11-21 18:51:40] - ID: test-patch-001 -->
### Automated Test Patch Entry
- Status: Verified by unit test.


<!-- APPROVED MEMORY PATCH [2026-11-21 18:55:15] - ID: patch-titan-metals-furnace -->
### 2026-11-21 Incident Log: PO-9021
- **Incident Type**: DELIVERY_SLIP & FURNACE_BOTTLENECK
- **Promised Date**: 2026-11-24
- **Revised Date**: 2026-11-26
- **Drift Delta**: +2 Days (Historical Avg: +3.4 Days)
- **Stated Root Cause**: Emergency heating element failure on secondary induction quench furnace.
- **Recommended Action**: Escalate to Dave Henderson; evaluate dual-sourcing 4140 annealed stock for Q4.
