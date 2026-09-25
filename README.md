# Premium Children's Toy E-Commerce Website

A production-oriented, single-vendor children's toy e-commerce web application built with **React (Vite)**, **NestJS**, **GraphQL**, and **PostgreSQL** running in **Docker**.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- Docker Desktop (Running on Windows)
- npm (v9+)

### Installation & Startup Commands

1. **Install Root & Sub-project Dependencies**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start Docker PostgreSQL Container**:
   ```bash
   docker compose up -d
   ```

3. **Run Database Migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Seed Development Database**:
   ```bash
   npm run db:seed
   ```

5. **Start Full Stack Development Mode**:
   ```bash
   npm run dev
   ```
   * Frontend: [http://localhost:3000](http://localhost:3000)
   * GraphQL Playground: [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

## 🛡️ DEVELOPMENT CREDENTIAL REPORT (DEVELOPMENT ONLY)

> [!WARNING]
> **DEVELOPMENT CREDENTIALS ONLY**:
> The following 12 accounts are created exclusively for local development and testing. They MUST NEVER exist or be deployed in production environments!

| ROLE | ACCOUNT NAME | MOBILE (LOGIN ID) | 6-DIGIT PIN | DEV OTP | STATUS | PERMISSIONS SUMMARY |
|---|---|---|---|---|---|---|
| **Super Admin** | `superadmin1` | `9900000001` | `111111` | `123456` | Verified | Full system access, RBAC, Users, Audit Logs, Store Settings |
| **Super Admin** | `superadmin2` | `9900000002` | `111111` | `123456` | Verified | Full system access, RBAC, Users, Audit Logs, Store Settings |
| **Super Admin** | `superadmin3` | `9900000003` | `111111` | `123456` | Verified | Full system access, RBAC, Users, Audit Logs, Store Settings |
| **Admin** | `admin1` | `9900000004` | `222222` | `123456` | Verified | Products, Inventory, Orders, Coupons, Promotions, Banners |
| **Admin** | `admin2` | `9900000005` | `222222` | `123456` | Verified | Products, Inventory, Orders, Coupons, Promotions, Banners |
| **Admin** | `admin3` | `9900000006` | `222222` | `123456` | Verified | Products, Inventory, Orders, Coupons, Promotions, Banners |
| **Staff** | `staff1` | `9900000007` | `333333` | `123456` | Verified | Order fulfillment, Status updates, Stock view & adjustment |
| **Staff** | `staff2` | `9900000008` | `333333` | `123456` | Verified | Order fulfillment, Status updates, Stock view & adjustment |
| **Staff** | `staff3` | `9900000009` | `333333` | `123456` | Verified | Order fulfillment, Status updates, Stock view & adjustment |
| **Customer** | `customer1` | `9900000010` | `444444` | `123456` | Verified | Browse, Cart, Checkout, My Orders, Reviews, Wishlist |
| **Customer** | `customer2` | `9900000011` | `444444` | `123456` | Verified | Browse, Cart, Checkout, My Orders, Reviews, Wishlist |
| **Customer** | `customer3` | `9900000012` | `444444` | `123456` | Verified | Browse, Cart, Checkout, My Orders, Reviews, Wishlist |

---

## 🔑 Authentication Flow

This application uses a secure **Mobile Number + 6-digit PIN** authentication model:

1. **Registration**:
   `Mobile Number` ➔ `OTP Verification (Dev OTP: 123456)` ➔ `Set 6-Digit PIN` ➔ `Account Created`
2. **Normal Login**:
   `Mobile Number` ➔ `6-Digit PIN` ➔ `JWT Authenticated Session`
3. **Forgot PIN**:
   `Mobile Number` ➔ `OTP Verification (Dev OTP: 123456)` ➔ `Set New 6-Digit PIN`

> [!NOTE]
> PINs are stored exclusively as one-way **bcrypt** hashes in PostgreSQL and are never exposed via GraphQL endpoints.

---

## 🧱 Project Architecture & Folder Structure

```text
Toy Store/
├── backend/                  # NestJS GraphQL API & Database Layer
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (20+ entities)
│   │   ├── seed.ts           # Development seed script
│   │   └── reset.ts          # Database reset with safety guard
│   ├── src/
│   │   ├── modules/          # Auth, Products, Categories, Cart, Orders, Admin, etc.
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── frontend/                 # React Single Page Application (Vite)
│   ├── src/
│   │   ├── components/       # Layout, Navbar, CartDrawer, AuthModal
│   │   ├── pages/            # HomePage, ProductsPage, ProductDetailPage, CheckoutPage, AccountPage, AdminPage
│   │   ├── store/            # Zustand state management
│   │   ├── theme/            # Material UI design system
│   │   ├── graphql/          # GraphQL documents
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml        # PostgreSQL 16 container definition
├── .env                      # Local environment configuration (ignored by Git)
├── .env.example              # Environment variables template
└── package.json              # Root script runner
```

---

## 🛡️ Database Safety Guard

Running `npm run db:reset` executes a strict verification check:
It verifies that `DATABASE_URL` strictly contains `toy_store_dev` and `NODE_ENV` is not `production` before wiping tables. This guarantees that destructive development scripts can **never** accidentally execute against production databases.
