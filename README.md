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
- Node.js 18 or newer and npm
- Git
- Windows users can use Git Bash, PowerShell, or Command Prompt. macOS/Linux users can use any POSIX shell.

## Setup

Clone the repository and enter it:

```bash
git clone https://github.com/Kanishka666/SIH.git
cd SIH
```

The project has three local processes:

```text
OCR service   http://127.0.0.1:8001
Backend API   http://127.0.0.1:8000
Frontend      http://localhost:5173
```

### OCR Service

The OCR service uses PaddleOCR. Its Python environment is separate from the backend environment.

Git Bash, macOS, or Linux:

```bash
cd backend/ocr
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api:app --host 127.0.0.1 --port 8001
```

Windows PowerShell:

```powershell
cd backend\ocr
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn api:app --host 127.0.0.1 --port 8001
```

Windows Command Prompt:

```bat
cd backend\ocr
py -3 -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
python -m uvicorn api:app --host 127.0.0.1 --port 8001
```

Keep this terminal running. The first OCR run may download or initialize PaddleOCR models.

### Backend API

Open a second terminal at the repository root.

Git Bash, macOS, or Linux:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Windows PowerShell:

```powershell
cd backend
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Windows Command Prompt:

```bat
cd backend
py -3 -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend reads `OCR_API_URL=http://127.0.0.1:8001` from `.env` and calls the OCR service for image scans.

### Frontend

Open a third terminal at the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and uses `http://127.0.0.1:8000` by default. To override it, create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For PowerShell use `New-Item frontend\.env` and edit the file; for Command Prompt use `type nul > frontend\.env` and edit the file.

Documentation:

- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

If PowerShell blocks activation, run this for the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Never place Supabase secret or service-role credentials in the frontend or any `VITE_*` variable. Keep real credentials only in a local, untracked backend `.env` file.

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
- OCR runs as a separate local PaddleOCR service and depends on image quality.
- Image-dependent compliance checks remain `UNABLE_TO_VERIFY` until a computer-vision module is connected.
- In-memory users, scans, products, and cases reset when the backend restarts.
- The compliance rules are an implementation subset and should be legally reviewed before production use.

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
