from fastapi import APIRouter, Depends

from app.core.security import require_roles
from app.schemas.compliance import ComplianceEvaluateRequest, ComplianceEvaluateResponse
from app.services.compliance_service import evaluate_ocr_text, format_report

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


@router.post("/evaluate", response_model=ComplianceEvaluateResponse)
def evaluate_compliance(
    payload: ComplianceEvaluateRequest,
    token_payload: dict = Depends(require_roles("inspector", "admin")),
):
    result = evaluate_ocr_text(payload.ocr_text, payload.extra_data)
    return ComplianceEvaluateResponse(result=result, report=format_report(0, result))
