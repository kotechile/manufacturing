import os
from pathlib import Path

# Resolve base directories
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
VAULT_DIR = Path(os.getenv("VAULT_DIR", str(PROJECT_DIR / "vault"))).resolve()
SKILLS_DIR = Path(os.getenv("SKILLS_DIR", str(PROJECT_DIR / "skills"))).resolve()
SAMPLE_DATA_DIR = Path(os.getenv("SAMPLE_DATA_DIR", str(PROJECT_DIR / "sample_data"))).resolve()
STATIC_DIR = Path(os.getenv("STATIC_DIR", str(PROJECT_DIR / "frontend" / "dist"))).resolve()

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# Hermes / LLM Configuration
HERMES_API_KEY = os.getenv("HERMES_API_KEY", os.getenv("OPENROUTER_API_KEY", os.getenv("OPENAI_API_KEY", "")))
HERMES_API_BASE = os.getenv("HERMES_API_BASE", "https://openrouter.ai/api/v1")
HERMES_MODEL = os.getenv("HERMES_MODEL", "nousresearch/hermes-3-llama-3.1-70b")
