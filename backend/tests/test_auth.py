def test_register_new_user(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Test Inspector",
            "email": "inspector1@example.com",
            "password": "password123",
            "role": "inspector",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "inspector1@example.com"
    assert data["user"]["role"] == "inspector"


def test_register_duplicate_email_fails(client):
    payload = {
        "name": "Dup User",
        "email": "dup@example.com",
        "password": "password123",
        "role": "manufacturer",
    }
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 400
    assert second.json()["error"] is True


def test_login_success(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Login User",
            "email": "loginuser@example.com",
            "password": "password123",
            "role": "admin",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "loginuser@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_protected_endpoint_requires_token(client):
    resp = client.get("/api/products")
    assert resp.status_code == 401


def test_protected_endpoint_with_token(client, auth_headers):
    resp = client.get("/api/products", headers=auth_headers)
    assert resp.status_code == 200
