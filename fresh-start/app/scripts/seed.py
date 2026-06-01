"""
Seed default roles, permissions, role->permission mappings, and an optional
bootstrap superuser.

Usage:
    python -m app.scripts.seed
    SEED_SUPERUSER_EMAIL=admin@example.com SEED_SUPERUSER_PASSWORD=Admin#12345 \
        python -m app.scripts.seed
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Dict, Iterable, List

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User

logger = logging.getLogger("seed")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

# ---- Catalog -------------------------------------------------------------

PERMISSIONS: Dict[str, str] = {
    # Users
    "user:create": "Create users",
    "user:read": "Read user details",
    "user:update": "Update users",
    "user:delete": "Delete users",
    "user:assign_role": "Assign / remove roles on users",
    # Roles
    "role:create": "Create roles",
    "role:read": "Read roles",
    "role:update": "Update roles",
    "role:delete": "Delete roles",
    "role:assign_permission": "Assign / remove permissions on roles",
    # Permissions
    "permission:read": "Read permissions",
    # Reports
    "report:view": "View reports",
    "report:export": "Export reports",
    # Audit
    "audit:read": "Read audit logs",
}

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "SUPER_ADMIN": list(PERMISSIONS.keys()),  # everything
    "ADMIN": [
        "user:create", "user:read", "user:update", "user:delete", "user:assign_role",
        "role:read", "role:assign_permission",
        "permission:read",
        "report:view", "report:export",
        "audit:read",
    ],
    "MANAGER": [
        "user:read", "user:update",
        "role:read", "permission:read",
        "report:view", "report:export",
    ],
    "USER": [],
}

ROLE_DESCRIPTIONS: Dict[str, str] = {
    "SUPER_ADMIN": "Full system access (cannot be deleted)",
    "ADMIN": "Administrative access",
    "MANAGER": "Read + limited update access",
    "USER": "Default end-user role",
}

# ---- Helpers -------------------------------------------------------------

async def _upsert_permissions(db) -> Dict[str, Permission]:
    existing = (await db.execute(select(Permission))).scalars().all()
    by_code = {p.code: p for p in existing}
    created = 0
    for code, desc in PERMISSIONS.items():
        if code not in by_code:
            perm = Permission(code=code, description=desc)
            db.add(perm)
            by_code[code] = perm
            created += 1
        elif by_code[code].description != desc:
            by_code[code].description = desc
    await db.flush()
    logger.info("permissions: %d total, %d new", len(by_code), created)
    return by_code


async def _upsert_roles(db, perms: Dict[str, Permission]) -> Dict[str, Role]:
    existing = (await db.execute(select(Role))).scalars().all()
    by_name = {r.name: r for r in existing}
    created = 0
    for name, codes in ROLE_PERMISSIONS.items():
        role = by_name.get(name)
        if role is None:
            role = Role(name=name, description=ROLE_DESCRIPTIONS.get(name))
            db.add(role)
            by_name[name] = role
            created += 1
        else:
            role.description = ROLE_DESCRIPTIONS.get(name, role.description)

        desired = {perms[c] for c in codes if c in perms}
        current = set(role.permissions)
        if desired != current:
            role.permissions = list(desired)
    await db.flush()
    logger.info("roles: %d total, %d new", len(by_name), created)
    return by_name


async def _maybe_create_superuser(db, roles: Dict[str, Role]) -> None:
    email = os.getenv("SEED_SUPERUSER_EMAIL")
    password = os.getenv("SEED_SUPERUSER_PASSWORD")
    if not email or not password:
        logger.info("superuser: skipped (set SEED_SUPERUSER_EMAIL/PASSWORD to create)")
        return

    existing = await db.execute(select(User).where(User.email == email.lower()))
    user = existing.scalar_one_or_none()
    if user is None:
        user = User(
            email=email.lower(),
            full_name="Super Admin",
            hashed_password=hash_password(password),
            is_active=True,
            is_verified=True,
            is_superuser=True,
        )
        db.add(user)
        logger.info("superuser: created %s", email)
    else:
        user.is_superuser = True
        user.is_active = True
        user.is_verified = True
        logger.info("superuser: updated existing %s", email)

    super_role = roles.get("SUPER_ADMIN")
    if super_role and super_role not in user.roles:
        user.roles.append(super_role)


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        perms = await _upsert_permissions(db)
        roles = await _upsert_roles(db, perms)
        await _maybe_create_superuser(db, roles)
        await db.commit()
        logger.info("seed complete")


if __name__ == "__main__":
    asyncio.run(seed())
