from typing import List

from pydantic import BaseModel

from app.schemas.scan import Violation


class ReportResponse(BaseModel):
    scan_id: str
    product_name: str
    product_category: str
    scan_date: str
    compliance_score: int
    overall_status: str
    violations: List[Violation]
    notes: str
