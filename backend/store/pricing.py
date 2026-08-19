from .models import Product


class CartError(Exception):
    """Raised when a cart can't be priced/fulfilled: missing product,
    insufficient stock, or a malformed line item."""


# Flat shipping fee (₹) added on top of every order's item subtotal.
# Keep this in sync with SHIPPING_FEE in frontend/src/App.jsx — that's
# only what the browser *displays* before checkout; this is what actually
# gets charged (it's baked into the total this module returns, which is
# what Order.total and the Razorpay order amount are built from).
SHIPPING_FEE_RUPEES = 60


def price_cart(raw_items):
    """Given the frontend's cart items ([{id, qty, mode, days}, ...]),
    looks up each product server-side and computes the same unit price the
    React cart shows (sale: product.price; rent: product.rent_price * days).

    Never trusts a price sent by the client — this is the one place the
    "real" total is computed, so a tampered cart total from the browser
    can't sneak into an order.

    Returns (priced_items, total_paise) where priced_items is ready to be
    stored on Order.items, and total_paise is the amount in paise (i.e.
    total_paise // 100 gives you the rupee amount to store on Order.total).

    Raises CartError with a user-facing message on any problem.
    """
    if not raw_items:
        raise CartError("Cart is empty.")

    priced_items = []
    total_rupees = 0

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

        total_rupees += unit_price * qty
        priced_items.append({
            "id": product.id,
            "name": product.name,
            "price": unit_price,
            "qty": qty,
            "mode": mode,
            "days": days,
        })

    # Flat shipping fee is added here (not as a line item in priced_items)
    # so it's baked into the one authoritative total — the same total that
    # becomes Order.total and the amount Razorpay actually charges.
    total_paise = (total_rupees + SHIPPING_FEE_RUPEES) * 100
    return priced_items, total_paise