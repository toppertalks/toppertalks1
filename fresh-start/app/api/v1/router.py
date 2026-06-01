from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin_permissions,
    admin_roles,
    admin_users,
    auth,
    events,
    mentor,
    ratings,
    sessions,
    toppers,
    user_profile,
    users,
    wallet,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(admin_users.router)
api_router.include_router(admin_roles.router)
api_router.include_router(admin_permissions.router)
api_router.include_router(toppers.router)
api_router.include_router(sessions.router)
api_router.include_router(wallet.router)
api_router.include_router(ratings.router)
api_router.include_router(user_profile.router)
api_router.include_router(mentor.router)
api_router.include_router(events.router)
