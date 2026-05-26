# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered corporate helpdesk and ticketing system. Employees submit issues via an AI chat interface; the AI classifies them by department and priority, then routes them to the appropriate support queue.

## Architecture

Two separate services with no shared runtime:

**Backend** (`backend/`) — FastAPI + SQLAlchemy ORM + PostgreSQL
- `main.py` — app factory, CORS middleware, router registration
- `database.py` — SQLAlchemy engine and `get_db()` dependency (reads `DATABASE_URL` from `.env`)
- `model.py` — all ORM models (`Department`, `User`, `Ticket`, `TicketAssignment`, `ChatSession`, `TicketMessage`, `TicketAttachment`, `LogTable`)
- `routes/tickets.py` — implemented ticket CRUD and status endpoints
- `routes/auth.py`, `routes/reports.py` — stubs (empty)

**Frontend** (`frontend/`) — plain HTML/CSS/JS (no build step)
- `index.html` and `pages/` — mostly empty stubs awaiting implementation

**AI/ML layer** (`model/`) — stubs awaiting implementation
- `groq_client.py` — Groq LLM integration (stub)
- `prompts.py` — prompt templates (stub)
- `rag/chromadb_client.py` — ChromaDB RAG client (stub)

**Database** (`database/schema.sql`) — PostgreSQL 14+ schema with 8 tables, 2 views (`v_priority_queue`, `v_sla_stats`), and seed data for 4 departments (IT & Hardware Support, DevOps & Software, Financial Operations, HR & Admin).

There is also a stale `.next/` directory in the root from an earlier Next.js experiment; the active frontend is the plain HTML in `frontend/`.

## Running the Backend

```bash
cd backend
uvicorn main:app --reload
```

Requires a `.env` file at the project root (or `backend/`) with:
```
DATABASE_URL=postgresql://user:password@host/dbname
```

Interactive API docs available at `http://localhost:8000/docs`.

## Database Setup

Apply the schema against a running PostgreSQL instance:
```bash
psql $DATABASE_URL -f database/schema.sql
```

The schema is idempotent (`DROP … IF EXISTS CASCADE` at the top), safe to re-run during development.

## Key Design Decisions

- **Priority queue ordering**: tickets are sorted by `priority DESC, created_at ASC` (AI urgency score 1–10, not FIFO). The `v_priority_queue` view is the intended read source for the agent Kanban panel.
- **`log_table`** captures audit events and AI-enriched context (IP, user-agent, source) as JSONB; it is written on every ticket INSERT and status UPDATE.
- **`parent_ticket_id`** on `tickets` supports merging duplicate reports during mass outages ("Clone Ticket Catcher").
- **`TicketAssignment.is_primary`** has a partial unique index ensuring only one primary assignee per ticket.
- AI classification (department routing + priority scoring) is currently mocked in `routes/tickets.py` (`ai_department_id = 2`, `ai_priority = 1`) — the real logic belongs in `model/groq_client.py`.

## Dependencies

Python packages are in `requirements.txt` (FastAPI, SQLAlchemy, psycopg2-binary, pydantic, uvicorn, python-dotenv, pandas, matplotlib). No `pyproject.toml` or virtual-env tooling is committed; set one up locally (`python -m venv .venv && pip install -r requirements.txt`).

The `node_modules/` and `package-lock.json` in the root are leftovers from the Next.js prototype and are not used by the active codebase.
