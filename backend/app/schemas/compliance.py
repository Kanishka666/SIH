from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ComplianceEvaluateRequest(BaseModel):
    ocr_text: str = Field(..., min_length=1)
    extra_data: Optional[Dict[str, Any]] = None


class ComplianceEvaluateResponse(BaseModel):
    result: dict
    report: str
