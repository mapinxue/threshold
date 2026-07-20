.PHONY: db-up db-down db-logs db-shell db-migrate db-current db-revision db-init

db-up:
	docker compose up -d --wait postgres

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

db-shell:
	docker compose exec postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

db-migrate:
	cd apps/api && uv run alembic upgrade head

db-current:
	cd apps/api && uv run alembic current

db-revision:
	@test -n "$(m)" || (echo 'Usage: make db-revision m="migration message"' && exit 1)
	cd apps/api && uv run alembic revision --autogenerate -m "$(m)"

db-init: db-up db-migrate
