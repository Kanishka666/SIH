"""
Scan business logic.

Flow (per project architecture requirement):

    route (scans.py)
        -> scan_service.py            <-- this file
            -> mock_ai_service.py      (will become real OCR/ML later)
            -> memory_store.py         (will become PostgreSQL/MongoDB later)
"""
import os
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.storage import memory_store

MAX_UPLOAD_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _validate_image(file: UploadFile, contents: bytes) -> None:
    if file.content_type not in settings.ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                f"Allowed types: PNG, JPG, JPEG, WEBP."
            ),
        )
    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )


def create_scan_from_upload(owner_id: str, file: UploadFile) -> dict:
    contents = file.file.read()
    _validate_image(file, contents)

    if not settings.OCR_API_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR service is not configured yet; scan processing is unavailable.",
        )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="OCR service URL is configured, but the OCR adapter is not integrated yet.",
    )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    extension = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    scan = memory_store.create_scan(
        owner_id=owner_id,
        filename=file.filename or unique_filename,
        file_path=file_path,
        content_type=file.content_type,
    )

    return memory_store.get_scan(scan["id"])


def get_scan_or_404(scan_id: str, owner_id: Optional[str] = None) -> dict:
    scan = memory_store.get_scan(scan_id)
    if not scan or (owner_id is not None and scan["owner_id"] != owner_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found.",
        )
    return scan


def list_scans(owner_id: str) -> list[dict]:
    return memory_store.list_scans(owner_id)


def build_scan_detail_response(scan: dict) -> dict:
    base = {
        "scan_id": scan["id"],
        "status": scan["status"],
        "progress": scan["progress"],
    }
    if scan["status"] == "completed" and scan["result"]:
        base.update(
            {
                "compliance_score": scan["result"]["compliance_score"],
                "overall_status": scan["result"]["overall_status"],
                "extracted_information": scan["result"]["extracted_information"],
                "violations": scan["result"]["violations"],
                "recommendations": scan["result"]["recommendations"],
            }
        )
    return base
