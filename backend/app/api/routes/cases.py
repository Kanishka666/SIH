from typing import List

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload
from app.schemas.case import CaseCreateRequest, CaseResponse
from app.storage import memory_store

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("", response_model=List[CaseResponse])
def list_cases(token_payload: dict = Depends(get_current_user_payload)):
    return memory_store.list_cases()


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreateRequest,
    token_payload: dict = Depends(get_current_user_payload),
):
    case = memory_store.create_case(payload.model_dump())
    return case
