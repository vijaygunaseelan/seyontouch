from rest_framework import serializers

from .models import Order, Product


class ProductSerializer(serializers.ModelSerializer):
    # The React app's product objects use camelCase keys (listingType,
    # rentPrice) — map them onto the model's snake_case fields so App.jsx
    # doesn't need to know the difference.
    listingType = serializers.CharField(source="listing_type")
    rentPrice = serializers.IntegerField(source="rent_price", required=False, default=0)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "category",
            "listingType",
            "price",
            "stock",
            "sku",
            "image",
            "description",
            "rentPrice",
        ]


class OrderSerializer(serializers.ModelSerializer):
    paymentId = serializers.CharField(source="payment_id", required=False, default="")
    # Server-generated only (see OrderListCreateView.create) — never
    # accepted from the client.
    razorpayOrderId = serializers.CharField(source="razorpay_order_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "paymentId", "razorpayOrderId", "utr", "status", "customer", "items", "total", "createdAt"]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Used only by the admin-only "mark as paid" endpoint — every field
    except status/utr is read-only here, regardless of what's posted."""

    class Meta:
        model = Order
        fields = ["id", "status", "utr"]
        read_only_fields = ["id"]
