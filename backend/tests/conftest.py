import io
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure "app" package is importable when running `pytest` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    # Using a context manager ensures FastAPI startup events (which seed
    # demo rules/products) actually run before the tests use the client.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth_headers(client):
    """Registers a fresh user and returns Authorization headers."""
    email = "pytest_user@example.com"
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Pytest User",
            "email": email,
            "password": "testpassword123",
            "role": "inspector",
        },
    )
    if resp.status_code == 400:
        # Already registered in a previous test in this session — log in instead.
        resp = client.post(
            "/api/auth/login", json={"email": email, "password": "testpassword123"}
        )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_image_bytes():
    """A minimal valid 1x1 PNG image, generated in-memory (no file needed)."""
    png_bytes = bytes.fromhex(
        "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753"
        "de0000000c4944415478da6360606060000000050001a5f645400000000049454e44ae426082"
    )
    return io.BytesIO(png_bytes)
