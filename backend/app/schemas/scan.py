from typing import List, Optional

from pydantic import BaseModel


class ScanCreateResponse(BaseModel):
    scan_id: str
    status: str
    message: str


class ScanStatusResponse(BaseModel):
    scan_id: str
    status: str
    progress: int


class ExtractedInformation(BaseModel):
    product_name: str
    mrp: str
    manufacturer: str
    net_quantity: str
    expiry_date: str
    consumer_care: str
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    country_of_origin: Optional[str] = None


class Violation(BaseModel):
    id: str
    title: str
    rule_number: str
    reason: str
    severity: str  # "low" | "medium" | "high"
    recommendation: str


class RuleResult(BaseModel):
    rule: str
    clause: str
    status: str
    message: str
    needs_extra_module: bool = False


class ScanResultResponse(BaseModel):
    scan_id: str
    status: str
    compliance_score: int
    overall_status: str  # "COMPLIANT" | "NON_COMPLIANT"
    extracted_information: ExtractedInformation
    violations: List[Violation]
    recommendations: List[str]


class ScanDetailResponse(BaseModel):
    """
    Returned by GET /api/scans/{id}.
    While processing: only status/progress are meaningful.
    Once completed: full mock result fields are included.
    """
    scan_id: str
    status: str
    progress: int
    compliance_score: Optional[int] = None
    overall_status: Optional[str] = None
    extracted_information: Optional[ExtractedInformation] = None
    violations: Optional[List[Violation]] = None
    recommendations: Optional[List[str]] = None
    rule_results: Optional[List[RuleResult]] = None
    raw_text: Optional[str] = None


