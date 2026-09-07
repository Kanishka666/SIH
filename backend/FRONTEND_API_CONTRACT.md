# LabelLens — Frontend API Contract

This document is written for the **frontend developer** working on the React + Vite + Tailwind app. It describes every backend endpoint currently available, exactly as implemented in this first backend iteration.

**Base URL (local dev):** `http://localhost:8000`
**Interactive docs:** `http://localhost:8000/docs` (Swagger) and `http://localhost:8000/redoc`

**Auth scheme:** JWT Bearer token. After login/register, store `access_token` and send it as:
```
Authorization: Bearer <access_token>
```

All error responses share this shape:
```json
{ "error": true, "detail": "human readable message" }
```

---

## 1. POST /api/auth/register

- **Method:** POST
- **Auth required:** No
- **Request format:** `application/json`

**Request example:**
```json
{
  "name": "Aditi Sharma",
  "email": "aditi@example.com",
  "password": "strongpassword123",
  "role": "inspector"
}
```
`role` must be one of: `"inspector"`, `"manufacturer"`, `"admin"`.

**Response format (201 Created):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "user_1",
    "name": "Aditi Sharma",
    "email": "aditi@example.com",
    "role": "inspector"
  }
}
```

**Possible errors:**
- `400` — Email already registered
- `422` — Validation error (missing/invalid fields)

**Axios example:**
```javascript
const res = await axios.post("/api/auth/register", {
  name: "Aditi Sharma",
  email: "aditi@example.com",
  password: "strongpassword123",
  role: "inspector",
});
localStorage.setItem("access_token", res.data.access_token);
```

---

## 2. POST /api/auth/login

- **Method:** POST
- **Auth required:** No
- **Request format:** `application/json`

**Request example:**
```json
{
  "email": "aditi@example.com",
  "password": "strongpassword123"
}
```

**Response format (200 OK):** same shape as register.

**Possible errors:**
- `401` — Invalid email or password
- `422` — Validation error

**Axios example:**
```javascript
const res = await axios.post("/api/auth/login", { email, password });
localStorage.setItem("access_token", res.data.access_token);
```

---

## 3. POST /api/scans

- **Method:** POST
- **Auth required:** Yes (Bearer token)
- **Request format:** `multipart/form-data`, field name **`file`**
- **Accepted types:** PNG, JPG, JPEG, WEBP
- **Max size:** 10 MB (configurable via `MAX_UPLOAD_SIZE_MB`)

**Request example (form-data):**
```
file: <binary image data>
```

**Response format (201 Created):**
```json
{
  "scan_id": "scan_1",
  "status": "processing",
  "message": "Image uploaded successfully"
}
```
> Note: in this mock backend, processing actually completes synchronously, so a follow-up `GET /api/scans/{id}` immediately after upload will already show `"status": "completed"`. The response shape is intentionally kept as `"processing"` here so the frontend's existing polling/loading UI keeps working once a real async pipeline is introduced later.

**Possible errors:**
- `400` — Unsupported file type / image too large / empty file
- `401` — Not authenticated
- `422` — Missing `file` field

**Axios example:**
```javascript
const formData = new FormData();
formData.append("file", selectedFile); // selectedFile is a File/Blob

