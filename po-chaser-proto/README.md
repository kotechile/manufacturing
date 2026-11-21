# Supplier & PO Chaser — Autonomous Digital Employee

> **Production-grade prototype application for a "Supplier & PO Chaser" manufacturing digital employee backed by Hermes Agent and an Obsidian-style Markdown knowledge vault.**

[![Draft-First Guardrails](https://img.shields.io/badge/Guardrails-Draft--First%20Strict-emerald.svg)](vault/00-INDEX.md)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](backend/)
[![React + Tailwind](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Tailwind-38bdf8.svg)](frontend/)
[![Docker & Coolify Ready](https://img.shields.io/badge/Deploy-Coolify%20%2F%20Docker-2496ed.svg)](Dockerfile)

---

## 1. Overview & Core Features

In high-mix precision manufacturing, supplier late deliveries and uncommunicated delays cause factory line stoppages. The **Supplier & PO Chaser** acts as an autonomous digital employee that:
1. **Reconciles Open POs with Inbound Communications**: Cross-references raw PO lines against vendor emails (e.g. furnace breakdowns, heat-treat delays, partial shipments, missing ASNs).
2. **Grounds Triage in Markdown Memory**: Reads an Obsidian-style knowledge vault (`vault/`) containing operating SLAs (`00-INDEX.md`), SOPs (`sops/po-chase-sop.md`), and historical vendor profiles (`suppliers/*.md`).
3. **Strict Draft-First Guardrails**: Strictly generates follow-up emails in **Draft Mode** for human review and 1-click clipboard copy. Never dispatches external emails automatically; never fabricates PO numbers or tracking dates.
4. **Proposes Markdown Memory Patches**: Detects lead-time drift and vendor equipment failures, proposing formatted Markdown diffs that can be approved with 1 click to update `vault/suppliers/*.md` and generate timestamped records in `vault/daily-logs/`.
5. **Zero-Config Dual Engine**: Runs out of the box using a deterministic domain reasoning engine, or connects seamlessly to OpenRouter / OpenAI / Hermes Agent endpoints when an API key is provided.

```
                           +---------------------------+
                           |  Raw Open POs (CSV/TSV)   |
                           |  Inbound Vendor Emails    |
                           +-------------+-------------+
                                         |
                                         v
+------------------------+      +------------------+      +---------------------------+
| Obsidian Vault Memory  | ---> |   Hermes Agent   | ---> | 1. KPI Metric Strip       |
| • 00-INDEX.md (SLAs)   |      |  Reasoning Core  |      | 2. At-Risk Exception Tbl  |
| • sops/po-chase-sop.md |      | (LLM or Rules)   |      | 3. Draft Follow-Up Emails |
| • suppliers/*.md       |      +------------------+      | 4. Proposed Vault Patches |
+------------------------+                                +-------------+-------------+
            ^                                                           |
            |                                                           | Human Approval
            +----------------- POST /api/apply-vault-update <-----------+ (1-Click Commit)
```

---

## 2. Project Structure

```
po-chaser-proto/
├── Dockerfile                  # Multi-stage production container (Node build + FastAPI runner)
├── docker-compose.yml          # Container orchestration with persistent volume mounts
├── .env.example                # Environment variables template
├── README.md                   # Complete documentation
│
├── vault/                      # Persistent Markdown Knowledge Vault ("Obsidian-Style")
│   ├── 00-INDEX.md             # Core rules, escalation SLAs (<=4 days unconfirmed -> HIGH), guardrails
│   ├── sops/
│   │   └── po-chase-sop.md     # SOP-PROC-042: Triage playbooks for unconfirmed, slips, partials, silence
│   ├── suppliers/
│   │   ├── titan-metals.md     # Vendor profile (furnace bottlenecks, Q4 drift history, escalation path)
│   │   └── apex-fasteners.md   # Vendor profile (reliable, 48h ASN SLA requirement)
│   └── daily-logs/             # Timestamped audit records of approved memory patches
│
├── skills/
│   └── po-chaser/
│       └── SKILL.md            # Hermes Agent skill definition, lookup rules, strict JSON contract
│
├── sample_data/
│   ├── open_pos.csv            # Realistic manufacturing PO dataset (5 POs with varied risks)
│   ├── inbound_emails.txt      # Inbound supplier email snippets matching PO numbers
│   └── test_payload.json      # Pre-assembled integration test JSON
│
├── backend/
│   ├── main.py                 # FastAPI application, CORS, static file serving
│   ├── config.py               # Environment configuration & path resolvers
│   ├── requirements.txt        # Backend dependencies
│   ├── models/schemas.py       # Pydantic v2 data models & JSON contract
│   ├── services/
│   │   ├── vault_service.py    # Reads/writes vault files & logs audit entries
│   │   └── hermes_service.py   # Dual-engine reasoning (LLM + deterministic fallback)
│   └── tests/
│       └── test_chase_api.py   # Pytest suite with strict schema checks
│
└── frontend/
    ├── package.json            # React 18, Vite, Tailwind CSS, Lucide icons
    ├── vite.config.ts          # Vite build & API proxy configuration
    ├── tailwind.config.js      # Styling configuration
    └── src/
        ├── App.tsx             # Main layout & state orchestration
        ├── components/
        │   ├── Header.tsx      # Digital employee brand, Draft-First indicator, settings
        │   ├── KPIStrip.tsx    # 6-card executive metric strip
        │   ├── LeftPanel.tsx   # PO/email textareas, sample data loader, vault explorer
        │   ├── ExceptionTable.tsx # Interactive risk table with dock countdowns
        │   ├── EmailDrafts.tsx # Email cards with 1-click clipboard copy
        │   ├── VaultPatchViewer.tsx # Markdown diff viewer with "Approve & Save"
        │   ├── VaultEditorModal.tsx # In-browser Markdown vault document editor
        │   └── SettingsModal.tsx # LLM & OpenRouter API key configuration modal
        └── services/api.ts     # Type-safe API client
```

---

## 3. Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm

### 1. Run Backend
```bash
cd po-chaser-proto/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest -v         # Run automated tests
uvicorn main:app --reload --port 8000
```

### 2. Run Frontend
```bash
cd po-chaser-proto/frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. One-Click Verification Flow

1. Click **"Load Sample Mfg Data"** in the left panel.
   - Populates 5 realistic open PO rows (Titan Metals, Apex Fasteners, Precision Gears, Starlight Plastics).
   - Populates 4 inbound vendor emails (furnace heating failure, delay notice, partial shipment, order acknowledgement).
2. Click **"Chase POs & Run Analysis"**.
3. Inspect the results:
   - **KPI Strip**: Updates with High Risk (2), Medium Risk (1), On Track (2), Drafts Ready (4), Vault Patches (2).
   - **Exception Table**: Shows PO-9021 (Titan Metals, 3d countdown, HIGH RISK) and PO-7731 (Precision Gears, 2d countdown, HIGH RISK).
   - **Draft Follow-Up Emails**: Read the generated email for PO-9021 mentioning the furnace failure; click **"Copy Draft"** to test clipboard copy.
   - **Proposed Vault Memory Patches**: Inspect the formatted Markdown diff for `vault/suppliers/titan-metals.md`. Click **"Approve & Save to Vault"**.
   - Verify that `vault/suppliers/titan-metals.md` is updated on disk and a new log is created in `vault/daily-logs/`.

---

## 5. Deployment with Coolify on Ubuntu VPS

The project is built to deploy seamlessly on Coolify (or standard Docker Compose on any Ubuntu VPS).

### Deploy via Docker Compose
```bash
cd po-chaser-proto
docker compose up -d --build
```
Access the application at `http://<your-vps-ip>:8000`.

### Persistent Volumes
The `docker-compose.yml` mounts:
- `./vault:/app/vault` — Ensures all vendor profiles, SOPs, and approved memory logs survive container updates.
- `./skills:/app/skills` — Ensures agent skill definitions remain persistent and editable.

### Optional LLM Configuration
Set the following in `.env` or Coolify Environment Variables:
```env
HERMES_API_KEY=sk-or-v1-your-openrouter-key
HERMES_API_BASE=https://openrouter.ai/api/v1
HERMES_MODEL=nousresearch/hermes-3-llama-3.1-70b
```
*(If omitted, the prototype operates automatically in offline deterministic mode).*

---

## 6. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns service status and Draft-First guardrail confirmation |
| `GET` | `/api/sample-data` | Returns realistic open PO rows and email snippets |
| `GET` | `/api/vault` | Lists all Markdown documents in the knowledge vault |
| `POST` | `/api/vault` | Saves/updates a Markdown document in the vault |
| `POST` | `/api/chase-pos` | Analyzes POs against emails & vault; returns strict JSON contract |
| `POST` | `/api/apply-vault-update` | Appends approved patch to supplier file & writes daily audit log |

---

## 7. Strict JSON Contract

`POST /api/chase-pos` strictly enforces this response schema:
```json
{
  "summary_metrics": {
    "total_pos": 5,
    "high_risk": 2,
    "medium_risk": 1,
    "on_track": 2,
    "drafts_ready": 4
  },
  "exceptions": [
    {
      "po_number": "PO-9021",
      "supplier": "Titan Metals Ltd",
      "item_description": "4140 Annealed Alloy Steel Rod 2in dia x 12ft",
      "dock_date": "2026-11-24",
      "days_to_dock": 3,
      "status": "UNCONFIRMED",
      "risk_level": "HIGH",
      "root_cause": "Furnace element breakdown at Titan Metals; delivery slipping past Nov 24 dock date...",
      "action_required": "Escalate directly to Plant Ops Lead Dave Henderson..."
    }
  ],
  "draft_emails": [
    {
      "id": "draft-po-9021",
      "po_number": "PO-9021",
      "supplier": "Titan Metals Ltd",
      "recipient_email": "orders@titanmetals.example.com",
      "recipient_name": "Dave Henderson & Titan Metals Dispatch",
      "subject": "URGENT ESCALATION: Critical Dock Slip on PO PO-9021 (4140 Rods - Dock Date 2026-11-24)",
      "body": "Hi Dave and Titan Metals Team,\n\nWe received your notice regarding...",
      "urgency": "HIGH",
      "context_notes": "Furnace heating element failure announced; CC Dave Henderson..."
    }
  ],
  "vault_updates": [
    {
      "id": "patch-titan-metals-furnace",
      "target_file": "vault/suppliers/titan-metals.md",
      "supplier": "Titan Metals Ltd",
      "reason": "Log recurring Q4 induction furnace heating element breakdown and +3 day delivery slip...",
      "patch_content": "### 2026-11-21 Incident Log: PO-9021\n- **Incident Type**: DELIVERY_SLIP...",
      "original_context": "Titan Metals 00-INDEX and titan-metals.md memory layer"
    }
  ]
}
```
