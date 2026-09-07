from typing import List

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload
from app.schemas.product import ProductCreateRequest, ProductResponse
from app.storage import memory_store

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def list_products(token_payload: dict = Depends(get_current_user_payload)):
    return memory_store.list_products()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreateRequest,
    token_payload: dict = Depends(get_current_user_payload),
):
    product = memory_store.create_product(payload.model_dump())
    return product