const res = await axios.post("/api/scans", formData, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "multipart/form-data",
  },
});
const scanId = res.data.scan_id;
```

---

## 4. GET /api/scans/{id}

- **Method:** GET
- **Auth required:** Yes

**Response format (200 OK) — while processing:**
```json
{
  "scan_id": "scan_1",
  "status": "processing",
  "progress": 10
}
```

**Response format (200 OK) — once completed:**
```json
{
  "scan_id": "scan_1",
  "status": "completed",
  "progress": 100,
  "compliance_score": 82,
  "overall_status": "NON_COMPLIANT",
  "extracted_information": {
    "product_name": "Example Packaged Product",
    "mrp": "₹40",
    "manufacturer": "ABC Foods Pvt Ltd",
    "net_quantity": "200 g",
    "expiry_date": "August 2027",
    "consumer_care": "1800-123-4567"
  },
  "violations": [
    {
      "id": "v1",
      "title": "Missing Declaration",
      "rule_number": "RULE-001",
      "reason": "MRP is not clearly visible or declared on the package image.",
      "severity": "high",
      "recommendation": "Ensure MRP (inclusive of all taxes) is printed clearly."
    }
  ],
  "recommendations": [
    "Verify all mandatory declarations against the latest checklist.",
    "Ensure MRP is clearly visible and legible."
  ]
}
```

**Possible errors:**
- `401` — Not authenticated
- `404` — Scan not found

**Axios example:**
```javascript
const res = await axios.get(`/api/scans/${scanId}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

---

## 5. GET /api/scans/{id}/report

- **Method:** GET
- **Auth required:** Yes

**Response format (200 OK):**
```json
{
  "scan_id": "scan_1",
  "product_name": "Example Packaged Product",
  "product_category": "Uncategorized",
  "scan_date": "2026-09-01T10:15:00+00:00",
  "compliance_score": 82,
  "overall_status": "NON_COMPLIANT",
  "violations": [ /* same shape as above */ ],
  "notes": "This report is generated from MOCK AI/ML processing for MVP demonstration purposes..."
}
```

**Possible errors:**
- `401` — Not authenticated
- `404` — Scan not found, or report not ready yet

**Axios example:**
```javascript
const res = await axios.get(`/api/scans/${scanId}/report`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

---

## 6. GET /api/scans/{id}/report/pdf

- **Method:** GET
- **Auth required:** Yes
- **Response format:** binary `application/pdf` (not JSON)

**Possible errors:**
- `401` — Not authenticated
- `404` — Scan not found, or report not ready yet

**Axios example (trigger browser download):**
```javascript
const res = await axios.get(`/api/scans/${scanId}/report/pdf`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  responseType: "blob",
});
const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
const link = document.createElement("a");
link.href = url;
link.setAttribute("download", `labellens_report_${scanId}.pdf`);
document.body.appendChild(link);
link.click();
link.remove();
```
This same request/response can also power a "Print Report" button by opening the blob URL in a new tab and calling `window.print()`.

---

## 7. GET /api/products

- **Method:** GET
- **Auth required:** Yes

**Response format (200 OK):**
```json
[
  {
    "id": "prod_1",
    "name": "Demo Packaged Atta 1kg",
    "category": "Food & Grocery",
    "manufacturer": "ABC Foods Pvt Ltd",
    "net_quantity": "1 kg",
    "mrp": "₹55",
    "created_at": "2026-09-01T10:00:00+00:00"
  }
]
```

**Possible errors:**
- `401` — Not authenticated

**Axios example:**
```javascript
const res = await axios.get("/api/products", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

---

## 8. POST /api/products

- **Method:** POST
- **Auth required:** Yes
- **Request format:** `application/json`

**Request example:**
```json
{
  "name": "Packaged Atta 1kg",
  "category": "Food & Grocery",
  "manufacturer": "ABC Foods Pvt Ltd",
  "net_quantity": "1 kg",
  "mrp": "₹55"
}
```

**Response format (201 Created):** same shape as a single product from the GET list above.

**Possible errors:**
- `401` — Not authenticated
- `422` — Validation error

**Axios example:**
```javascript
const res = await axios.post("/api/products", productData, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

---

## 9. GET /api/cases

- **Method:** GET
- **Auth required:** Yes

**Response format (200 OK):**
```json
[
  {
    "id": "case_1",
    "scan_id": null,
    "title": "Demo case — MRP not declared",
    "status": "open",
    "assigned_to": "inspector_demo",
    "notes": "Auto-seeded demo case for MVP testing.",
    "created_at": "2026-09-01T10:00:00+00:00"
  }
]
```

**Possible errors:**
- `401` — Not authenticated

**Axios example:**
```javascript
const res = await axios.get("/api/cases", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

---

## 10. POST /api/cases

- **Method:** POST
- **Auth required:** Yes
- **Request format:** `application/json`

**Request example:**
```json
{
  "scan_id": "scan_1",
  "title": "MRP not declared on package",
  "status": "open",
  "assigned_to": "inspector_1",
  "notes": "Follow up with manufacturer"
}
```
`scan_id`, `assigned_to`, and `notes` are optional.

**Response format (201 Created):** same shape as a single case from the GET list above.

**Possible errors:**
- `401` — Not authenticated
- `422` — Validation error

**Axios example:**
```javascript
const res = await axios.post("/api/cases", caseData, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

---

## 11. GET /api/rules

- **Method:** GET
- **Auth required:** No (static reference data)

**Response format (200 OK):**
```json
[
  {
    "id": "RULE-001",
    "title": "MRP Declaration",
    "description": "The Maximum Retail Price (inclusive of all taxes) should be declared clearly on the package.",
    "severity": "high"
  }
]
```

> ⚠️ These are **placeholder/demo rules only** for MVP wiring. They do **not** represent the complete, verified Legal Metrology (Packaged Commodities) Rules. Don't present this list to users as an authoritative legal reference — the real rule set will be added later.

**Axios example:**
```javascript
const res = await axios.get("/api/rules");
```

---

## Suggested Axios instance setup

```javascript
// api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
```

## What's mocked right now (so the UI can show accurate expectations)

- Image is saved to disk, but "processing" is instant and uses fixed/randomized demo values — it does not actually read the image contents.
- All data (users, scans, products, cases) resets whenever the backend restarts, since nothing is in a real database yet.
- The rules list is a small demo set, not the full legal rule book.
