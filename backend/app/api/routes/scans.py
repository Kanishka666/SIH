from typing import List

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.security import require_roles
from app.schemas.scan import ScanCreateResponse, ScanDetailResponse
from app.services import scan_service

router = APIRouter(prefix="/api/scans", tags=["Scans"])


@router.post("", response_model=ScanCreateResponse, status_code=201)
async def create_scan(
    file: UploadFile = File(...),
    token_payload: dict = Depends(require_roles("inspector", "admin")),
):
    """
    Upload a packaged product image (drag-and-drop, camera capture, or
    file picker on the frontend all end up here as multipart/form-data).

    MOCK BEHAVIOUR: processing currently runs synchronously using
    mock_ai_service and completes immediately. The response still
    follows the "processing" contract the frontend expects so that
    swapping in a real async pipeline later doesn't change this shape.
    """
    owner_id = token_payload.get("sub")
    scan = scan_service.create_scan_from_upload(owner_id, file)
    return ScanCreateResponse(
        scan_id=scan["id"],
        status=scan["status"],
        message="Image uploaded successfully",
    )


@router.get("/{scan_id}", response_model=ScanDetailResponse)
def get_scan(scan_id: str, token_payload: dict = Depends(require_roles("inspector", "admin"))):
    """Return current scan status, and full mock result once completed."""
    scan = scan_service.get_scan_or_404(scan_id, owner_id=token_payload.get("sub"))
    return scan_service.build_scan_detail_response(scan)


@router.get("", response_model=List[ScanDetailResponse])
def list_scans(token_payload: dict = Depends(require_roles("inspector", "admin"))):
    return [scan_service.build_scan_detail_response(scan) for scan in scan_service.list_scans(token_payload.get("sub"))]
