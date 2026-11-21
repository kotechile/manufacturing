import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import VAULT_DIR, SKILLS_DIR, SAMPLE_DATA_DIR, STATIC_DIR, PORT, HOST
from models.schemas import (
    ChaseRequest,
    ChaseResponse,
    ApplyVaultUpdateRequest,
    ApplyVaultUpdateResponse,
    VaultListResponse,
    VaultSaveRequest,
)
from services.vault_service import vault_service
from services.hermes_service import hermes_service

app = FastAPI(
    title="Hermes Supplier & PO Chaser API",
    description="Backend API for autonomous manufacturing PO follow-up and Obsidian-style Markdown memory vault.",
    version="1.0.0"
)

# Enable CORS for local development and Coolify VPS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "po-chaser-backend",
        "vault_documents_count": len(vault_service.list_documents()),
        "guardrail": "Draft-First Active (No real emails sent)"
    }

@app.get("/api/sample-data")
async def get_sample_data():
    """Returns realistic open PO CSV and inbound vendor email snippets for 1-click loading."""
    pos_file = SAMPLE_DATA_DIR / "open_pos.csv"
    emails_file = SAMPLE_DATA_DIR / "inbound_emails.txt"

    pos_raw = pos_file.read_text(encoding="utf-8") if pos_file.exists() else ""
    emails_raw = emails_file.read_text(encoding="utf-8") if emails_file.exists() else ""

    return {
        "pos_raw": pos_raw,
        "emails_raw": emails_raw,
        "reference_date": "2026-11-21"
    }

@app.get("/api/vault", response_model=VaultListResponse)
async def list_vault_files():
    """Returns all Markdown files in the Obsidian-style knowledge vault."""
    docs = vault_service.list_documents()
    return VaultListResponse(documents=docs)

@app.post("/api/vault")
async def save_vault_file(req: VaultSaveRequest):
    """Saves or updates a Markdown document in the knowledge vault."""
    try:
        vault_service.save_document(req.path, req.content)
        return {"success": True, "path": req.path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/chase-pos", response_model=ChaseResponse)
async def chase_pos(req: ChaseRequest):
    """Analyzes open POs against inbound emails and vault rules, returning strictly structured JSON."""
    if not req.pos_raw.strip():
        raise HTTPException(status_code=400, detail="pos_raw cannot be empty")

    try:
        response = await hermes_service.chase_pos(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process POs: {str(e)}")

@app.post("/api/apply-vault-update", response_model=ApplyVaultUpdateResponse)
async def apply_vault_update(req: ApplyVaultUpdateRequest):
    """Appends an approved memory patch to the target vault supplier file and records in daily-logs/."""
    try:
        result = vault_service.apply_update(req)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply vault update: {str(e)}")

# Mount static frontend build if present
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
