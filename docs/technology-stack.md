# Hourlane Watches — Technology Stack

**Status:** Approved for Version 1

## Purpose

This document explains the technical stack selected for Hourlane Watches. It is separate from the Version 1 product specification: the product specification defines **what** will be built, while this document defines the principal technologies used to build and operate it.

The stack favors:

- one language across frontend and backend;
- explicit, understandable architecture for a frontend engineer learning full-stack development;
- production-minded defaults without premature microservices or extra infrastructure; and
- provider-neutral application boundaries, so external services can be replaced without rewriting core business rules.

## System Overview

```text
Guest customer / admin browser
            |
            v
React + Vite web application (Vercel)
            |
            v
Node.js + Fastify API (Railway)
            |
     +------+--------------------+------------------+
     |                           |                  |
     v                           v                  v
Clerk                       Neon PostgreSQL    External adapters
(admin identity)                ^              - Paystack
                                |              - Cloudflare R2
                         Drizzle ORM           - Resend
```

Drizzle is a library running inside the API. It is not a separate hosted service and does not sit between the API and Neon over the network.

## Core Development Platform

| Technology | Responsibility | Why it is selected |
| --- | --- | --- |
| TypeScript | Main programming language | Gives frontend and backend a shared language, catches many mistakes before runtime, and works well with React, Fastify, Drizzle, and Zod. |
| Node.js | Backend runtime | Mature JavaScript/TypeScript runtime with broad ecosystem support. |
| pnpm workspaces | Monorepo package management | Keeps web, API, and shared packages in one repository with simple workspace linking. |
| GitHub | Source control and collaboration | Stores code, supports branches and pull requests, and triggers automated checks and deployments. |
| GitHub Actions | Continuous integration | Runs formatting, type checks, tests, and builds for changes before they are merged. |

## Frontend

### React + Vite + TypeScript

The web application is a React single-page application built with Vite and TypeScript.

Its responsibilities are:

- render the public All Watches catalog and product pages;
- collect guest checkout information;
- call the API over HTTPS;
- redirect customers to the hosted payment page;
- render payment-return and secure single-order-status pages; and
- render the admin application after Clerk authentication.

The frontend must not contain payment secrets, database credentials, business-rule calculations, trusted product prices, or authorization decisions.

### Vercel

Vercel hosts and deploys the frontend.

- Pull requests can receive preview deployments.
- The production frontend deploys from the `main` branch.
- Version 1 uses the Vercel-generated `*.vercel.app` domain.
- Public frontend configuration, such as the API base URL and Clerk publishable key, is set through Vercel environment variables.

Only variables intentionally safe for the browser may be exposed by Vite. Secrets stay in the API or provider dashboards.

## Backend

### Node.js + Fastify + TypeScript

The backend is one Node.js TypeScript application using Fastify. It is a **modular monolith**: one deployable API with internally separated modules rather than a group of networked microservices.

Fastify is selected because it is lightweight, explicit, TypeScript-friendly, and teaches the important backend parts visibly: routes, middleware, validation, request handling, response handling, plugins, and errors.

The API owns:

- public product and checkout endpoints;
- server-side price and delivery-fee calculation;
- stock reservation and order creation;
- payment-provider webhook verification;
- admin-only operations;
- order status and refund workflows;
- provider adapters;
- database access; and
- background job processing.

### REST + OpenAPI

The API uses RESTful HTTP endpoints and publishes an OpenAPI contract.

OpenAPI documents endpoint paths, request shapes, response shapes, authentication requirements, and error responses. It prevents the React application and API from silently disagreeing about their contract.

### Zod

Zod validates untrusted input at runtime.

Examples include checkout contact details, city-zone selection, product creation/update fields, stock adjustments, and order-status changes. TypeScript types help developers while coding; Zod validates data actually received from browsers, webhooks, and other outside systems.

### Railway

Railway hosts the API and background-worker process.

- Railway runs the Node.js service using environment variables configured in the Railway dashboard.
- The API is exposed through a Railway-generated `*.up.railway.app` URL in Version 1.
- Railway logs help diagnose deployment and runtime failures.
- The API connects from Railway to Neon, Clerk, Paystack, Cloudflare R2, and Resend over HTTPS or secure database connections.

The frontend may call only the public API URL. The database and provider secrets are never available to the browser.

## Database

### PostgreSQL on Neon

PostgreSQL is the relational database that preserves application data such as products, stock, delivery zones, orders, payments, refunds, customer contact data, and notification jobs.

Neon is the hosted PostgreSQL provider. It supplies database infrastructure, secure connection strings, branching/development tools, and connection pooling.

The application should use a pooled Neon connection string for normal API traffic. Database credentials are API secrets stored only in Railway/local environment configuration.

### Drizzle ORM

Drizzle is the TypeScript database toolkit running inside the API.

It provides:

- TypeScript database schemas;
- typed queries;
- explicit SQL migrations;
- relations and database access helpers; and
- a visible link between application models and PostgreSQL tables.

The relationship is:

```text
Backend module
    -> repository/data-access code
    -> Drizzle ORM
    -> PostgreSQL database
    -> Neon hosting infrastructure
```

Drizzle does not replace PostgreSQL. PostgreSQL enforces durable data rules such as foreign keys, unique values, checks, transactions, and indexes.

## Authentication and Authorization

### Clerk

