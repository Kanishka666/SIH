def test_upload_image_creates_scan(client, auth_headers, sample_image_bytes):
    resp = client.post(
        "/api/scans",
        headers=auth_headers,
        files={"file": ("label.png", sample_image_bytes, "image/png")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["scan_id"].startswith("scan_")
    assert data["status"] in ("processing", "completed")


def test_upload_rejects_bad_file_type(client, auth_headers):
    import io

    bad_file = io.BytesIO(b"not an image")
    resp = client.post(
        "/api/scans",
        headers=auth_headers,
        files={"file": ("notes.txt", bad_file, "text/plain")},
    )
    assert resp.status_code == 400


def test_get_scan_status(client, auth_headers, sample_image_bytes):
    upload = client.post(
        "/api/scans",
        headers=auth_headers,
        files={"file": ("label.png", sample_image_bytes, "image/png")},
    )
    scan_id = upload.json()["scan_id"]

    resp = client.get(f"/api/scans/{scan_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["scan_id"] == scan_id
    assert data["status"] == "completed"
    assert "compliance_score" in data


def test_get_scan_not_found(client, auth_headers):
    resp = client.get("/api/scans/scan_does_not_exist", headers=auth_headers)
    assert resp.status_code == 404


def test_get_report(client, auth_headers, sample_image_bytes):
    upload = client.post(
        "/api/scans",
        headers=auth_headers,
        files={"file": ("label.png", sample_image_bytes, "image/png")},
    )
    scan_id = upload.json()["scan_id"]

    resp = client.get(f"/api/scans/{scan_id}/report", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["scan_id"] == scan_id
    assert "compliance_score" in data
    assert "violations" in data


def test_get_report_pdf(client, auth_headers, sample_image_bytes):
    upload = client.post(
        "/api/scans",
        headers=auth_headers,
        files={"file": ("label.png", sample_image_bytes, "image/png")},
    )
    scan_id = upload.json()["scan_id"]

    resp = client.get(f"/api/scans/{scan_id}/report/pdf", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:4] == b"%PDF"


def test_report_not_found_for_unknown_scan(client, auth_headers):
    resp = client.get("/api/scans/scan_unknown/report", headers=auth_headers)
    assert resp.status_code == 404
