const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export interface DeliveryZone {
  id: string;
  cityName: string;
  cityCode: string;
  feeKobo: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  priceKobo: number;
  condition: string;
  stockQuantity: number;
  deliveryEstimate: string;
  images: string[];
  movementType?: string;
  strapMaterial?: string;
  caseSizeMm?: number;
  caseMaterial?: string;
  waterResistance?: string;
  warranty?: string;
  includedInBox?: string;
  description?: string;
  createdAt: string;
}

export interface CheckoutPayload {
  productId: string;
  deliveryZoneId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  streetAddress: string;
  areaLocality: string;
  landmark?: string;
  deliveryNotes?: string;
  termsAccepted: true;
}

export interface OrderStatusDetails {
  orderNumber: string;
  status: string;
  productName: string;
  brand: string;
  sku: string;
  unitPriceKobo: number;
  deliveryCity: string;
  deliveryFeeKobo: number;
  totalKobo: number;
  streetAddress: string;
  areaLocality: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

// 1. Delivery Zones
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const res = await fetch(`${API_BASE}/api/v1/delivery-zones`);
  if (!res.ok) throw new Error("Failed to load delivery zones");
  const data = await res.json();
  return data.zones;
}

// 2. Catalog
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/v1/products`);
  if (!res.ok) throw new Error("Failed to load watches");
  const data = await res.json();
  return data.products;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/v1/products/${id}`);
  if (!res.ok) throw new Error("Watch not found");
  const data = await res.json();
  return data.product;
}

// 3. Checkout
export async function createCheckout(payload: CheckoutPayload): Promise<{
  orderId: string;
  orderNumber: string;
  totalKobo: number;
  secureStatusToken: string;
  checkoutUrl: string;
}> {
  const res = await fetch(`${API_BASE}/api/v1/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to process checkout");
  }
  return data;
}

// 4. Order Status
export async function getOrderStatus(token: string): Promise<OrderStatusDetails> {
  const res = await fetch(`${API_BASE}/api/v1/orders/status/${token}`);
  if (!res.ok) throw new Error("Order not found or link has expired");
  const data = await res.json();
  return data.order;
}

// Currency Formatter Helper (converts integer kobo to NGN display: 85000000 -> ₦850,000)
export function formatKobo(kobo: number): string {
  const naira = Math.floor(kobo / 100);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

// 5. Admin API Helpers
export async function getAdminOverview(token: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || "Unauthorized");
  return res.json();
}

export async function getAdminOrders(
  token: string,
  params: { search?: string; status?: string; cityCode?: string; limit?: number; offset?: number } = {}
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.cityCode) query.set("cityCode", params.cityCode);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const res = await fetch(`${API_BASE}/api/v1/admin/orders?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load orders");
  return res.json();
}

export async function getAdminOrder(token: string, orderId: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || "Order not found");
  return res.json();
}

export async function updateAdminOrderStatus(
  token: string,
  orderId: string,
  toStatus: string,
  reason?: string
) {
  const res = await fetch(`${API_BASE}/api/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toStatus, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update order status");
  return data;
}

export async function updateAdminOrderAddress(
  token: string,
  orderId: string,
  address: {
    streetAddress: string;
    areaLocality: string;
    landmark?: string;
    deliveryNotes?: string;
    reason: string;
  }
) {
  const res = await fetch(`${API_BASE}/api/v1/admin/orders/${orderId}/address`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(address),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update address");
  return data;
}

export async function processAdminRefund(
  token: string,
  orderId: string,
  reason: string
) {
  const res = await fetch(`${API_BASE}/api/v1/admin/orders/${orderId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason, approve: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to process refund");
  return data;
}

export async function adjustAdminProductStock(
  token: string,
  productId: string,
  quantityDelta: number,
  reason: string
) {
  const res = await fetch(
    `${API_BASE}/api/v1/admin/products/${productId}/adjust-stock`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantityDelta, reason }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to adjust stock");
  return data;
}

export async function toggleAdminProductPublish(
  token: string,
  productId: string,
  isPublished: boolean
) {
  const res = await fetch(
    `${API_BASE}/api/v1/admin/products/${productId}/publish`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isPublished }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle product status");
  return data;
}

export async function getAdminDeliveryZones(token: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/delivery-zones`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load zones");
  return res.json();
}

export async function updateAdminDeliveryZone(
  token: string,
  zoneId: string,
  data: { feeKobo?: number; isActive?: boolean }
) {
  const res = await fetch(`${API_BASE}/api/v1/admin/delivery-zones/${zoneId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update zone");
  return json;
}

export async function getAdminOutbox(token: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/outbox`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load outbox");
  return res.json();
}