Clerk supplies Google OAuth sign-in and session handling for the single Version 1 administrator.

- The admin signs in through Clerk in the frontend.
- The frontend sends the Clerk session token to protected API endpoints.
- The backend verifies the token and matches the identity to the application `admins` record.
- The API then authorizes the request as admin-only.

Clerk owns identity and sign-in sessions. PostgreSQL owns the application’s administrator record, product data, orders, and all business permissions.

Guest customers do not need Clerk or an account to buy a watch.

### Provider boundary

Core application code should depend on an `IdentityProvider` abstraction. The Clerk implementation belongs in infrastructure code, preventing business modules from being tied to Clerk-specific APIs.

## Payments

### Paystack

Paystack is the first payment processor for NGN checkout.

The API:

1. calculates the final total in kobo;
2. creates a pending order and stock reservation;
3. initializes a Paystack transaction from the server;
4. redirects the customer to the hosted Paystack payment page; and
5. verifies a signed webhook before marking the order paid.

The browser return URL is useful for customer experience, but it is not proof that money was received.

### Provider boundary

The application defines a `PaymentGateway` interface with operations such as:

```text
createCheckout(order)
verifyWebhook(request)
requestRefund(payment)
```

The Paystack adapter maps these application operations to Paystack requests, response formats, event names, and credentials. Orders and fulfilment code must use only the application interface.

## Media Storage

### Cloudflare R2

Cloudflare R2 stores original product images. PostgreSQL stores image metadata and object keys, not file bytes.

The recommended upload flow is:

```text
Admin selects product image
    -> API verifies administrator and upload intent
    -> API creates short-lived upload authorization
    -> browser uploads directly to R2
    -> API stores image key and metadata in PostgreSQL
    -> frontend renders the delivered image URL
```

Direct upload avoids proxying large media files through the API. R2 credentials remain on the server.

### Provider boundary

The `ObjectStorage` interface manages upload authorization, stored-object metadata, and deletion. Cloudflare R2 is its first adapter. Product modules work with image references, not R2 client calls.

## Transactional Email and Background Work

### Resend

Resend sends order-related transactional email through an `EmailSender` adapter.

Examples include payment confirmation, processing, out-for-delivery, delivered, cancellation, and refund updates.

During development, Resend’s test sender can be used only with the account owner/test addresses. Before real customer sales, the store needs a verified custom email domain and a sender such as `orders@your-domain`.

### PostgreSQL-backed outbox/job worker

The API writes notification work to an `outbox_messages` table in the same database transaction as important order changes. A worker process reads pending jobs, sends email, records the result, and retries safely if sending fails.

This gives reliable email behavior without introducing Redis or a separate queue provider in Version 1.

### Provider boundaries

```text
Notifications module -> EmailSender -> Resend adapter
Notifications module -> job/outbox port -> PostgreSQL-backed worker
```

## Monitoring and Logging

Fastify structured logs and Railway runtime logs are the first operational log sources. Logs should include a request ID and relevant safe identifiers such as order IDs, but not complete addresses, payment secrets, or access tokens.

Version 1 does not use Sentry or another paid error-tracking service. The API exposes a health-check endpoint so Railway deployment and availability can be checked simply.

## Testing

| Tool | Purpose |
| --- | --- |
| Vitest | Unit tests for calculations, validation, business rules, and API tests. |
| Playwright | Browser-level tests for critical flows such as browsing, checkout initiation, payment return, and protected admin access. |
| GitHub Actions | Executes format checks, type checks, tests, and builds on changes. |

Payment, database, storage, and email integrations should use provider test modes or test doubles in automated tests. Production provider credentials must never be used in tests.

## Environment Variables and Secrets

Environment variables configure deployments. They do not belong in Git.

Typical backend-only variables:

```text
DATABASE_URL
CLERK_SECRET_KEY
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
RESEND_API_KEY
WEB_APP_URL
```

Typical public frontend variables:

```text
VITE_API_BASE_URL
VITE_CLERK_PUBLISHABLE_KEY
```

Public variables are embedded in the frontend build and must never contain secrets.

## Deployment Strategy

| Environment | Purpose |
| --- | --- |
| Local | Daily development with local environment variables and provider test modes. |
| Pull request preview | Review frontend/API changes before merge where provider support is available. |
| Production | Deploys from the protected `main` branch using production secrets and provider live modes. |

Version 1 does not require a separate staging environment. Database migrations must be reviewed, committed with the related feature, applied intentionally during deployment, and verified after deployment.

## What Provider-Agnostic Means

Provider agnosticism is not an attempt to make all providers interchangeable without work. It means:

- business rules use application concepts such as payment, email, object storage, and identity;
- provider request/response formats and secrets stay in adapters;
- external provider IDs are stored as integration references, not treated as the source of business truth; and
- replacing a provider changes its adapter and configuration, not the core orders, products, delivery, or fulfilment rules.

The project will not build multiple active adapters in Version 1. It will build clear interfaces and one well-tested adapter for each necessary capability.

## Out of Scope for the Initial Stack

- microservices;
- Redis and a separate managed queue;
- Kubernetes;
- a dedicated cache layer;
- a search engine;
- a CMS;
- a separate staging environment;
- multi-region deployment; and
- a custom domain for the web/API URLs.

These can be introduced only when a real product requirement or measured operational need justifies them.
