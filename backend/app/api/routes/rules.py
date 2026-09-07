from typing import List

from fastapi import APIRouter

from app.schemas.rule import RuleResponse
from app.storage import memory_store

router = APIRouter(prefix="/api/rules", tags=["Rules"])


@router.get("", response_model=List[RuleResponse])
def list_rules():
    """
    Returns placeholder/demo compliance rules only. This does NOT
    represent the complete, verified Legal Metrology (Packaged
    Commodities) Rules — that dataset will be added after verification
    by the team. Left unauthenticated since it's static reference data.
    """
    return memory_store.list_rules()
