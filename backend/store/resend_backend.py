"""
Custom Django email backend that sends via the Resend API
(https://resend.com) over HTTPS, instead of SMTP.

Why: some hosts restrict/throttle outbound SMTP ports, and Gmail's SMTP
sometimes silently blocks or rate-limits sign-ins from an unfamiliar
server IP (like a shared cloud host) even with a valid App Password. A
plain HTTPS POST to Resend's API sidesteps both problems.

Nothing else in the codebase needs to change to use this — store/emails.py
already builds standard Django EmailMultiAlternatives objects; this
backend is just a different way of actually transmitting them, selected
via EMAIL_BACKEND in settings.py.

Setup:
  1. Sign up at https://resend.com
  2. Create an API key: https://resend.com/api-keys
  3. Add RESEND_API_KEY to your environment (Render dashboard -> your
     service -> Environment tab; not a .env file, which Render doesn't
     read from your deployed filesystem).

Until you verify a sending domain in Resend's dashboard, DEFAULT_FROM_EMAIL
must be Resend's shared sandbox address (onboarding@resend.dev), and
messages can only be delivered to the email address on your own Resend
account — good enough to test this end-to-end, not yet for real customer
delivery. Verify seyontouch.in (Resend -> Domains -> Add Domain, then add
the DNS records it gives you) to send from e.g. orders@seyontouch.in to
anyone.
"""

import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        api_key = settings.RESEND_API_KEY
        if not api_key:
            if not self.fail_silently:
                raise RuntimeError(
                    "RESEND_API_KEY is not set — can't send via Resend. "
                    "Add it in Render's Environment tab, or set EMAIL_HOST_USER "
                    "instead to fall back to SMTP."
                )
            return 0

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        sent_count = 0
        for message in email_messages:
            # EmailMultiAlternatives (used by store/emails.py) carries the
            # HTML body as an "alternative" alongside the plain-text body
            # in message.body — pull it out if present.
            html_body = None
            for content, mimetype in getattr(message, "alternatives", []) or []:
                if mimetype == "text/html":
                    html_body = content
                    break

            payload = {
                "from": message.from_email,
                "to": message.to,
                "subject": message.subject,
                "text": message.body,
            }
            if html_body:
                payload["html"] = html_body
            if message.cc:
                payload["cc"] = message.cc
            if message.bcc:
                payload["bcc"] = message.bcc
            if message.reply_to:
                payload["reply_to"] = message.reply_to[0]

            try:
                response = requests.post(RESEND_API_URL, json=payload, headers=headers, timeout=10)
                response.raise_for_status()
                sent_count += 1
            except requests.RequestException as exc:
                # Log the response body too when there is one — Resend's
                # error responses (e.g. "you can only send testing emails
                # to your own email address" for unverified domains) are
                # specific and usually tell you exactly what to fix.
                response = getattr(exc, "response", None)
                detail = response.text if response is not None else str(exc)
                logger.exception("Resend API send failed for message to %s — %s", message.to, detail)
                if not self.fail_silently:
                    raise

        return sent_count