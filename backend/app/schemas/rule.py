from pydantic import BaseModel


class RuleResponse(BaseModel):
    id: str
    title: str
    description: str
    severity: str  # "low" | "medium" | "high"
