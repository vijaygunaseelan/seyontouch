# from django.conf import settings
# from django.contrib import admin
# from django.http import HttpResponse
# from django.urls import include, path, re_path
# from django.views.generic import TemplateView

# urlpatterns = [
#     path("django-admin/", admin.site.urls),
#     path("api/", include("store.urls")),
# ]


# urlpatterns += [
#     path("favicon.ico", lambda request: HttpResponse(status=204)),
# ]


# urlpatterns += [
#     re_path(r"^(?!api/|django-admin/).*$", TemplateView.as_view(template_name="index.html")),
# ]



from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.static import serve

from config.settings import FRONTEND_DIST  # adjust import if FRONTEND_DIST lives elsewhere

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("store.urls")),
]

# Serve root-level static files (favicons, apple-touch-icon, robots.txt, etc.)
# directly from frontend/dist, since STATICFILES_DIRS only covers dist/assets.
urlpatterns += [
    path("favicon.ico", serve, {"document_root": FRONTEND_DIST, "path": "favicon.ico"}),
    path("favicon-32.png", serve, {"document_root": FRONTEND_DIST, "path": "favicon-32.png"}),
    path("favicon-192.png", serve, {"document_root": FRONTEND_DIST, "path": "favicon-192.png"}),
    path("apple-touch-icon1.png", serve, {"document_root": FRONTEND_DIST, "path": "apple-touch-icon1.png"}),
]

# Catch-all for client-side routing — but exclude requests for actual files
# (anything with a file extension) so they 404 properly instead of getting index.html.
urlpatterns += [
    re_path(r"^(?!api/|django-admin/).*$", TemplateView.as_view(template_name="index.html")),
]