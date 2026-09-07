# LabelLens — Backend (SIH26034)

**LabelLens – AI-Powered Legal Metrology Compliance Scanner**
Backend/API integration layer — Smart India Hackathon 2026, Problem Statement SIH26034.

## 1. Project Purpose

LabelLens lets an inspector or manufacturer upload a photo of a packaged product's label, then:

1. extracts label information (product name, MRP, net quantity, manufacturer, expiry, consumer care),
2. checks it against Legal Metrology (Packaged Commodities) compliance rules,
3. flags violations, and
4. produces a downloadable compliance report (JSON + PDF).

**This repository is the FIRST backend iteration.** It exists to give the React frontend a stable, working REST contract to build against. The real database and the real OCR/AI/ML pipeline are **not** wired in yet — they're mocked, by design, so both sides of the team can work in parallel.

```
React Frontend  <---REST/JSON--->  FastAPI Backend  <-- (mock) -->  In-memory store + Mock AI service
```

## 2. Architecture

Every feature follows the same layering, so swapping mocks for real implementations later touches as few files as possible:

```
Route (app/api/routes/*.py)
   │   — HTTP concerns only: parses request, calls a service, returns response
   ▼
Service (app/services/*.py)
   │   — business logic, validation, orchestration
   ▼
Storage / Mock AI (app/storage/memory_store.py, app/services/mock_ai_service.py)
    — currently in-memory dicts + fabricated AI results
```

Concretely, for image upload:

```
POST /api/scans
   → app/api/routes/scans.py
       → app/services/scan_service.py
           → app/services/mock_ai_service.py   (→ real OCR/ML later)
           → app/storage/memory_store.py       (→ PostgreSQL/MongoDB later)
```

## 3. Folder Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI app, CORS, error handlers, routers
│   ├── core/
│   │   ├── config.py                # Settings (env-driven)
│   │   └── security.py              # Password hashing, JWT, current-user dependency
│   ├── api/routes/
│   │   ├── auth.py                  # /api/auth/*
│   │   ├── scans.py                 # /api/scans (POST, GET)
│   │   ├── reports.py               # /api/scans/{id}/report[/pdf]
│   │   ├── products.py              # /api/products
│   │   ├── cases.py                 # /api/cases
│   │   └── rules.py                 # /api/rules
│   ├── schemas/                     # Pydantic request/response models
│   │   ├── auth.py, scan.py, report.py, product.py, case.py, rule.py
│   ├── services/                    # Business logic
│   │   ├── auth_service.py
│   │   ├── scan_service.py
│   │   ├── report_service.py        # includes PDF generation (reportlab)
│   │   └── mock_ai_service.py       # <-- replace with real OCR/ML later
│   └── storage/
│       └── memory_store.py          # <-- replace with real DB later
├── uploads/                          # uploaded images land here (gitignored contents)
├── tests/                            # pytest suite
├── requirements.txt
├── .env.example
├── FRONTEND_API_CONTRACT.md          # endpoint-by-endpoint docs for the frontend dev
└── README.md
```

## 4. Python Version

Python **3.11+** recommended (developed/tested on 3.12).

## 5–7. Installation, Virtual Environment, Dependencies

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## 8. Environment Variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Purpose | Default |
|---|---|---|
| `APP_NAME` | Display name in `/docs` | `LabelLens API` |
| `JWT_SECRET_KEY` | Secret used to sign JWTs — **change in any real deployment** | dev placeholder |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` (24h) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `UPLOAD_DIR` | Where uploaded images are saved | `uploads` |
| `MAX_UPLOAD_SIZE_MB` | Max accepted image size | `10` |

If no `.env` file is present, the app falls back to the defaults above, so it will still run out of the box.

## 9. Running FastAPI

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## 10. Swagger / ReDoc Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

You can log in via `/api/auth/login` or `/api/auth/register` directly from Swagger, click **Authorize**, and paste the returned `access_token` to test protected endpoints interactively.

## 11. Testing

```bash
pytest -v
```

Covers: registration, login, protected-endpoint access, image upload (valid + invalid file type), get scan, get report (JSON), get report PDF, products, cases, and rules. All tests run against an in-memory app instance via `TestClient` — no external services required.

## 12. React Integration

