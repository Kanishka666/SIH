# LabelLens OCR Service

This folder contains the supplied OCR service and its test images.

Create the OCR virtual environment and install its dependencies from this directory:

```bash
python -m venv venv
source venv/bin/activate        # Windows Git Bash: source venv/Scripts/activate
pip install -r requirements.txt
```

On Windows PowerShell, activate with `venv\\Scripts\\Activate.ps1`; in Command Prompt use `venv\\Scripts\\activate.bat`.

Run it from this directory:

```powershell
python -m uvicorn api:app --host 127.0.0.1 --port 8001
```

The LabelLens backend remains on port `8000` and connects to this service with:

```env
OCR_API_URL=http://127.0.0.1:8001
```

The OCR endpoint is `POST /scan` and expects a multipart file field named `file`.
