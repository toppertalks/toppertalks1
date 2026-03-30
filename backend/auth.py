import logging
import time

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import FIREBASE_PROJECT_ID

_logger = logging.getLogger("toppertalks")

_GOOGLE_CERT_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)

# Simple in-process cert cache (avoids fetching on every request)
_cert_cache: dict = {"certs": {}, "expires_at": 0.0}


async def _fetch_google_certs() -> dict:
    now = time.time()
    if _cert_cache["expires_at"] > now and _cert_cache["certs"]:
        return _cert_cache["certs"]

    _logger.info('"Fetching Google public certs for Firebase token verification"')
    async with httpx.AsyncClient() as client:
        resp = await client.get(_GOOGLE_CERT_URL, timeout=10)
        resp.raise_for_status()

    certs = resp.json()
    max_age = 3600
    for part in resp.headers.get("cache-control", "").split(","):
        part = part.strip()
        if part.startswith("max-age="):
            try:
                max_age = int(part.split("=", 1)[1])
            except ValueError:
                pass

    _cert_cache["certs"] = certs
    _cert_cache["expires_at"] = now + max_age
    _logger.info('"Google certs refreshed — cached for %s seconds"', max_age)
    return certs


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify a Firebase ID token and return {uid, email}."""
    if not FIREBASE_PROJECT_ID:
        raise HTTPException(
            status_code=503,
            detail="FIREBASE_PROJECT_ID is not configured on the server.",
        )

    token = credentials.credentials
    try:
        certs = await _fetch_google_certs()
        header = jwt.get_unverified_header(token)
        kid = header.get("kid", "")
        if kid not in certs:
            raise HTTPException(status_code=401, detail="Token key ID not recognised")

        payload = jwt.decode(
            token,
            certs[kid],
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
            options={"verify_exp": True},
        )
    except JWTError as exc:
        _logger.warning('"JWT validation failed — %s"', exc)
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc

    return {"uid": payload["sub"], "email": payload.get("email", "")}
