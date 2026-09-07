from fastapi import APIRouter, Depends, Response

from app.core.security import require_roles
from app.schemas.report import ReportResponse
from app.services import report_service

router = APIRouter(prefix="/api/scans", tags=["Reports"])


@router.get("/{scan_id}/report", response_model=ReportResponse)
def get_report(scan_id: str, token_payload: dict = Depends(require_roles("inspector", "admin"))):
    """Structured report data for the frontend Report Viewer."""
    scan = report_service.get_report_or_404(scan_id, owner_id=token_payload.get("sub"))
    return report_service.build_report(scan)


@router.get("/{scan_id}/report/pdf")
def get_report_pdf(scan_id: str, token_payload: dict = Depends(require_roles("inspector", "admin"))):
    """Download a simple generated PDF version of the report."""
    scan = report_service.get_report_or_404(scan_id, owner_id=token_payload.get("sub"))
    pdf_bytes = report_service.generate_report_pdf(scan)
    headers = {"Content-Disposition": f'attachment; filename="labellens_report_{scan_id}.pdf"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
