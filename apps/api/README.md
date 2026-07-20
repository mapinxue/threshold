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

## Application modules

The initial API surface is available under `/api/v1`:

- `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout`
- `/dashboard`
- `/data-sources`
- `/api-keys`
- `/admin/users`
- `/admin/permissions`
- `/skills` and `/skills/generate`

Bearer sessions and API key secrets are stored as hashes. This first pass is
intended to prove the product flow; production-grade session policies, secret
providers, fine-grained authorization, and external database execution remain
future work.
