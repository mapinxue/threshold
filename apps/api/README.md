# Threshold API

FastAPI application for Threshold's control plane and governed query execution path.

The control-plane database uses PostgreSQL through SQLAlchemy 2 and Psycopg 3.
Alembic owns schema migrations. From the repository root, initialize the local
database with:

```bash
pnpm db:init
```

Run locally with:

```bash
uv sync --all-groups
uv run uvicorn app.main:app --reload
```

The liveness endpoint at `/api/v1/health` does not require PostgreSQL. The
readiness endpoint at `/api/v1/health/ready` returns `503` until the database is
reachable.
