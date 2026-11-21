# Autonomous Manufacturing Digital Employees

This repository contains production-ready digital employees for precision manufacturing operations.

## Projects

### 1. [Supplier & PO Chaser (`po-chaser-proto/`)](./po-chaser-proto/)
An autonomous digital employee backed by **Hermes Agent** and an **Obsidian-style Markdown knowledge vault**:
- Continuous reconciliation of Open Purchase Orders (POs) with inbound vendor communications.
- Strict **Draft-First** safety guardrails: zero automatic external dispatch; human-in-the-loop review.
- Dynamic dock-date countdown and risk classification (`HIGH`, `MEDIUM`, `ON_TRACK`).
- Proposed Markdown memory patches for vendor lead-time drift history and recurring equipment failures.
- Production container setup (`Dockerfile`, `docker-compose.yml`) compatible with Coolify deployment on Ubuntu VPS.

See [po-chaser-proto/README.md](./po-chaser-proto/README.md) for full documentation, local development setup, and API specifications.
