from datetime import datetime, timedelta, timezone

from .models import Product


class CartError(Exception):
    """Raised when a cart can't be priced/fulfilled: missing product,
    insufficient stock, or a malformed line item."""


# Shipping rules (₹). Keep in sync with SHIPPING_FEE / RENT_SHIPPING_FEE /
# FREE_SHIPPING_THRESHOLD in frontend/src/App.jsx — the browser only
# *displays* these before checkout; what this module computes is what
# actually gets charged (Order.total and the Razorpay order amount).
SHIPPING_FEE_RUPEES = 60
RENT_SHIPPING_FEE_RUPEES = 160
FREE_SHIPPING_THRESHOLD = 599

# Limited-time sale: 3, 4 and 5 November 2026 (India time, inclusive).
# Keep in sync with PROMO_* in frontend/src/App.jsx.
#   subtotal >= 1000 -> 5% off
#   subtotal >= 1500 -> 5% off + free shipping
IST = timezone(timedelta(hours=5, minutes=30))
PROMO_START = datetime(2026, 11, 3, 0, 0, 0, tzinfo=IST)
PROMO_END = datetime(2026, 11, 6, 0, 0, 0, tzinfo=IST)  # exclusive
PROMO_DISCOUNT_THRESHOLD = 1000
PROMO_FREE_SHIPPING_THRESHOLD = 1500
PROMO_DISCOUNT_PERCENT = 5


def promo_active(now=None):
    now = now or datetime.now(IST)
    return PROMO_START <= now < PROMO_END


def compute_charges(subtotal, all_rent, now=None):
    """Returns (discount, shipping_fee) in whole rupees for a cart subtotal."""
    active = promo_active(now)

    discount = 0
    if active and subtotal >= PROMO_DISCOUNT_THRESHOLD:
        discount = round(subtotal * PROMO_DISCOUNT_PERCENT / 100)

    if subtotal >= FREE_SHIPPING_THRESHOLD or (
        active and subtotal >= PROMO_FREE_SHIPPING_THRESHOLD
    ):
        shipping = 0
    elif all_rent:
        shipping = RENT_SHIPPING_FEE_RUPEES
    else:
        shipping = SHIPPING_FEE_RUPEES
    return discount, shipping


def price_cart(raw_items):
    """Given the frontend's cart items ([{id, qty, mode, days}, ...]),
    looks up each product server-side and computes the same unit price the
    React cart shows (sale: product.price; rent: product.rent_price * days).

    Never trusts a price sent by the client — this is the one place the
    "real" total is computed, so a tampered cart total from the browser
    can't sneak into an order.

    Returns (priced_items, total_paise, discount, shipping_fee) where
    priced_items is ready to be stored on Order.items, total_paise is the
    amount in paise (total_paise // 100 is the rupee amount to store on
    Order.total), and discount / shipping_fee are whole rupees.

    Raises CartError with a user-facing message on any problem.
    """
    if not raw_items:
        raise CartError("Cart is empty.")

    priced_items = []
    total_rupees = 0
    all_rent = True

    for raw in raw_items:
        product_id = raw.get("id")
        try:
            qty = int(raw.get("qty") or 0)
        except (TypeError, ValueError):
            raise CartError("Invalid quantity in cart.")
        if qty <= 0:
            raise CartError("Invalid quantity in cart.")

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            raise CartError(f"Product '{product_id}' no longer exists.")

        if product.stock < qty:
            raise CartError(f"Not enough stock for '{product.name}'.")

        mode = raw.get("mode") or "buy"
        if mode == "rent":
            try:
                days = int(raw.get("days") or 0)
            except (TypeError, ValueError):
                raise CartError(f"Invalid rental duration for '{product.name}'.")
            if days <= 0:
                raise CartError(f"Invalid rental duration for '{product.name}'.")
            unit_price = product.rent_price * days
        else:
            mode = "buy"
            days = None
            unit_price = product.price

        if mode != "rent":
            all_rent = False
        total_rupees += unit_price * qty
        priced_items.append({
            "id": product.id,
            "name": product.name,
            "price": unit_price,
            # Snapshot the per-unit cost at order time (not just a live
            # lookup) so admin analytics' profit figure for old orders
            # doesn't shift if a product's cost_price is edited later, or
            # the product itself is deleted.
            "cost": product.cost_price,
            "qty": qty,
            "mode": mode,
            "days": days,
        })

    # Discount and shipping are baked into the one authoritative total —
    # the same total that becomes Order.total and the amount Razorpay
    # actually charges.
    discount, shipping = compute_charges(total_rupees, all_rent)
    total_paise = (total_rupees - discount + shipping) * 100
    return priced_items, total_paise, discount, shipping
