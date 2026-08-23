"""
Order emails: a customer confirmation and an admin "new order" notification,
both sent once an order is verified as paid (see views.RazorpayVerifyView).

Sending is best-effort. By the time these are called, the payment has
already succeeded and stock has already been decremented — a broken SMTP
config or a transient network error here must never fail the checkout
response or roll anything back. Failures are logged, not raised.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _order_context(order):
    customer = order.customer or {}

    items = []
    for item in order.items or []:
        qty = item.get("qty", 0) or 0
        price = item.get("price", 0) or 0
        items.append({**item, "line_total": price * qty})

    address_line = ", ".join(
        part for part in [customer.get("address1"), customer.get("address2")] if part
    )
    city_line = ", ".join(
        part for part in [customer.get("city"), customer.get("state"), customer.get("pincode")] if part
    )

    return {
        "order": order,
        "items": items,
        "customer": customer,
        "address_line": address_line,
        "city_line": city_line,
        "store_name": "Seyon Touch",
        "store_phone": "+91 9611975252",
        "store_email": settings.STORE_NOTIFICATION_EMAIL,
    }


def _send(to, subject, template_base, context):
    if not to:
        return
    try:
        text_body = render_to_string(f"{template_base}.txt", context)
        html_body = render_to_string(f"{template_base}.html", context)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send order email (%s) to %s", template_base, to)


def send_order_emails(order):
    """Send both emails for a newly-paid order. Called once, right after
    an order's status flips to 'paid' — never on a retried/duplicate
    verify call against an already-paid order (the caller is responsible
    for that check, so this stays a dumb "just send it" function)."""
    context = _order_context(order)
    customer_email = (order.customer or {}).get("email")

    _send(
        to=customer_email,
        subject=f"Your Seyon Touch order {order.id} is confirmed",
        template_base="emails/customer_order_confirmation",
        context=context,
    )

    _send(
        to=settings.STORE_NOTIFICATION_EMAIL,
        subject=f"New order {order.id} — {context['customer'].get('name', 'Customer')} — \u20b9{order.total}",
        template_base="emails/admin_order_notification",
        context=context,
    )