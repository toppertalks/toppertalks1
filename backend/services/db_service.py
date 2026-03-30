"""Database access helpers — re-exports get_db from database.py."""
from database import get_db as get_db  # noqa: F401

__all__ = ["get_db"]
