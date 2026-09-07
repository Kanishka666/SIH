# LabelLens

LabelLens is an SIH packaged-commodity label inspection project with a React frontend and FastAPI backend.

```text
React frontend → FastAPI backend → OCR integration point → Compliance pipeline
                                      ↓
                                Future Supabase database
```

The backend is the source of truth for authentication, authorization, scan access, compliance evaluation, and reports.

## Project Structure

```text
SIH/
├── backend/       FastAPI API
└── frontend/      React + Vite application
```

`frontend-old/`, if present in a local checkout, is not part of the active application.

## Requirements

- Python 3.11 or newer
- Node.js and npm
- PowerShell on Windows

## Backend Setup

```powershell
cd backend
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

Documentation:

- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

If PowerShell blocks activation, run this for the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`.

Frontend environment:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Never place Supabase secret or service-role credentials in the frontend or any `VITE_*` variable.

## Authentication

The current backend uses JWT authentication:

1. Register with `POST /api/auth/register`.
2. Log in with `POST /api/auth/login`.
3. Store the returned access token for this development setup.
4. Send protected requests with:

```http
Authorization: Bearer <access_token>
```

Protected access is enforced by FastAPI. Scan and compliance operations are restricted to inspector/admin roles, and scans/reports are restricted to their owner.

## API Endpoints

```text
GET  /
GET  /health

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

POST /api/scans
GET  /api/scans
GET  /api/scans/{scan_id}
GET  /api/scans/{scan_id}/report
GET  /api/scans/{scan_id}/report/pdf

POST /api/compliance/evaluate

GET  /api/products
POST /api/products
GET  /api/cases
POST /api/cases
GET  /api/rules
```

## Compliance Pipeline

The supplied compliance implementation is stored in `backend/app/compliance/`:

- `checker.py`
- `rules.py`
- `report.py`
- `test_data.txt`
- `output.json`

The pipeline is:

```text
OCR text → structure_data() → check_compliance() → summarize() → report
```

Test it directly without an OCR service:

```powershell
cd backend
py -3 -c "from app.services.compliance_service import evaluate_ocr_text; from pathlib import Path; text=Path('app/compliance/test_data.txt').read_text(encoding='utf-8').split('---')[0].strip(); result=evaluate_ocr_text(text); print(result['overall_status']); print(result['pending_module_checks'])"
```

Or call the protected endpoint after logging in:

```http
POST /api/compliance/evaluate
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "ocr_text": "MRP Rs 1150 incl all taxes\nNet Wt 100 GM\nPacked Aug 2026\nMfg by Fresh Foods Pvt Ltd\nCustomer care 18001234567\nFresh Namkeen"
}
```

The response includes structured data, rule results, overall status, pending checks, and the generated text report.

## Current Limitations

- Supabase PostgreSQL is not connected yet; current persistence uses in-memory storage.
- The real OCR API is not available yet.
- Image scans return an OCR-not-configured response until the OCR adapter and teammate API contract are provided.
- Compliance can currently be tested directly with OCR text through the supplied pipeline.
- In-memory users, scans, products, and cases reset when the backend restarts.
- Supabase table schema, RLS policies, and storage buckets must be integrated before production deployment.

## Security

- Do not commit `.env` files.
- Do not place Supabase secret/service-role keys in React.
- Do not place secret keys in `VITE_*` variables.
- Use backend environment variables for private credentials.
- Change the development JWT secret before any real deployment.

## Validation

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

Backend compliance check:

```powershell
cd backend
py -3 -m py_compile app\compliance\checker.py app\compliance\rules.py app\compliance\report.py
```
