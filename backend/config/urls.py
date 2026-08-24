from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.static import serve

from config.settings import FRONTEND_DIST


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("store.urls")),

    # Serve root-level files from frontend/dist
    path(
        "favicon.ico",
        serve,
        {
            "document_root": FRONTEND_DIST,
            "path": "favicon.ico",
        },
    ),

    path(
        "favicon-32.png",
        serve,
        {
            "document_root": FRONTEND_DIST,
            "path": "favicon-32.png",
        },
    ),

    path(
        "favicon-192.png",
        serve,
        {
            "document_root": FRONTEND_DIST,
            "path": "favicon-192.png",
        },
    ),

    path(
        "apple-touch-icon1.png",
        serve,
        {
            "document_root": FRONTEND_DIST,
            "path": "apple-touch-icon1.png",
        },
    ),

    # Static files with extensions
    re_path(
        r"^(?P<path>.*\.[^/]+)$",
        serve,
        {
            "document_root": FRONTEND_DIST,
        },
    ),

    # React/Vite client-side routing
    re_path(
        r"^(?!api/|django-admin/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]