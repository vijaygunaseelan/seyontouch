from django.db import models

CATEGORY_CHOICES = [
    (c, c)
    for c in [
        "Bangles",
        "Anti-Tarnish Chains",
        "Anti-Tarnish Bracelets",
        "Hair Accessories",
        "Designer Jewelry",
        "Temple Jewels",
        "Chokers",
        "Ear Chain",
    ]
]

LISTING_TYPE_CHOICES = [
    ("sale", "Sale"),
    ("rent", "Rent"),
    ("both", "Sale & Rent"),
]


class Product(models.Model):
    """A single catalog item. `id` is a client-generated slug-like string
    (e.g. 'p_bangle01') to stay compatible with the existing React UI."""

    id = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=64, choices=CATEGORY_CHOICES)
    listing_type = models.CharField(max_length=8, choices=LISTING_TYPE_CHOICES, default="sale")
    price = models.PositiveIntegerField(default=0)
    rent_price = models.PositiveIntegerField(default=0)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=32, blank=True)
    # Either a plain image URL, or a compressed base64 data: URI produced
    # client-side by the admin panel's image uploader.
    image = models.TextField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Order(models.Model):
    """A placed order. `id` is client-generated (e.g. 'GS12345678') to match
    the existing checkout flow's order-number format."""

    STATUS_CHOICES = [
        ("pending", "Pending payment"),
        ("paid", "Paid"),
    ]

    id = models.CharField(max_length=32, primary_key=True)
    # Razorpay's payment id (pay_...), filled in once the payment is
    # verified server-side.
    payment_id = models.CharField(max_length=64, blank=True)
    # Razorpay's order id (order_...), created up front so Razorpay
    # Checkout can be opened against it, and so the payment signature can
    # be verified against a specific, server-created order afterwards.
    razorpay_order_id = models.CharField(max_length=64, blank=True)
    # The signature Razorpay returned on success — kept for audit purposes
    # after it's been verified.
    razorpay_signature = models.CharField(max_length=128, blank=True)
    # Legacy: what the customer typed in as their UPI transaction
    # reference, back when checkout was manual UPI. Unused by the current
    # Razorpay checkout flow, kept so old orders still display correctly.
    utr = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    customer = models.JSONField(default=dict)
    items = models.JSONField(default=list)
    total = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.id



