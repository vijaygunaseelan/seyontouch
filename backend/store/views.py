import razorpay
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, Product
from .permissions import IsAdminToken, make_admin_token
from .pricing import CartError, price_cart
from .seed_data import SEED_PRODUCTS
from .serializers import OrderSerializer, OrderStatusUpdateSerializer, ProductSerializer


def razorpay_configured():
    return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class ProductListCreateView(generics.ListCreateAPIView):
    """GET is public (the storefront needs it). POST (add a product) is
    admin-only."""

    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminToken()]
        return [AllowAny()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET is public. PUT/PATCH/DELETE (edit or remove a product) are
    admin-only."""

    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminToken()]


class ProductResetView(APIView):
    """Wipes the catalog and reloads the demo seed data. Mirrors the
    'Reset catalog' button in the admin panel."""

    permission_classes = [IsAdminToken]

    def post(self, request):
        with transaction.atomic():
            Product.objects.all().delete()
            Product.objects.bulk_create([Product(**p) for p in SEED_PRODUCTS])
        products = Product.objects.all()
        return Response(ProductSerializer(products, many=True).data)


class OrderListCreateView(generics.ListCreateAPIView):
    """GET (view past orders) is admin-only. POST (place an order at
    checkout) is public, and atomically decrements stock for every item.

    POST creates the order as "pending" and — if Razorpay is configured —
    also creates a matching Razorpay order, so the frontend can immediately
    open Razorpay Checkout against it. The order only flips to "paid" once
    RazorpayVerifyView has verified the payment signature (or an admin
    manually marks it paid as a fallback)."""

    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAdminToken()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if not razorpay_configured():
            return Response(
                {"detail": "Payment isn't configured yet. Please contact the store."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Re-price the cart server-side — never trust a client-sent price
        # or total. This is also the amount Razorpay Checkout will charge.
        try:
            priced_items, amount_paise = price_cart(request.data.get("items", []))
        except CartError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            locked_products = {}
            for item in priced_items:
                product = Product.objects.select_for_update().get(pk=item["id"])
                if product.stock < item["qty"]:
                    return Response(
                        {"detail": f"Not enough stock for '{product.name}'."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                locked_products[item["id"]] = (product, item["qty"])

            for product, qty in locked_products.values():
                product.stock -= qty
                product.save(update_fields=["stock"])

            # Every new order starts "pending" regardless of what the
            # client sends — status can only change once the payment is
            # verified (RazorpayVerifyView) or an admin overrides it.
            data = dict(request.data)
            data["items"] = priced_items
            data["total"] = amount_paise // 100
            data["status"] = "pending"
            data.pop("paymentId", None)
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            order = serializer.save()

            # Create the matching Razorpay order now, while we're still
            # inside the stock-locking transaction, so the amount Razorpay
            # charges always matches what was just reserved. `receipt`
            # links it back to our own order id for easy lookup in the
            # Razorpay dashboard.
            try:
                razorpay_order = get_razorpay_client().order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order.id,
                    "payment_capture": 1,
                })
            except razorpay.errors.BadRequestError as e:
                return Response({"detail": f"Couldn't start payment: {e}"}, status=status.HTTP_502_BAD_GATEWAY)

            order.razorpay_order_id = razorpay_order["id"]
            order.save(update_fields=["razorpay_order_id"])

            out = OrderSerializer(order).data
            out["razorpayKeyId"] = settings.RAZORPAY_KEY_ID
            headers = self.get_success_headers(out)
            return Response(out, status=status.HTTP_201_CREATED, headers=headers)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    """Admin-only. Used by the admin panel's "Mark as paid" button.
    Only `status` (and `utr`, if the admin wants to fix it up) can ever be
    changed here — customer/items/total are permanently fixed at
    creation time."""

    queryset = Order.objects.all()
    permission_classes = [IsAdminToken]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return OrderSerializer
        return OrderStatusUpdateSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        # Respond with the full order shape (not just status/utr) so the
        # frontend can just splice this straight back into its order list.
        response.data = OrderSerializer(self.get_object()).data
        return response


class RazorpayConfigView(APIView):
    """Public. Tells the frontend whether Razorpay is configured and, if
    so, gives it the publishable key id needed to open Razorpay Checkout.
    (The key secret never leaves the server.)"""

    permission_classes = [AllowAny]

    def get(self, request):
        if not razorpay_configured():
            return Response({"detail": "Payment isn't configured."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"keyId": settings.RAZORPAY_KEY_ID})


class RazorpayVerifyView(APIView):
    """Public. Called by the frontend after Razorpay Checkout reports a
    successful payment. Verifies the payment signature server-side (never
    trust the client's say-so that a payment succeeded) and, only if valid,
    marks the matching order as paid."""

    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get("orderId")
        razorpay_order_id = request.data.get("razorpayOrderId")
        razorpay_payment_id = request.data.get("razorpayPaymentId")
        razorpay_signature = request.data.get("razorpaySignature")

        if not all([order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({"detail": "Missing payment details."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        # The order must be the one we created the Razorpay order for —
        # stops someone from replaying a valid signature from a different
        # (e.g. cheaper) order against this one.
        if not order.razorpay_order_id or order.razorpay_order_id != razorpay_order_id:
            return Response({"detail": "Payment doesn't match this order."}, status=status.HTTP_400_BAD_REQUEST)

        if order.status == "paid":
            return Response(OrderSerializer(order).data)

        try:
            get_razorpay_client().utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            return Response({"detail": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = "paid"
        order.payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature
        order.save(update_fields=["status", "payment_id", "razorpay_signature"])
        return Response(OrderSerializer(order).data)


class AdminLoginView(APIView):
    """Admin login: given a username + password, return a signed admin
    token good for 24 hours. No email/SMTP dependency."""

    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        invalid = Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_active or not user.is_staff:
            return invalid

        return Response({"token": make_admin_token(user.username)})