from __future__ import annotations

from fastapi.testclient import TestClient

from api.main import app


def test_service_token_protects_analysis_routes(monkeypatch):
    monkeypatch.setenv("VC_BRAIN_SERVICE_TOKEN", "test-service-secret")
    client = TestClient(app)

    assert client.get("/health").status_code == 200
    assert client.get("/founders").status_code == 401
    assert client.get("/founders", headers={"x-vc-brain-service-token": "wrong"}).status_code == 401
    assert client.get("/founders", headers={"x-vc-brain-service-token": "test-service-secret"}).status_code == 200


def test_service_token_is_optional_for_local_development(monkeypatch):
    monkeypatch.delenv("VC_BRAIN_SERVICE_TOKEN", raising=False)
    client = TestClient(app)
    assert client.get("/founders").status_code == 200
