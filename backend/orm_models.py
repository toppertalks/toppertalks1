from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    TIMESTAMP,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)          # Firebase UID
    email = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)           # 'student' | 'topper'
    exam_mode = Column(String, nullable=False)      # 'JEE' | 'NEET'
    avatar_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    topper_profile = relationship("Topper", back_populates="user", uselist=False)
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    sent_ratings = relationship("Rating", foreign_keys="Rating.from_uid", back_populates="rater")
    received_ratings = relationship("Rating", foreign_keys="Rating.to_uid", back_populates="ratee")
    mentor_application = relationship("MentorApplication", back_populates="user", uselist=False)


class Topper(Base):
    __tablename__ = "toppers"

    uid = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    college = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)
    rank = Column(String, nullable=True)
    exam_cleared = Column(String, nullable=True, index=True)  # WHERE exam_cleared = ?
    subjects = Column(ARRAY(String), nullable=False, server_default="{}")
    bio = Column(Text, nullable=True)
    rating = Column(Float, nullable=False, default=0.0)
    total_sessions = Column(Integer, nullable=False, default=0)
    is_online = Column(Boolean, nullable=False, default=False)
    avatar_url = Column(String, nullable=True)

    user = relationship("User", back_populates="topper_profile")


class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True)
    student_uid = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)  # WHERE student_uid = ?
    topper_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)   # WHERE topper_id = ?
    topper_name = Column(String, nullable=True)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    amount_charged = Column(Float, nullable=False, default=0.0)
    student_pays = Column(Float, nullable=False, default=0.0)
    topper_earns = Column(Float, nullable=False, default=0.0)
    platform_fee = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="active", index=True)  # WHERE status = 'active'
    report_reason = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    ratings = relationship("Rating", back_populates="session")
    reports = relationship("Report", back_populates="session")


class Wallet(Base):
    __tablename__ = "wallets"

    uid = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    balance = Column(Float, nullable=False, default=0.0)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet", order_by="Transaction.created_at.desc()")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    user_uid = Column(String, ForeignKey("wallets.uid", ondelete="CASCADE"), nullable=False, index=True)  # WHERE user_uid = ?
    type = Column(String, nullable=False)           # 'topup' | 'call' | 'refund'
    amount = Column(Float, nullable=False)
    payment_id = Column(String, nullable=True, index=True)  # dedup check: WHERE payment_id = ?
    description = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    wallet = relationship("Wallet", back_populates="transactions")


class Rating(Base):
    __tablename__ = "ratings"

    rating_id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)  # dup check + relationship
    from_uid = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)  # dup check: WHERE session_id AND from_uid
    to_uid = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)    # WHERE to_uid = ? (ratings list + avg)
    stars = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False, default="")
    created_at = Column(TIMESTAMP, server_default=func.now())

    session = relationship("Session", back_populates="ratings")
    rater = relationship("User", foreign_keys=[from_uid], back_populates="sent_ratings")
    ratee = relationship("User", foreign_keys=[to_uid], back_populates="received_ratings")


class MentorApplication(Base):
    __tablename__ = "mentor_applications"

    applicant_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    college = Column(String, nullable=False)
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)
    exams = Column(JSONB, nullable=False, default=list)     # [{exam, rank}, ...]
    subjects = Column(ARRAY(String), nullable=False, server_default="{}")
    bio = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")
    applied_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="mentor_application")


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False)
    reported_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    session = relationship("Session", back_populates="reports")


class Event(Base):
    __tablename__ = "events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True)
    event = Column(String, nullable=False)
    event_metadata = Column("metadata", JSONB, nullable=True)
    timestamp = Column(String, nullable=True)        # client-provided ISO string
    server_timestamp = Column(TIMESTAMP, server_default=func.now())
