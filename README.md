# Seyon Touch — Django + React

This is your store converted to a real backend: **Django + Django REST
Framework** for products, orders, and admin auth, with a real database
(SQLite by default), plus your existing **React (Vite)** storefront and
admin UI, unchanged in look and feel.

```
seyon-django/
  backend/    Django project (API + database)
  frontend/   Your existing React app (now talks to the API instead of
              localStorage)
```

## What changed from the original

- **Storage**: `window.storage` / `localStorage` → a real Django + SQLite
  database via a REST API. Every visitor now sees the same catalog and the
  same orders, from any device — not just their own browser.
- **Admin login**: no more shared password baked into the page. Admins are
  real Django staff user accounts, and logging in is two steps: enter your
  **username**, get a 6-digit **one-time code by email**, enter the code.
  The code expires in 5 minutes and can only be used once. All admin
  actions (add/edit/delete product, reset catalog, view orders) require the
  signed 24‑hour token you get back after verifying the code.
- **Admin has its own URL**: `/admin`, separate from the storefront at `/`.
  There's no lock icon anywhere on the public site — only someone who
  already knows to go to `/admin` sees a login prompt.
- **Stock**: decremented atomically on the server when an order is placed
  (with row locking), instead of being computed client-side.
- **Payments**: **Razorpay Checkout** — set your Razorpay API keys and
  checkout opens Razorpay's payment modal (UPI, cards, netbanking,
  wallets). Payments are verified automatically server-side, so orders go
  straight to "paid" with no manual step. See "Setting up Razorpay
  payments" below.

Everything else — the storefront, cart, checkout screens, admin panel UI,
product form, image compression on upload — is the same React code as
before.

## Creating admin accounts

There's no self-signup — admins are created on the server, the same way
you'd create any Django staff user:

```bash
cd backend
python manage.py createsuperuser
# prompts for username, email, and password
```

Two things matter for OTP login to work for that account:
- **`is_staff` must be true** (`createsuperuser` sets this automatically;
  for an existing user, flip it via `/django-admin/` → Users, or the shell).
- **The account needs a real email address** — that's where the login code
  is sent. The account's password is still required by Django itself but
  is no longer used anywhere in the login flow.

To promote an existing user to admin instead of creating a new one:

```bash
cd backend
python manage.py shell -c "
from django.contrib.auth import get_user_model
u = get_user_model().objects.get(username='someuser')
u.is_staff = True
u.email = 'someuser@example.com'
u.save()
"
```

## Configuring email (for OTP codes)

By default (no email env vars set), OTP codes are printed to the **Django
console** instead of actually being emailed — handy for local dev, but
**you must configure real SMTP before deploying**, or admins will never
receive their codes. Add these to your `.env` (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `DJANGO_EMAIL_HOST` | SMTP server, e.g. `smtp.gmail.com` |
| `DJANGO_EMAIL_PORT` | Usually `587` |
| `DJANGO_EMAIL_HOST_USER` | SMTP username / from-address |
| `DJANGO_EMAIL_HOST_PASSWORD` | SMTP password / app password |
| `DJANGO_EMAIL_USE_TLS` | `1` (default) or `0` |
| `DJANGO_DEFAULT_FROM_EMAIL` | Display name + address, e.g. `Seyon Touch <no-reply@yourdomain.com>` |

For Gmail specifically, you'll need an **App Password** (Google Account →
Security → 2-Step Verification → App passwords), not your regular password.

## Setting up Razorpay payments

Checkout uses [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/) to accept UPI, cards, netbanking, and wallets, with payments verified automatically — no manual "mark as paid" step.

1. Create a Razorpay account and grab your API keys from **Settings → API
   Keys** in the [Razorpay Dashboard](https://dashboard.razorpay.com/) (use
   the **Test Mode** keys while developing).
2. Add them to `backend/.env` (copy `backend/.env.example` if you haven't
   already):
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_key_secret
   ```
3. Restart Django. `.env` is loaded automatically on startup (via
   `python-dotenv`) — no manual `export` step needed, whether you run
   `python manage.py runserver`, gunicorn, or start it from an IDE.

That's it. At checkout, clicking **"Pay"** creates the order (stock is
decremented immediately, status "pending") and opens Razorpay's payment
modal. The order total is always computed server-side from the current
catalog prices — the browser never gets to dictate what an order costs,
and Razorpay charges exactly that amount.

**Confirming payment:** happens automatically. Once the customer completes
payment, the frontend sends Razorpay's signed response to
`/api/checkout/razorpay-verify/`, which re-checks the signature against
your `RAZORPAY_KEY_SECRET` server-side before marking the order **"paid."**
A signature that doesn't check out (tampering, or someone replaying an old
response) never flips the order to paid. If a customer closes the payment
modal without paying, the order stays "pending" — you can still mark it
paid manually from the admin panel if you confirm the payment out of band.

If `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` aren't set, checkout shows a
"payment isn't set up yet" message instead of a broken payment screen — so
set them before going live. Once you're ready for real payments, swap in
your **Live Mode** keys (`rzp_live_...`) from the same dashboard page.

## Run it locally (two dev servers)

**1. Backend**

```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python manage.py migrate         # creates db.sqlite3 and seeds the demo catalog
python manage.py createsuperuser # creates your first admin account
python manage.py runserver       # http://127.0.0.1:8000
```

(A pre-seeded `db.sqlite3` is already included, so `migrate` is only
needed if you delete it or start fresh — but you'll still need to run
`createsuperuser` once to have an admin account to log in with, since none
ships in the repo.)

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Open `http://localhost:5173` for the storefront, or
`http://localhost:5173/admin` to log in as admin. Vite proxies `/api`
requests to Django, so there's no CORS setup needed. With no email
configured, watch the Django server's terminal output for your OTP code.

