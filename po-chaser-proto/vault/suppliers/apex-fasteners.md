# Vendor Profile: Apex Fasteners Inc.

- **Vendor Code**: `VEND-APEX-09`
- **Primary Category**: Standard Hardware, Grade 8 Structural Bolts, Custom Fasteners
- **Overall Reliability Rating**: **A** (High volume, highly automated EDI workflow)

---

## Key Contacts
- **Automated Dispatch / Orders**: `dispatch@apexfasteners.example.com`
- **Regional Account Executive**: Sarah Miller (`sarah.miller@apexfasteners.example.com`, Direct: +1-555-012-4491)
- **Logistics & ASN Support**: `freight@apexfasteners.example.com`

---

## SLA & Operating Protocols
- **Advance Shipping Notice (ASN) SLA**:
  - Apex Fasteners contracts require an automated ASN with carrier freight tracking number submitted at least **48 hours prior to dock date**.
- **Historical Drift Average**: +0.2 days (98.2% on-time dock delivery).
- **Automation Quirk**:
  - Unconfirmed orders with dock dates $\le 48$ hours typically mean an EDI payload failure or credit hold on account, rather than production delays.

---

## Specific Escalation Rules for PO Chaser
1. **48h ASN Rule**: If dock date is $\le 2$ days and no ASN has been indexed, immediately classify as **HIGH RISK** and draft an inquiry requesting the BOL / carrier PRO number.
2. **Standard Chasing**: Between 5 and 7 days, allow automated reminder; keep risk as **MEDIUM** or **ON_TRACK** depending on inventory status.
3. **Escalation Recipient**: Direct routine inquiries to `dispatch@apexfasteners.example.com`; CC `sarah.miller@apexfasteners.example.com` only if zero response after 24 business hours.
