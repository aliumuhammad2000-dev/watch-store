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
    maximumFractionDigits: 0,
  }).format(naira);
}
