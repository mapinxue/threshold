from fastapi.testclient import TestClient

from app.db.session import database_is_ready
from app.main import app


def test_health_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload: dict[str, object] = response.json()
    assert payload == {
        "status": "ok",
        "service": "Threshold API",
        "version": "0.1.0",
    }


def test_local_web_origin_is_allowed() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


async def database_ready() -> bool:
    return True


async def database_unavailable() -> bool:
    return False


def test_readiness_endpoint_when_database_is_ready() -> None:
    app.dependency_overrides[database_is_ready] = database_ready

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/health/ready")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "up"}


def test_readiness_endpoint_when_database_is_unavailable() -> None:
    app.dependency_overrides[database_is_ready] = database_unavailable

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/health/ready")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "database": "down"}
