import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.wallet import WalletTopup
from orm_models import Transaction, Wallet

_logger = logging.getLogger("toppertalks")

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("")
async def get_wallet(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    wallet_result = await db.execute(select(Wallet).where(Wallet.uid == uid))
    wallet = wallet_result.scalar_one_or_none()
    balance = wallet.balance if wallet else 0.0

    tx_result = await db.execute(
        select(Transaction)
        .where(Transaction.user_uid == uid)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    transactions = tx_result.scalars().all()

    return {
        "balance": balance,
        "transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount": t.amount,
                "description": t.description,
                "createdAt": t.created_at.isoformat() + "Z" if t.created_at else None,
            }
            for t in transactions
        ],
    }


@router.post("")
async def add_money(
    body: WalletTopup,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if not body.paymentId:
        raise HTTPException(status_code=400, detail="Payment ID required")

    # Guard against duplicate payment IDs (replay attack prevention)
    dup_result = await db.execute(
        select(Transaction)
        .where(Transaction.user_uid == uid)
        .where(Transaction.payment_id == body.paymentId)
        .limit(1)
    )
    if dup_result.scalar_one_or_none():
        _logger.warning('"Duplicate payment rejected — payment_id=%s uid=%s"', body.paymentId, uid)
        raise HTTPException(status_code=400, detail="Payment already processed")

    wallet_result = await db.execute(select(Wallet).where(Wallet.uid == uid))
    wallet = wallet_result.scalar_one_or_none()

    if wallet:
        new_balance = wallet.balance + body.amount
        await db.execute(
            update(Wallet).where(Wallet.uid == uid).values(balance=new_balance)
        )
    else:
        new_balance = body.amount
        db.add(Wallet(uid=uid, balance=new_balance))

    tx_id = str(uuid.uuid4())
    db.add(
        Transaction(
            id=tx_id,
            user_uid=uid,
            type="topup",
            amount=body.amount,
            payment_id=body.paymentId,
            description=f"Added \u20b9{body.amount}",
        )
    )
    await db.commit()
    _logger.info('"Wallet topup — uid=%s amount=%.2f new_balance=%.2f"', uid, body.amount, new_balance)
    return {"newBalance": new_balance}
