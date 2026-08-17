from django.contrib import admin

from .models import AdminOTP, Order, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "listing_type", "price", "rent_price", "stock", "sku")
    list_filter = ("category", "listing_type")
    search_fields = ("id", "name", "sku")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "payment_id", "razorpay_order_id", "total", "created_at")
    readonly_fields = (
        "id", "payment_id", "razorpay_order_id", "razorpay_signature", "customer", "items", "total", "created_at",
    )
    search_fields = ("id", "payment_id", "razorpay_order_id")


@admin.register(AdminOTP)
class AdminOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "expires_at", "used")
    readonly_fields = ("user", "code", "created_at", "expires_at", "used")
    list_filter = ("used",)