## Deploy it as one app (recommended)

In production, Django serves the built React app directly — one process,
one deployment, no CORS.

```bash
cd frontend
npm run build            # produces frontend/dist/

cd ../backend
cp .env.example .env     # then edit .env with real values
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver 0.0.0.0:8000   # or gunicorn config.wsgi:application
```

Visiting the server's URL now serves `index.html` + the built JS bundle,
and `/api/...` serves the same backend. Put this behind a real WSGI/ASGI
server (gunicorn/uvicorn) and a reverse proxy (nginx/Caddy) for production,
and set these environment variables (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Long random string — required, keep it secret |
| `DJANGO_DEBUG` | `0` in production |
| `DJANGO_ALLOWED_HOSTS` | Your domain(s), comma-separated |
| `DJANGO_EMAIL_HOST` / `_PORT` / `_HOST_USER` / `_HOST_PASSWORD` / `_USE_TLS` | Real SMTP config — see "Configuring email" above |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Your Razorpay API keys — see "Setting up Razorpay payments" above |

### Database

SQLite works fine for a small store. For anything more serious, swap the
`DATABASES` block in `backend/config/settings.py` for Postgres (e.g. via
`dj-database-url` + a `DATABASE_URL` env var), then re-run `migrate`.

### Hosting options

- A single VM/VPS: gunicorn + nginx, straightforward.
- Render / Railway / Fly.io: point them at `backend/`, they build the
  React app as part of your deploy script, then run gunicorn.
- Split hosting (frontend on Vercel/Netlify, backend elsewhere): possible,
  but you'll need to add `django-cors-headers` and point the frontend's
  `API_BASE` (in `src/api.js`) at the backend's full URL instead of the
  relative `/api`.

## API reference

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/products/` | GET | none | List catalog |
| `/api/products/` | POST | admin token | Add product |
| `/api/products/<id>/` | GET | none | Get one product |
| `/api/products/<id>/` | PUT | admin token | Update product |
| `/api/products/<id>/` | DELETE | admin token | Delete product |
| `/api/products/reset/` | POST | admin token | Reset catalog to demo seed |
| `/api/orders/` | GET | admin token | List orders |
| `/api/orders/` | POST | none | Place an order + create the matching Razorpay order (decrements stock, status starts "pending") |
| `/api/orders/<id>/` | PATCH | admin token | Update order status (the "Mark as paid" button) |
| `/api/checkout/razorpay-config/` | GET | none | Returns `{ keyId }`, or 404 if not configured |
| `/api/checkout/razorpay-verify/` | POST | none | `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` → verifies the payment and marks the order "paid" |
| `/api/admin/request-otp/` | POST | none | `{ "username": "..." }` → emails a 6-digit code |
| `/api/admin/verify-otp/` | POST | none | `{ "username": "...", "code": "..." }` → `{ "token": "..." }` |

Admin-token endpoints expect `Authorization: Bearer <token>`.

Django's built-in admin is also available at `/django-admin/` (create a
superuser with `python manage.py createsuperuser` if you want to use it) —
it's separate from, and doesn't replace, the in-app admin panel your
storefront already has.

## Going further

Payments are handled by Razorpay Checkout, with signature verification
server-side, so confirmation is automatic. A few things you might want
next:

1. **Webhooks** — right now confirmation relies on the customer's browser
   calling `/api/checkout/razorpay-verify/` after payment. Adding a
   [Razorpay webhook](https://razorpay.com/docs/webhooks/) as a backup
   would catch the rare case where the customer closes their browser
   right after paying but before the verify call fires.
2. **Refunds** — there's no refund flow yet; you can refund from the
   [Razorpay Dashboard](https://dashboard.razorpay.com/) directly, or wire
   up their [Refunds API](https://razorpay.com/docs/payments/refunds/).
3. **Auto-expiring stale pending orders** — if a customer abandons
   checkout after the order (and its stock reservation) is created but
   before paying, that order stays "pending" indefinitely. A periodic job
   that cancels old pending orders and restocks them would tidy this up.

Happy to help wire up any of these next.
