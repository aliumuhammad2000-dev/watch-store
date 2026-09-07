# Hourlane Watches — Version 1 Specification

**Status:** Approved

## 1. Purpose

Version 1 is a deliberately simple, production-minded e-commerce store for a **single watch merchant in Nigeria**. It supports browsing watches, buying one in-stock watch at a time, paying in Nigerian naira, choosing a supported delivery city, and receiving email order updates.

This document is the source of truth for Version 1 scope. New functionality belongs outside Version 1 unless this document is intentionally updated first.

> **Working brand name:** Hourlane Watches. This is a temporary name and must be checked for trademark and domain availability before a public launch.

## 2. Product Decisions

### Customers

- Customers can use **guest checkout**; creating an account is not required.
- Customers provide their name, email address, Nigerian phone number, and delivery address.
- Customers do not have an account dashboard, order history area, cart, or self-service cancellation flow.
- A customer can see one order through a secure, unguessable link sent by email.

### Catalog

- There is one public **All Watches** catalog.
- Watches are brand-new products only.
- A watch is a simple product with one stock quantity. There are no product variants.
- A customer buys one watch per order using a **Buy now** flow.
- Products are displayed newest published first.
- Sold-out watches remain visible and show a **Sold out** state.
- Categories, search, filters, reviews, wishlists, sale prices, discount codes, and promotions are excluded.

### Required product information

Every product page displays:

- brand and model name;
- price in naira;
- condition;
- movement type;
- strap/material;
- case size;
- case material;
- water resistance;
- warranty information;
- included-in-the-box information;
- product description;
- one to four product images;
- the universal delivery estimate: **Delivery within 2–5 business days**; and
- stock availability.

### Delivery

- Delivery is personally arranged by the merchant.
- A delivery zone covers one whole city and has one fixed delivery fee.
- Version 1 starts with two editable zones:
  - Lagos: **₦3,500**
  - Abuja: **₦6,000**
- The admin can create, edit, activate, or deactivate zones and fees.
- Customers can only check out to an active delivery zone.
- The backend calculates the delivery fee from the selected zone. The browser never supplies a trusted fee.
- Every product page shows the same universal delivery estimate; it does not vary by city in Version 1.
- Checkout requires full name, email, phone number, delivery city, street address, and area/locality. Landmark and delivery notes are optional.
- Delivery slots, delivery dates, free delivery, courier integration, live courier tracking, and sub-city zones are excluded.

## 3. Checkout, Payments, and Orders

### Payment model

- Currency is **NGN**. All stored and transmitted monetary amounts use integer **kobo**, never JavaScript decimal values.
- The first payment provider is **Paystack**, accessed only through an internal payment-provider interface.
- The frontend redirects customers to Paystack-hosted checkout.
- Version 1 enables card and bank-transfer payment methods.
- A product subtotal plus the selected city delivery fee becomes one final payment.
- The backend initializes payment using a unique internal order reference.
- A customer returning from the payment page is not proof of payment. The backend marks an order paid only after it verifies the provider webhook.
- Product prices are final product prices. Do not add a separate VAT calculation or display until an accountant confirms the correct policy.

### Stock and payment safety

1. A customer chooses Buy now and submits checkout details.
2. The backend loads the active product, verifies its stock, looks up the active delivery zone, and calculates the complete total.
3. The backend creates a short-lived 15-minute stock reservation and a pending-payment order.
4. The customer is redirected to Paystack checkout.
5. A verified successful webhook marks the payment paid, commits the order, and consumes the reservation.
6. Failed or abandoned payments release the reservation after 15 minutes.

This prevents the frontend from changing prices and reduces overselling risk.

### Order lifecycle

```text
Pending payment
  -> Paid
  -> Processing
  -> Out for delivery
  -> Delivered

Exceptions: Payment failed, Cancelled, Refund processing, Refunded, Refund failed
```

- Unpaid orders expire automatically after 15 minutes.
- Paid, cancelled, refunded, and delivered orders are retained permanently; they are never deleted.
- Each order stores immutable snapshots of product name, SKU, unit price, delivery-zone name/code, delivery fee, final total, customer contact details, and shipping address. Future product, zone, and price changes cannot rewrite old orders.

### Cancellations and refunds

- Customers request cancellation or refund through store support email or phone/WhatsApp.
- The one admin approves or rejects requests.
- Refunds are requested through the payment-provider adapter and become final only after a verified provider event/result.
- The store absorbs fees for approved refunds.
- An address may be edited by the admin before the order is out for delivery. The system records the edit and its reason.
- Recommended policy wording for future review: cancellation requests are considered before dispatch; approved refunds return to the original payment method.

## 4. Customer Communication

The notification system sends transactional email for:

- payment confirmed;
- processing;
- out for delivery;
- delivered;
- cancelled;
- refund processing;
- refunded; and
- refund failed.

Email delivery happens asynchronously through a database-backed outbox/job worker. Updating an order must not wait for email delivery, and failed sends can be retried safely.

Each order email includes a secure order-status link. The link remains valid until the admin revokes it and reveals only the corresponding order.

Marketing emails, SMS, WhatsApp notifications, newsletters, PDF receipts, and downloadable invoices are not included in Version 1. The confirmation email is the customer receipt.

## 5. Admin Application

There is one administrator in Version 1. The administrator signs in with Google through Clerk.

The backend verifies the Clerk identity and matches it to one `admins` database record. Admin authorization must not be implemented by scattering a hardcoded email address throughout the application.

The admin application provides:

