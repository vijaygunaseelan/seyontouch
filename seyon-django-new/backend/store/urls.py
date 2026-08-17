from django.urls import path

from . import views

urlpatterns = [
    path("products/", views.ProductListCreateView.as_view(), name="product-list"),
    path("products/reset/", views.ProductResetView.as_view(), name="product-reset"),
    path("products/<str:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("orders/", views.OrderListCreateView.as_view(), name="order-list"),
    path("orders/<str:pk>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("checkout/razorpay-config/", views.RazorpayConfigView.as_view(), name="razorpay-config"),
    path("checkout/razorpay-verify/", views.RazorpayVerifyView.as_view(), name="razorpay-verify"),
    path("admin/request-otp/", views.RequestOtpView.as_view(), name="admin-request-otp"),
    path("admin/verify-otp/", views.VerifyOtpView.as_view(), name="admin-verify-otp"),
]
