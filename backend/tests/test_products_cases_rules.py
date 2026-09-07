def test_list_products(client, auth_headers):
    resp = client.get("/api/products", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_product(client, auth_headers):
    resp = client.post(
        "/api/products",
        headers=auth_headers,
        json={
            "name": "Test Biscuit Pack",
            "category": "Food & Grocery",
            "manufacturer": "Test Foods Ltd",
            "net_quantity": "150 g",
            "mrp": "₹30",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Biscuit Pack"
    assert data["id"].startswith("prod_")


def test_list_cases(client, auth_headers):
    resp = client.get("/api/cases", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_case(client, auth_headers):
    resp = client.post(
        "/api/cases",
        headers=auth_headers,
        json={
            "scan_id": "scan_1",
            "title": "Test compliance case",
            "status": "open",
            "assigned_to": "inspector_1",
            "notes": "Needs manufacturer follow-up",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test compliance case"
    assert data["id"].startswith("case_")


def test_list_rules_public(client):
    # Rules endpoint is intentionally unauthenticated (static reference data)
    resp = client.get("/api/rules")
    assert resp.status_code == 200
    rules = resp.json()
    assert isinstance(rules, list)
    assert len(rules) > 0
    assert "id" in rules[0]
    assert "severity" in rules[0]
