import pytest
from pathlib import Path
import json
from fastapi.testclient import TestClient

from main import app
from services.vault_service import vault_service

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Draft-First" in data["guardrail"]

def test_get_sample_data():
    response = client.get("/api/sample-data")
    assert response.status_code == 200
    data = response.json()
    assert "pos_raw" in data
    assert "emails_raw" in data
    assert "PO-9021" in data["pos_raw"]
    assert "Titan Metals" in data["emails_raw"]

def test_list_vault():
    response = client.get("/api/vault")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    doc_paths = [d["path"] for d in data["documents"]]
    assert "00-INDEX.md" in doc_paths
    assert "suppliers/titan-metals.md" in doc_paths
    assert "sops/po-chase-sop.md" in doc_paths

def test_chase_pos_strict_schema():
    sample_resp = client.get("/api/sample-data")
    sample_data = sample_resp.json()

    payload = {
        "pos_raw": sample_data["pos_raw"],
        "emails_raw": sample_data["emails_raw"],
        "reference_date": "2026-11-21"
    }

    response = client.post("/api/chase-pos", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Enforce strict 4-part schema contract
    assert "summary_metrics" in data
    assert "exceptions" in data
    assert "draft_emails" in data
    assert "vault_updates" in data

    metrics = data["summary_metrics"]
    assert metrics["total_pos"] == 5
    assert metrics["high_risk"] >= 2
    assert metrics["medium_risk"] >= 1
    assert metrics["drafts_ready"] >= 3

    # Check high risk exceptions
    high_exceptions = [e for e in data["exceptions"] if e["risk_level"] == "HIGH"]
    high_pos = [e["po_number"] for e in high_exceptions]
    assert "PO-9021" in high_pos  # Titan metals furnace delay
    assert "PO-7731" in high_pos  # Precision gears slip

    # Check draft emails
    draft_recipients = [d["recipient_email"] for d in data["draft_emails"]]
    assert any("titanmetals" in r for r in draft_recipients)
    assert all("Draft-First" in d["body"] or "draft" in d["body"].lower() for d in data["draft_emails"])

    # Check proposed vault updates
    updates = data["vault_updates"]
    assert len(updates) >= 1
    titan_patch = next((u for u in updates if "titan-metals" in u["target_file"]), None)
    assert titan_patch is not None
    assert "furnace" in titan_patch["patch_content"].lower()

def test_apply_vault_update_and_audit_log():
    # Test applying a patch to vault
    patch_payload = {
        "update_id": "test-patch-001",
        "target_file": "vault/suppliers/titan-metals.md",
        "patch_content": "### Automated Test Patch Entry\n- Status: Verified by unit test.",
        "reason": "Verify patch append and daily audit logging functionality.",
        "author": "Pytest Automation Runner"
    }

    response = client.post("/api/apply-vault-update", json=patch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "suppliers/titan-metals.md" in data["target_file"]

    # Verify target file has the patch appended
    doc_content = vault_service.read_document("suppliers/titan-metals.md")
    assert doc_content is not None
    assert "Automated Test Patch Entry" in doc_content
    assert "test-patch-001" in doc_content

    # Verify daily log was created
    daily_logs = [d for d in vault_service.list_documents() if d.category == "daily-logs"]
    assert len(daily_logs) >= 1
    latest_log = daily_logs[-1]
    assert "test-patch-001" in latest_log.content
