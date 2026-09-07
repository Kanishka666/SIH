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
from app.services.compliance_service import evaluate_ocr_text
from app.services.ocr_service import scan_image

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

    ocr_data = scan_image(file_path, file.filename or unique_filename, file.content_type)
    compliance = evaluate_ocr_text(str(ocr_data.get("raw_text") or ""))
    structured = compliance.get("structured_data", {})
    violations = []
    for index, item in enumerate(compliance.get("rule_results", []), start=1):
        if item.get("status") == "VIOLATION":
            violations.append({"id": f"rule_{index}", "title": item.get("rule_id") or item.get("rule") or "Compliance rule", "rule_number": str(item.get("rule_id") or item.get("rule") or ""), "reason": item.get("message") or item.get("reason") or item.get("status", ""), "severity": item.get("severity", "medium").lower(), "recommendation": item.get("recommendation") or "Review this requirement."})
    extracted = {"product_name": ocr_data.get("product_name") or structured.get("generic_name") or "", "mrp": ocr_data.get("mrp") or structured.get("mrp") or "", "manufacturer": ocr_data.get("manufacturer_name") or ocr_data.get("brand") or structured.get("manufacturer_name") or "", "net_quantity": ocr_data.get("net_quantity") or structured.get("net_quantity") or "", "expiry_date": ocr_data.get("use_by_date") or "", "consumer_care": ocr_data.get("consumer_care") or structured.get("consumer_care") or "", "batch_number": ocr_data.get("batch_number"), "manufacturing_date": ocr_data.get("packed_date") or structured.get("packing_date"), "country_of_origin": ocr_data.get("country_of_origin")}

    memory_store.update_scan(scan["id"], status="completed", progress=100, result={"compliance_score": round(100 * sum(1 for item in compliance["rule_results"] if item.get("status") == "PASS") / max(1, sum(1 for item in compliance["rule_results"] if not item.get("needs_extra_module")))), "overall_status": compliance["overall_status"], "extracted_information": extracted, "violations": violations, "recommendations": [v["recommendation"] for v in violations], "ocr_data": ocr_data, "compliance": compliance, "rule_results": compliance["rule_results"]})

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
                "rule_results": scan["result"].get("rule_results", []),
                "raw_text": scan["result"].get("ocr_data", {}).get("raw_text", ""),
            }
        )
    return base






