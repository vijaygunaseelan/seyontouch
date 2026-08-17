from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("store.urls")),
]


urlpatterns += [
    path("favicon.ico", lambda request: HttpResponse(status=204)),
]


urlpatterns += [
    re_path(
        r"^(?!api/|django-admin/|assets/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]