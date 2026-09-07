from typing import Optional

from pydantic import BaseModel, Field


class ProductCreateRequest(BaseModel):
    name: str = Field(..., examples=["Packaged Atta 1kg"])
    category: str = Field(..., examples=["Food & Grocery"])
    manufacturer: str = Field(..., examples=["ABC Foods Pvt Ltd"])
    net_quantity: str = Field(..., examples=["1 kg"])
    mrp: str = Field(..., examples=["₹55"])


class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    manufacturer: str
    net_quantity: str
    mrp: str
    created_at: str
