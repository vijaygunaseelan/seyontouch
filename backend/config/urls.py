from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.static import serve as static_serve

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("store.urls")),
]

# Serve the handful of static files that live at the ROOT of frontend/dist
# (favicons, apple-touch-icon, category thumbnails) — these aren't under
# /assets/, so Whitenoise's STATICFILES_DIRS doesn't cover them. This
# replaces the old favicon.ico -> 204 stub, which was silently killing it.
urlpatterns += [
    re_path(
        r"^(?P<path>favicon\.ico|favicon-32\.png|favicon-192\.png|apple-touch-icon\.png)$",
        static_serve,
        {"document_root": settings.FRONTEND_DIST},
    ),
    re_path(
        r"^categories/(?P<path>.*)$",
        static_serve,
        {"document_root": settings.FRONTEND_DIST / "categories"},
    ),
]

urlpatterns += [
    re_path(
        r"^(?!api/|django-admin/|assets/|favicon|apple-touch-icon|categories/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]