- **Overview:** paid orders, revenue, pending fulfilment, out-of-stock products, and recent orders;
- **Products:** create, edit, publish/unpublish, image management, and stock adjustment with a required reason;
- **Delivery Zones:** create, edit, activate/deactivate city zones and fees;
- **Orders:** view, search/filter by order number, email, phone, status, city, and date; update fulfilment status; and edit a pre-dispatch address;
- **Refunds:** approve/reject a refund request, initiate provider refund, and see final status; and
- **Settings:** store-level operational settings appropriate to Version 1.

CSV export, multiple admins, staff roles, and detailed inventory thresholds are excluded.

## 6. Public Pages

- All Watches / home page
- Product detail
- Checkout
- Payment result
- Secure single-order status page
- Contact
- Privacy Policy
- Terms and Conditions
- Delivery Policy
- Returns and Refund Policy

The home page is the All Watches catalog; Version 1 does not include a separate marketing landing page.

Checkout requires acceptance of the Terms and Privacy Policy. Legal pages may use clearly marked placeholders during development, but reviewed business/legal wording is required before real public sales.

## 7. Data Model Direction

Initial database concepts:

```text
admins
products
product_images
delivery_zones
customers
orders
payments
refunds
stock_reservations
inventory_adjustments
order_status_events
outbox_messages
```

Important rules:

- `products.stock_quantity` is an integer and must never become negative.
- Monetary values use integer kobo, with `currency = NGN` stored on payment/order records.
- Orders preserve snapshots rather than relying on mutable product or delivery-zone records.
- External IDs, such as a Paystack transaction or refund reference, live in provider-facing infrastructure records/fields.
- Customer delivery data is private and is returned only to an authorized admin or to the matching secure-order-link holder.

## 8. Architecture and Provider Boundaries

Version 1 is a **modular monolith**: one backend application, internally divided into clear modules, not microservices.

Suggested initial modules:

```text
admin
catalog
delivery
orders
payments
fulfilment
notifications
media
identity
shared infrastructure
```

External providers are isolated behind application-owned interfaces:

```text
Orders / payments domain -> PaymentGateway -> Paystack adapter
Notifications domain     -> EmailSender    -> Resend adapter
Media domain             -> ObjectStorage  -> Cloudflare R2 adapter
Identity/admin auth      -> IdentityProvider -> Clerk adapter
Database repositories    -> Drizzle ORM    -> Neon PostgreSQL
```

Business modules must not contain Paystack, Clerk, R2, Resend, Vercel, Railway, or Neon-specific request formats. Provider-specific code belongs in its adapter/infrastructure layer.

## 9. Approved Technology Stack

| Area | Approved Version 1 choice |
| --- | --- |
| Repository structure | pnpm workspace monorepo |
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, TypeScript, Fastify |
| API | REST with OpenAPI documentation |
| Validation | Zod |
| Database | Neon PostgreSQL |
| Database access and migrations | Drizzle ORM |
| Admin authentication | Clerk with Google OAuth |
| Payments | Paystack, via `PaymentGateway` adapter |
| Media storage | Cloudflare R2, via `ObjectStorage` adapter |
| Transactional email | Resend, via `EmailSender` adapter |
| Async jobs | PostgreSQL-backed outbox/job worker; no Redis in Version 1 |
| Frontend hosting | Vercel |
| API hosting | Railway |
| Error tracking | Sentry |
| Unit/API testing | Vitest |
| Critical browser-flow testing | Playwright |
| Continuous integration | GitHub Actions: format, type-check, test, build |

### Environments and domains

- Development uses local services and provider test/sandbox modes.
- The web application uses the Vercel-generated `*.vercel.app` URL.
- The API uses a Railway-generated `*.up.railway.app` URL.
- Pull requests use preview deployments where available; `main` deploys production.
- No dedicated staging environment is required for Version 1.
- Provider secrets live in provider environment-variable configuration, never in Git, frontend bundles, or browser code.

### Email launch requirement

The default Resend sender is appropriate only for development tests to the account owner. Before taking real customer orders, obtain and verify a custom email domain and use an address such as `orders@your-domain`. This is required for reliable order email delivery and does not require changing the Vercel or Railway application URLs.

## 10. Explicit Version 1 Exclusions

- customer accounts and dashboards;
- carts and multi-item orders;
- product variants;
- categories, filters, and search;
- reviews and wishlists;
- discounts, coupons, promotions, and free delivery;
- SMS, WhatsApp, and marketing email;
- multiple admins and staff permissions;
- courier APIs, real-time tracking, delivery slots, and sub-city zones;
- international delivery, currencies, payments, subscriptions, marketplaces, seller payouts, and commissions;
- product video;
- CSV export, PDF invoices, and advanced analytics; and
- a separate staging environment or Redis.

## 11. Recommended Build Sequence

1. Create the monorepo structure, developer tooling, documentation layout, and CI checks.
2. Create the database package, Neon connection, Drizzle setup, migration process, and first schema.
3. Build the Fastify API foundation: configuration, validation, errors, logging, health check, and OpenAPI.
4. Add Clerk-backed single-admin access control.
5. Build products, product images, stock adjustment, and delivery-zone admin features.
6. Build the public catalog and product detail pages.
7. Build Buy now checkout, server-side pricing, stock reservations, and Paystack payment/webhook integration.
8. Build the order admin workflow and secure customer order-status link.
9. Add asynchronous email notifications and refund flow.
10. Add tests, error tracking, deployment configuration, and end-to-end verification before real payments.

Every step follows the project learning loop:

```text
Understand -> Design -> Document -> Build -> Test -> Review -> Repeat
```
