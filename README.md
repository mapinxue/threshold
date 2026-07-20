# Threshold

Threshold is a governed database gateway for AI agents. It sits between agents and data sources to enforce authorization, SQL safety, masking, execution limits, and auditing.

## Stack

- Web: Next.js, React, TypeScript, Tailwind CSS
- UI: shadcn/ui with Radix primitives and the Nova preset
- Internationalization: next-intl with Chinese and English locale routes
- API: FastAPI, Pydantic, Python managed by uv
- SQL policy foundation: SQLGlot
- Frontend quality: TypeScript, ESLint, Prettier
- Backend quality: Pyright, Ruff, pytest

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- uv 0.11 or newer

uv installs the Python version declared in `apps/api/.python-version` when it is not already available. Python dependencies are resolved from the Tsinghua University PyPI mirror configured in `apps/api/pyproject.toml`.

## Setup

```bash
pnpm install
pnpm setup:api
```

Copy the local environment template if you need to override defaults:

```bash
cp apps/api/.env.example apps/api/.env
```

## Development

Run the frontend and backend together:

```bash
pnpm dev
```

The services are available at:

- Web: http://localhost:3000 (redirects to the negotiated locale)
- Chinese landing page: http://localhost:3000/zh-CN
- Chinese console: http://localhost:3000/zh-CN/console
- English console: http://localhost:3000/en/console
- API: http://localhost:8000
- OpenAPI: http://localhost:8000/docs

They can also be run independently:

```bash
pnpm dev:web
pnpm dev:api
```

## Quality commands

Run every static check and test:

```bash
pnpm check
```

Or run checks independently:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Apply automatic formatting and safe lint fixes:

```bash
pnpm format
pnpm lint:fix
```

Backend-only commands can be invoked directly with uv:

```bash
cd apps/api
uv run pyright
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

Add another shadcn component from the web application directory:

```bash
cd apps/web
pnpm dlx shadcn@latest add <component>
```

The shared component source lives in `apps/web/src/components/ui`. Forms use the current shadcn `Field` composition with React Hook Form and Zod; data tables use TanStack Table with the shared table primitives. Theme selection is provided by `next-themes`, while locale routing and message loading are handled by `next-intl`.

## Repository layout

```text
apps/
  web/          Next.js management console
  api/          FastAPI control and query gateway
    app/
      api/      HTTP routes
      core/     configuration and cross-cutting concerns
      domain/   domain models and policy concepts
      services/ orchestration and application services
```

The first implementation is a modular monolith. Control-plane and query-execution boundaries remain explicit so the execution path can later be isolated without changing the public API.
