import httpx
from fastapi import HTTPException, status

from app.core.config import settings


def scan_image(file_path: str, filename: str, content_type: str) -> dict:
    if not settings.OCR_API_URL:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="OCR service is not configured. Set OCR_API_URL in backend/.env.")
    try:
        with open(file_path, "rb") as image_file:
            response = httpx.post(
                f"{settings.OCR_API_URL.rstrip('/')}/scan",
                files={"file": (filename, image_file, content_type)},
                timeout=600.0,
            )
    except (OSError, httpx.RequestError) as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Could not connect to OCR service: {exc}") from exc
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"OCR service returned invalid JSON (HTTP {response.status_code}).") from exc
    if response.status_code >= 400 or not payload.get("success"):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=payload.get("error") or f"OCR service failed (HTTP {response.status_code}).")
    return payload.get("data") or {}