- Configure CORS via `CORS_ORIGINS` in `.env` to include your Vite dev server origin (default `http://localhost:5173`).
- See **`FRONTEND_API_CONTRACT.md`** for a full endpoint-by-endpoint reference with exact request/response JSON and Axios code samples — written specifically for the frontend developer on this team.
- All protected endpoints expect `Authorization: Bearer <access_token>`.

## 13. Current Mock Components

| Component | Current behavior | File |
|---|---|---|
| Database | Plain Python dicts in process memory; resets on restart | `app/storage/memory_store.py` |
| OCR/AI/ML | Returns fixed/randomized demo extraction + violations, does not actually analyze the image | `app/services/mock_ai_service.py` |
| Compliance rules | Small hardcoded demo rule set (NOT the full legal rule book) | `app/services/mock_ai_service.py` (`DEMO_RULES`) |
| Scan processing | Runs synchronously and completes instantly (no real async pipeline yet) | `app/services/scan_service.py` |

Uploaded images ARE saved to disk (`uploads/`) for real, and are validated for type/size — only the *analysis* of their contents is mocked.

## 14. How PostgreSQL/MongoDB Will Be Integrated Later

All persistence currently goes through the functions in `app/storage/memory_store.py` (`create_user`, `get_user_by_email`, `create_scan`, `get_scan`, `update_scan`, `create_product`, `list_products`, `create_case`, `list_cases`, `seed_rules`, `list_rules`, etc.).

To add a real database:

1. Add a new module, e.g. `app/storage/db_store.py`, implementing the **same function names and signatures**, backed by SQLAlchemy (PostgreSQL) or Motor/PyMongo (MongoDB).
2. Update the `from app.storage import memory_store` imports in the service files (`auth_service.py`, `scan_service.py`, `report_service.py`, and the `products`/`cases`/`rules` routes) to point at the new module — or introduce a small factory that picks the store based on an env var (e.g. `DATABASE_URL` being set).
3. No changes should be required in `app/api/routes/*.py` or in the Pydantic schemas, since they only depend on the dict shapes returned by the storage layer, not on how those dicts are produced.
4. Add real migrations (e.g. Alembic for PostgreSQL) and connection pooling/config in `app/core/config.py` (a `DATABASE_URL` placeholder is already present there, commented out).

## 15. How the Real AI/ML Service Will Be Integrated Later

All label analysis currently goes through `app/services/mock_ai_service.py`'s `process_label(image_path: str) -> dict` function, called from `app/services/scan_service.py`.

To add the real OCR/ML pipeline:

1. Keep the function signature `process_label(image_path: str) -> dict` (or an async equivalent) and the same return shape: `compliance_score`, `overall_status`, `extracted_information`, `violations`, `recommendations`.
2. Replace the body with either:
   - a call to an internal OCR/ML microservice (e.g. via `httpx`, using the `AI_SERVICE_URL` placeholder already present in `app/core/config.py`), or
   - direct in-process model inference.
3. If processing becomes slow/asynchronous, update `scan_service.create_scan_from_upload` to kick off a background job (e.g. FastAPI `BackgroundTasks`, or a task queue) instead of calling `process_label` inline, and have it update the scan's `status`/`progress` as it goes. The response shape of `POST /api/scans` and `GET /api/scans/{id}` was designed to already support a `"processing"` → `"completed"` transition, so the frontend doesn't need to change.
4. Replace `DEMO_RULES` in `mock_ai_service.py` with the verified, complete Legal Metrology (Packaged Commodities) Rules dataset once available.

## API Endpoint Summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user, returns JWT |
| POST | `/api/auth/login` | No | Log in, returns JWT |
| GET | `/api/auth/me` | Yes | Get current logged-in user |
| POST | `/api/scans` | Yes | Upload a label image, create a scan |
| GET | `/api/scans/{id}` | Yes | Get scan status / mock result |
| GET | `/api/scans/{id}/report` | Yes | Get structured report JSON |
| GET | `/api/scans/{id}/report/pdf` | Yes | Download report as PDF |
| GET | `/api/products` | Yes | List products |
| POST | `/api/products` | Yes | Create a product |
| GET | `/api/cases` | Yes | List compliance cases |
| POST | `/api/cases` | Yes | Create a compliance case |
| GET | `/api/rules` | No | List demo compliance rules |

Full request/response examples: see **FRONTEND_API_CONTRACT.md**.
