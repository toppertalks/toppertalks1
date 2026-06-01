from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.wallet import Transaction, Wallet

router = APIRouter(prefix="/wallet", tags=["wallet"])


class WalletResponse(BaseModel):
    balance: float
    transactions: list[dict]


class TopupBody(BaseModel):
    amount: float = Field(..., gt=0)
    paymentId: str


@router.get("", response_model=WalletResponse)
async def get_wallet(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    wallet = await db.get(Wallet, user.id)
    if not wallet:
        wallet = Wallet(uid=user.id, balance=0.0)
        db.add(wallet)
        await db.commit()
    rows = (
        await db.execute(
            select(Transaction)
            .where(Transaction.user_uid == user.id)
            .order_by(Transaction.created_at.desc())
            .limit(50)
        )
    ).scalars().all()
    return WalletResponse(
        balance=wallet.balance,
        transactions=[
            {
                "id": str(t.id),
                "type": t.type,
                "amount": t.amount,
                "description": t.description,
                "paymentId": t.payment_id,
                "sessionId": str(t.session_id) if t.session_id else None,
                "createdAt": t.created_at.isoformat() if t.created_at else None,
            }
            for t in rows
        ],
    )


@router.post("")
async def topup(
    body: TopupBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    # Idempotency check
    existing = (
        await db.execute(
            select(Transaction).where(
                Transaction.user_uid == user.id,
                Transaction.payment_id == body.paymentId,
            )
        )
    ).scalar_one_or_none()
    if existing:
        wallet = await db.get(Wallet, user.id)
        return {"newBalance": wallet.balance if wallet else 0.0, "duplicate": True}

    wallet = await db.get(Wallet, user.id)
    if not wallet:
        wallet = Wallet(uid=user.id, balance=0.0)
        db.add(wallet)
    wallet.balance += body.amount
    db.add(Transaction(
        user_uid=user.id,
        type="topup",
        amount=body.amount,
        payment_id=body.paymentId,
        description=f"Added ₹{body.amount:.0f}",
    ))
    await db.commit()
    return {"newBalance": wallet.balance}
