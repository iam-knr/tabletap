# QR-based Food Court Ordering – Project Plan & Feasibility

## 1. Problem Statement

A single food court has multiple shops. Customers scan a *single* QR code at the table or entrance, land on a web app, pick one or more shops, add items from one or multiple shops into a shared cart, pay once, and receive per‑shop tokens. Tokens appear both on the customer side and in the admin/shop dashboards. Payments must be routed to individual shop accounts.

This document covers scope, architecture, tech stack, milestones, and feasibility notes.

## 2. High-Level Requirements

- Single QR per food court (optionally per table later).
- Landing screen listing all active shops with status (open/closed, prep time, veg/non‑veg tags).
- Shop menu screens with categories and items.
- Multi‑shop cart (cart grouped by shop).
- Checkout screen with:
  - Order summary grouped by shop.
  - Taxes/charges per shop or global.
  - Customer details (name, mobile, table number or pickup).
- Payment collection and routing to each shop’s bank account.
- Token generation per shop (e.g., F1‑023) visible to customer and shop.
- Admin panel for:
  - Managing shops and menus.
  - Viewing consolidated orders.
  - Basic reporting.

## 3. Architecture Overview

### 3.1 Phase‑1 Prototype (this repo)

**Goal:** Client‑facing prototype only – static front‑end with mocked data and simple token generation on the client.

- Tech: Vite + React (or plain HTML/JS), Tailwind or minimal CSS.
- Data: Local JSON for food court, shops, and menus.
- Features in scope:
  - Shop list → menu → cart → checkout → token screen, matching the attached flow.
  - Multi‑shop cart with grouping.
  - Simple client‑side token generator for each shop.
  - No real login, no DB, and no real payments.

### 3.2 Phase‑2 (MVP Backend + Payments)

Add real backend and payment integration.

- Backend: Node.js (Express/Nest) or Laravel.
- Database: Postgres/MySQL (shop, menu, order, order_item, payment tables).
- Auth: Basic admin auth (JWT/session) for food‑court owner and shops.
- Payments: Razorpay/Stripe with split or marketplace flow.
- Token service: Server‑side per‑shop counter to avoid collisions.

## 4. Data Model (MVP)

### Core Entities

- **FoodCourt**
  - id, name, location, QR slug.

- **Shop**
  - id, food_court_id, name, description, status, display_order.
  - payment_account_id (Razorpay account ID / Stripe connected account).

- **MenuItem**
  - id, shop_id, name, price, category, is_available.

- **Order**
  - id, food_court_id, customer_name, customer_phone, table_number, status, total_amount.

- **OrderItem**
  - id, order_id, shop_id, menu_item_id, quantity, unit_price, total_price, shop_token.

- **Payment**
  - id, order_id, provider, provider_reference, status, amount, meta.

## 5. Multi‑Shop Cart & Token Logic

- Cart is stored client side as:

```ts
{
  shopId: {
    shop: Shop,
    items: { [menuItemId]: { item: MenuItem, qty: number } }
  }
}
```

- On checkout request, client sends grouped payload:

```json
{
  "foodCourtId": 1,
  "customer": {"name": "Azar", "phone": "99999", "table": "T3"},
  "shops": [
    {
      "shopId": 10,
      "items": [
        {"menuItemId": 101, "qty": 2},
        {"menuItemId": 102, "qty": 1}
      ]
    }
  ]
}
```

- Backend creates Order and OrderItems.
- For each distinct shop in the order, generate a token:
  - Format: `<SHOP_SHORT_CODE>-<running_number>` (e.g., `F1-023`).
  - Store token on all OrderItems belonging to that shop for that order.

## 6. Payment Routing Strategy (India-friendly)

For the MVP, use a payment gateway that supports split settlements/marketplace or multiple accounts.

- **Option A – Razorpay Route / Sub‑Accounts**
  - Food‑court owner has main account.
  - Each shop is set up as a sub‑merchant/linked account.
  - On checkout, backend calls gateway with split rules (order amount per shop, commission to food‑court owner if needed).

- **Option B – Stripe Connect**
  - Same pattern using connected accounts and transfer groups.

**Feasibility:** Both Razorpay and Stripe support this pattern; compliance/KYC per shop is required but technically straightforward.

## 7. Admin & Shop Dashboards (Later Phases)

- Web‑based dashboards with role access:
  - Admin: manage shops, menus, pricing, commissions, and see all orders.
  - Shop: see only its orders, tokens, and statuses (new, in‑progress, ready, completed).

- Real‑time updates via polling or websockets (later phase).

## 8. Milestones & Timeline (for a solo dev)

**Milestone 1 – Frontend prototype (this week)**
- Set up repo, basic routing and layout.
- Implement static shop list page.
- Implement menu page with add‑to‑cart.
- Implement cart + checkout page.
- Generate client‑side tokens per shop and display on confirmation screen.

**Milestone 2 – Backend MVP (2–3 weeks)**
- Set up backend + DB schema.
- Implement APIs for shops, menus, and orders.
- Move token generation to backend.
- Persist orders and tokens.

**Milestone 3 – Payments & Dashboards (3–4 weeks)**
- Integrate Razorpay/Stripe with split settlements.
- Build basic admin and shop dashboards.
- Add order status updates and basic reports.

## 9. Feasibility Notes

- Technically feasible with standard web stack (React/Node/Postgres) plus a payment gateway that supports marketplace/split payouts.
- Biggest non‑technical risk is KYC/compliance for creating separate merchant accounts per shop.
- Start with a single settlement account for the food‑court (Phase‑2 alt) if marketplace onboarding is a blocker, then reconcile manually per shop.

## 10. Prototype Scope Summary

The current prototype in this repo will focus only on the **customer‑facing flow** with mocked data and client‑side logic. Real orders, tokens, authentication, and payment routing will be added in later phases.
