from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from rest_framework.permissions import BasePermission

# Stateless admin auth: after a successful OTP login (see views.RequestOtpView
# / VerifyOtpView), the browser gets back a signed, time-limited token
# identifying which staff user logged in. That token must be sent as
# `Authorization: Bearer <token>` on every admin-only request. No session
# table needed — the signature + timestamp is enough to trust it.

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24  # 24 hours
_TOKEN_PREFIX = "admin:"
_signer = TimestampSigner()


def make_admin_token(username: str) -> str:
    return _signer.sign(f"{_TOKEN_PREFIX}{username}")


def get_token_username(token: str) -> str | None:
    """Returns the username embedded in a valid token, or None."""
    try:
        value = _signer.unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None
    if not value.startswith(_TOKEN_PREFIX):
        return None
    return value[len(_TOKEN_PREFIX):]


def verify_admin_token(token: str) -> bool:
    return get_token_username(token) is not None


class IsAdminToken(BasePermission):
    message = "Valid admin token required."

    def has_permission(self, request, view):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return False
        token = auth[len("Bearer "):]
        return verify_admin_token(token)
