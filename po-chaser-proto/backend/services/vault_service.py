import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from config import VAULT_DIR, SKILLS_DIR
from models.schemas import VaultDocument, ApplyVaultUpdateRequest, ApplyVaultUpdateResponse

class VaultService:
    def __init__(self, vault_dir: Path = VAULT_DIR):
        self.vault_dir = vault_dir
        self.vault_dir.mkdir(parents=True, exist_ok=True)
        (self.vault_dir / "suppliers").mkdir(parents=True, exist_ok=True)
        (self.vault_dir / "sops").mkdir(parents=True, exist_ok=True)
        (self.vault_dir / "daily-logs").mkdir(parents=True, exist_ok=True)

    def list_documents(self) -> List[VaultDocument]:
        docs: List[VaultDocument] = []
        for root, _, files in os.walk(self.vault_dir):
            for file in files:
                if file.endswith(".md"):
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(self.vault_dir).as_posix()
                    category = "root"
                    if "/" in rel_path:
                        category = rel_path.split("/")[0]

                    stat = full_path.stat()
                    last_mod = datetime.fromtimestamp(stat.st_mtime).isoformat()

                    try:
                        content = full_path.read_text(encoding="utf-8")
                    except Exception:
                        content = ""

                    docs.append(VaultDocument(
                        path=rel_path,
                        name=file,
                        category=category,
                        content=content,
                        last_modified=last_mod
                    ))
        return sorted(docs, key=lambda d: d.path)

    def read_document(self, rel_path: str) -> Optional[str]:
        target = (self.vault_dir / rel_path).resolve()
        if not target.is_relative_to(self.vault_dir) or not target.exists():
            return None
        return target.read_text(encoding="utf-8")

    def save_document(self, rel_path: str, content: str) -> bool:
        target = (self.vault_dir / rel_path).resolve()
        if not target.is_relative_to(self.vault_dir):
            raise ValueError("Target path must remain inside vault directory")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return True

    def get_all_vault_context(self, overrides: Optional[Dict[str, str]] = None) -> str:
        """Assembles all markdown files into a unified context string for the Hermes agent."""
        parts = []
        docs = self.list_documents()
        override_map = overrides or {}

        for doc in docs:
            content = override_map.get(doc.path, doc.content)
            parts.append(f"=== VAULT FILE: {doc.path} ===\n{content}\n")

        return "\n".join(parts)

    def apply_update(self, req: ApplyVaultUpdateRequest) -> ApplyVaultUpdateResponse:
        # Normalize relative path
        target_rel = req.target_file
        if target_rel.startswith("vault/"):
            target_rel = target_rel[len("vault/"):]

        target_file = (self.vault_dir / target_rel).resolve()
        if not target_file.is_relative_to(self.vault_dir):
            raise ValueError(f"Path traversal detected: {req.target_file}")

        # Ensure target file exists or create it
        target_file.parent.mkdir(parents=True, exist_ok=True)
        current_content = target_file.read_text(encoding="utf-8") if target_file.exists() else f"# Vendor Notes: {target_file.stem}\n"

        # Append the patch content
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        patch_header = f"\n\n<!-- APPROVED MEMORY PATCH [{timestamp_str}] - ID: {req.update_id} -->\n"
        updated_content = current_content + patch_header + req.patch_content.strip() + "\n"
        target_file.write_text(updated_content, encoding="utf-8")

        # Record in daily log
        today_str = datetime.now().strftime("%Y-%m-%d")
        daily_log_rel = f"daily-logs/{today_str}.md"
        daily_log_file = (self.vault_dir / daily_log_rel).resolve()
        daily_log_file.parent.mkdir(parents=True, exist_ok=True)

        log_entry = (
            f"\n## [{timestamp_str}] Vault Patch Approved\n"
            f"- **Target File**: `{req.target_file}`\n"
            f"- **Update ID**: `{req.update_id}`\n"
            f"- **Reason**: {req.reason}\n"
            f"- **Author / Approver**: {req.author}\n"
            f"```markdown\n{req.patch_content.strip()}\n```\n"
            f"---\n"
        )

        if not daily_log_file.exists():
            daily_log_file.write_text(f"# Knowledge Vault Daily Audit Log: {today_str}\n\n", encoding="utf-8")

        with open(daily_log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)

        return ApplyVaultUpdateResponse(
            success=True,
            target_file=f"vault/{target_rel}",
            daily_log_file=f"vault/{daily_log_rel}",
            message=f"Successfully patched {req.target_file} and logged to {daily_log_rel}"
        )

vault_service = VaultService()
