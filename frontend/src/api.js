// Talks to the Django REST API that replaced window.storage / localStorage.
// In dev, Vite proxies /api to the Django dev server (see vite.config.js).
// In production, Django serves the built frontend itself, so /api is
// always same-origin — no CORS setup needed either way.

const API_BASE = "/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorDetail(res, fallback) {
  try {
    const data = await res.json();
    return data.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function getProducts() {
  const res = await fetch(`${API_BASE}/products/`);
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't load products"));
  return res.json();
}

export async function createProduct(product, token) {
  const res = await fetch(`${API_BASE}/products/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't save product"));
  return res.json();
}

export async function updateProduct(id, product, token) {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't save product"));
  return res.json();
}

export async function deleteProduct(id, token) {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}/`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't delete product"));
}

export async function resetCatalog(token) {
  const res = await fetch(`${API_BASE}/products/reset/`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't reset catalog"));
  return res.json();
}

export async function getOrders(token) {
  const res = await fetch(`${API_BASE}/orders/`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't load orders"));
  return res.json();
}

export async function getRazorpayConfig() {
  const res = await fetch(`${API_BASE}/checkout/razorpay-config/`);
  if (!res.ok) return null; // Razorpay isn't configured — not an error, just unavailable
  return res.json(); // { keyId }
}

export async function createOrder(order) {
  const res = await fetch(`${API_BASE}/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't place order"));
  return res.json(); // includes razorpayOrderId + razorpayKeyId
}

export async function verifyRazorpayPayment({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const res = await fetch(`${API_BASE}/checkout/razorpay-verify/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't verify payment"));
  return res.json();
}

export async function markOrderPaid(id, token) {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ status: "paid" }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Couldn't update order"));
  return res.json();
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, "Invalid username or password"));
  return res.json(); // { token }
}
