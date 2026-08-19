"""
Django settings for the Seyon Touch store backend.
"""

import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env automatically (if present) so env vars like
# RAZORPAY_KEY_ID work whether you start the server via `manage.py
# runserver`, gunicorn, an IDE's run button, etc. — no manual `export`
# step needed. override=True so .env is always the source of truth here,
# even if a stale value was exported in your shell session earlier.
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env", override=True)
except ImportError:
    pass  # python-dotenv not installed — fall back to real env vars only

# The built React app ends up in ../frontend/dist (sibling of backend/).
FRONTEND_DIR = BASE_DIR.parent / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"

# --- Security -----------------------------------------------------------
# SECURITY WARNING: set a real, secret SECRET_KEY and turn DEBUG off before
# deploying. These env vars give you a safe default for local development.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-change-me-before-deploying",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = [
    "seyontouch.in",
    "www.seyontouch.in",
]

CSRF_TRUSTED_ORIGINS = [
    "https://seyontouch.in",
    "https://www.seyontouch.in",
]

CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG


# --- Razorpay payment gateway ---------------------------------------------
# Set these from your Razorpay dashboard (Settings -> API Keys) so checkout
# can accept UPI, cards, netbanking, and wallets through Razorpay Checkout,
# with the payment automatically verified server-side (no more manually
# marking orders as paid). Leave them blank and checkout shows "payment
# unavailable" until you configure them.
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")


# --- Applications ---------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "store",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # Lets Django serve the built frontend/dist/index.html directly.
        "DIRS": [FRONTEND_DIST],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# --- Database ---------------------------------------------------------
# SQLite by default so `manage.py migrate` just works out of the box.
# For a real deployment, point this at Postgres instead (e.g. via
# DATABASE_URL + dj-database-url, or fill in the dict below by hand).



DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# --- Static & frontend files ---------------------------------------------
# In production, `npm run build` in frontend/ produces frontend/dist/, and
# Django serves that build directly: index.html via a template view, and
# the hashed JS/CSS bundle in dist/assets/ as static files at /assets/.

STATIC_URL = "/assets/"
STATICFILES_DIRS = [FRONTEND_DIST / "assets"] if (FRONTEND_DIST / "assets").exists() else []
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Django REST Framework -------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    # The API is stateless (see store/permissions.py's IsAdminToken) and
    # never uses Django sessions for auth. Without this, DRF falls back to
    # its default authentication classes, which include SessionAuthentication.
    # That class silently kicks in whenever the browser *also* has an
    # active session cookie from /django-admin/, and then enforces CSRF on
    # top of the Bearer-token check — which api.js's write calls never
    # send a CSRF header for. Result: "CSRF Failed: CSRF token missing"
    # on Save, but only for admins who've ever logged into /django-admin/
    # in that browser. Setting this to [] removes that fallback entirely.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "UNAUTHENTICATED_USER": None,
}