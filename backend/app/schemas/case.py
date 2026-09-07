from typing import Optional

from pydantic import BaseModel, Field


class CaseCreateRequest(BaseModel):
    scan_id: Optional[str] = Field(None, examples=["scan_1"])
    title: str = Field(..., examples=["MRP not declared on package"])
    status: str = Field("open", examples=["open"])
    assigned_to: Optional[str] = Field(None, examples=["inspector_1"])
    notes: Optional[str] = Field(None, examples=["Follow up with manufacturer"])


class CaseResponse(BaseModel):
    id: str
    scan_id: Optional[str] = None
    title: str
    status: str
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
