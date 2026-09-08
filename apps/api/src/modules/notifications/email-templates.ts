function formatNaira(kobo: number): string {
  const naira = Math.floor(kobo / 100);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

export interface OrderConfirmedEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  totalKobo: number;
  secureStatusToken: string;
  webAppUrl: string;
}

export interface OrderStatusUpdatedEmailData {
  orderNumber: string;
  customerName: string;
  status: string;
  productName: string;
  secureStatusToken: string;
  webAppUrl: string;
}

export function renderOrderConfirmedEmail(data: OrderConfirmedEmailData) {
  const trackingUrl = `${data.webAppUrl}/order-status/${data.secureStatusToken}`;
  const subject = `Order Confirmed: #${data.orderNumber} — Hourlane Watches`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
          .card { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px 32px; }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 24px; margin-bottom: 28px; }
          .brand { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin: 0; }
          .tagline { font-size: 11px; letter-spacing: 3px; color: #fbbf24; text-transform: uppercase; margin-top: 4px; }
          .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          .message { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .receipt { background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin-bottom: 28px; }
          .receipt-row { display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
          .receipt-row:last-child { border-bottom: none; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #fbbf24; padding-top: 12px; border-top: 1px solid #334155; margin-top: 6px; }
          .button-container { text-align: center; margin: 32px 0 24px; }
          .btn { background-color: #f59e0b; color: #020617; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; display: inline-block; }
          .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 32px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="brand">HOURLANE</h1>
            <p class="tagline">Curated Luxury Timepieces • Nigeria</p>
          </div>

          <h2 class="greeting">Payment Received, ${data.customerName}!</h2>
          <p class="message">
            Your payment has been verified via Paystack and your timepiece is being prepared for secure delivery. Hand-delivery within <strong>2–5 business days</strong> across Lagos and Abuja.
          </p>

          <div class="receipt">
            <div class="receipt-row">
              <span>Order Number</span>
              <strong style="color: #ffffff; font-family: monospace;">#${data.orderNumber}</strong>
            </div>
            <div class="receipt-row">
              <span>Watch</span>
              <span style="color: #ffffff;">${data.productName}</span>
            </div>
            <div class="receipt-row">
              <span>Quantity</span>
              <span>1</span>
            </div>
            <div class="total-row">
              <span>Total Paid</span>
              <span>${formatNaira(data.totalKobo)}</span>
            </div>
          </div>

          <div class="button-container">
            <a href="${trackingUrl}" class="btn">View Live Order Tracking</a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Bookmark your order tracking link: <br/>
            <a href="${trackingUrl}" style="color: #fbbf24; word-break: break-all;">${trackingUrl}</a>
          </p>

          <div class="footer">
            Hourlane Watches • Nigeria<br/>
            Questions? Reply directly to this email or write to support@hourlane.com.
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
HOURLANE WATCHES — Order Confirmed #${data.orderNumber}

Hello ${data.customerName},

Thank you for your purchase! Your payment of ${formatNaira(data.totalKobo)} has been confirmed for:
${data.productName} (Qty: 1)

Delivery Estimate: Within 2–5 business days.

Track your order status and view your full receipt at:
${trackingUrl}

Best regards,
Hourlane Watches Support
  `.trim();

  return { subject, html, text };
}

export function renderOrderStatusUpdatedEmail(data: OrderStatusUpdatedEmailData) {
  const trackingUrl = `${data.webAppUrl}/order-status/${data.secureStatusToken}`;
  const friendlyStatus = data.status.replaceAll("_", " ").toUpperCase();
  const subject = `Order Update: #${data.orderNumber} is now ${friendlyStatus}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
          .card { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px 32px; }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 24px; margin-bottom: 28px; }
          .brand { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin: 0; }
          .tagline { font-size: 11px; letter-spacing: 3px; color: #fbbf24; text-transform: uppercase; margin-top: 4px; }
          .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          .message { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .status-badge { display: inline-block; background-color: #f59e0b; color: #020617; font-weight: 800; font-size: 12px; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; margin: 12px 0 20px; }
          .button-container { text-align: center; margin: 28px 0 20px; }
          .btn { background-color: #f59e0b; color: #020617; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; display: inline-block; }
          .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 32px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="brand">HOURLANE</h1>
            <p class="tagline">Curated Luxury Timepieces • Nigeria</p>
          </div>

          <h2 class="greeting">Hello ${data.customerName},</h2>
          <p class="message">
            Your order for <strong>${data.productName}</strong> has been updated:
          </p>

          <div style="text-align: center;">
            <span class="status-badge">${friendlyStatus}</span>
          </div>

          <div class="button-container">
            <a href="${trackingUrl}" class="btn">View Live Status Tracker</a>
          </div>

          <div class="footer">
            Hourlane Watches • Nigeria<br/>
            Order #${data.orderNumber}
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
HOURLANE WATCHES — Order Status Update

Hello ${data.customerName},

Your order #${data.orderNumber} (${data.productName}) has been updated to:
${friendlyStatus}

Track your order in real-time:
${trackingUrl}

Hourlane Watches Support
  `.trim();

  return { subject, html, text };
}
