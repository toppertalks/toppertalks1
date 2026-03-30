from pydantic import BaseModel
from typing import Optional


class WalletTopup(BaseModel):
    amount: float
    paymentId: str


class Transaction(BaseModel):
    id: str
    type: str  # "topup" | "call" | "refund"
    amount: float
    description: str
    createdAt: Optional[str] = None


class WalletResponse(BaseModel):
    balance: float
    transactions: list[Transaction] = []
