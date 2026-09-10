# SwaShop — Smart Market Linkage Platform

> **Phase 1 Production Foundation**  
> Empowering local artisans, shopkeepers, MSMEs, and micro-entrepreneurs to digitize their unique crafts, connect with nearby customers, and expand through regional reseller networks.

---

## 🌟 Overview & Purpose

**SwaShop** is a full-stack local commerce and market linkage platform built to solve the discoverability and distribution bottleneck faced by regional Indian artisans and neighborhood shopkeepers.

In traditional e-commerce, small makers are either excluded by steep margins, complicated onboarding, or disconnected from their immediate community. SwaShop bridges this gap with **Hyperlocal Discovery**, **Role-based Commerce**, and an innovative **Maker-to-Seller Reseller Engine**.

---

## 🚀 Key Architectural Pillars (Phase 1)

### 1. Strict 3-Role Architecture & Role Inheritance
SwaShop defines exactly three roles with zero role bloat:
* **`CUSTOMER`**: Can browse products, view local makers, filter by distance, save favorite items, and submit direct purchase inquiries.
* **`SELLER` (Inherits all Customer capabilities)**:
  * Manages their own digital shop, inventory, pricing, and contact details.
  * Uploads products with multiple images and categorizes items.
  * **Inherits full Customer capabilities** — can browse the marketplace, save favorites, send inquiries, and acquire other sellers' goods without switching accounts or logging into separate portals.
* **`ADMIN` (Platform Governance)**:
  * Non-public registration. Initial admin is created via CLI seed (`npm run seed:admin`).
  * Additional administrators can **only** be created by authenticated admins inside the Admin Console.
  * Oversees user moderation, approves/rejects merchant KYC, moderates listings, and manages craft categories.

### 2. "Buy & Resell" Maker Linkage System
* A local shopkeeper or micro-entrepreneur can discover an artisan maker's product (e.g., *Bamboo Basket* by *Sharma Handicrafts* at ₹500).
* With one click, they create a **`ResellerListing`**, set their own retail price (e.g., ₹699), and specify acquired stock.
* **Preserving Maker Attribution**: The system clearly tags the item as `Sold by: Aarav Gift Shop | Originally sourced from: Sharma Handicrafts`. The artisan remains the recognized creator while the retailer expands their local catalog.

### 3. Hyperlocal Discovery & Distance Calculation
* Utilizes the **Haversine formula** to calculate exact geodesic distances (in kilometers) between the shopper's selected coordinates and the seller's verified shop location.
* Distance badges (`0.3 km away`, `6.4 km away`) appear on all product and store cards.
* Includes a quick Location Switcher modal with preset regional clusters (Connaught Place, Dilli Haat, Noida Sector 18, Gurugram, Jaipur, Varanasi) as well as browser Geolocation.

### 4. Official Brand Identity & Media Handling
* Seamlessly integrates official SwaShop branding (`Logo.png`, `Website-Header.png`, `Favicon.png`).
* Image upload pipeline supporting multi-file drag-and-drop, client previews, validation, and static storage via Multer with Cloudinary compatibility.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Node.js (ES Modules), Express.js, JWT, Bcryptjs, Multer |
| **Database** | MongoDB (Mongoose ODM) with self-contained persistent WiredTiger engine (`mongodb-memory-server`) |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) |

---

## 📦 Project Structure

```
SwaShop/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── api/                # Axios client with JWT interceptors
│   │   ├── assets/             # Brand identity (logo.png, website-header.png)
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, Modal
│   │   │   ├── marketplace/    # ProductCard, SellerCard
│   │   │   ├── modals/         # LocationModal, BuyAndResellModal, EnquiryModal
│   │   │   ├── pages/
│   │   │   │   ├── admin/      # Dashboard, Users, Sellers, Products, Categories, Admins
│   │   │   │   ├── customer/   # SavedItems, SentEnquiries, Profile
│   │   │   │   ├── public/     # Home, Explore, ProductDetail, SellerDetail, Category, Login, Register
│   │   │   │   └── seller/     # Dashboard, Catalogue, AddProduct, EditProduct, Reselling, Enquiries, Settings, Onboarding
│   │   │   └── upload/         # ImageUploadDropzone
│   │   ├── context/            # AuthContext, LocationContext, ToastContext
│   │   ├── routes/             # AppRoutes, ProtectedRoute
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── server/                     # Express + Mongoose Backend
│   ├── src/
│   │   ├── config/             # Database connection & embedded engine
│   │   ├── controllers/        # 10 dedicated REST controllers
│   │   ├── middleware/         # auth (JWT), roles, upload (Multer), error handler
│   │   ├── models/             # User, SellerProfile, Product, ResellerListing, Category, Enquiry, Favourite
│   │   ├── routes/             # REST endpoints
│   │   ├── seeds/              # seedData.js, seedAdmin.js
│   │   ├── app.js
│   │   └── server.js
│   └── tests/                  # api.test.js (14 integration tests)
├── .env.example
├── README.md
└── package.json                # Root workspaces runner
```

---

## ⚡ Quickstart Guide

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```

### 2. Seed Database
Seed the database with realistic categories, artisan sellers, products, enquiries, and demo accounts:
```bash
npm run seed
```

To seed an initial Administrator account independently:
```bash
npm run seed:admin
```

### 3. Start Development Servers
Start both backend (Port 5001) and frontend (Port 3000) concurrently:
```bash
npm run dev
```

* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🔑 Demo Accounts for Evaluation

| Role | Name / Business | Email | Password |
|---|---|---|---|
| **ADMIN** | SwaShop Administrator | `admin@swashop.in` | `AdminPass@12345` |
| **SELLER A** (Retailer / Reseller) | Aarav Gift Shop | `aarav.gifts@example.com` | `Password@123` |
| **SELLER B** (Artisan Maker) | Sharma Handicrafts | `sharma.handicrafts@example.com` | `Password@123` |
| **CUSTOMER** | Priya Sharma | `customer@example.com` | `CustomerPass@123` |

> *Tip: The Login page features quick **One-Click Demo Test Login** buttons for instant role evaluation without typing.*

---

## 🧪 Automated Integration Tests

Run the full integration test suite:
```bash
npm run test --workspace=server
```

**Test Coverage (14/14 Passing):**
* Health check and database connectivity
* Public category listing and product discovery
* Hyperlocal distance sorting with coordinates
* Security: Public Admin registration is blocked (`403 Forbidden`)
* Customer registration, JWT login, and profile retrieval
* Role security: Customers cannot create products or access Admin dashboard
* Role security: Sellers cannot access Admin dashboard
* Admin authentication, telemetry dashboard, and user moderation
* Admin-only creation of secondary platform administrators
* Reseller workflow: Seller A creates a ResellerListing referencing Seller B's product
* Resource ownership: Seller A cannot modify or delete Seller B's source product
* Role inheritance: Seller accounts can save items and submit inquiries without switching accounts

---

## 📡 Key REST API Endpoints

### Authentication & Users
* `POST /api/auth/register` — Public registration (Role `CUSTOMER` or `SELLER` only)
* `POST /api/auth/login` — JWT login
* `GET /api/auth/me` — Current authenticated user profile
* `PUT /api/users/me` — Update user profile details

### Marketplace Discovery
* `GET /api/products` — Filter products by search, category, sellerType, min/max price, lat/lng distance
* `GET /api/products/:id` — Single product details with seller and category
* `GET /api/sellers` — Discover verified sellers filtered by distance and category
* `GET /api/sellers/:id` — Seller storefront with all active listings
* `GET /api/categories` — Active product categories

### Seller Portal
* `POST /api/sellers/onboarding` — Upgrade Customer to Seller profile
* `GET /api/sellers/my-shop` — Manage shop profile and business settings
* `POST /api/products` — Create product listing with uploaded images
* `PUT /api/products/:id` — Update existing product
* `DELETE /api/products/:id` — Delete product
* `POST /api/products/upload` — Multipart image file upload

### Reseller System
* `GET /api/reseller-listings` — List current seller's reseller listings
* `POST /api/reseller-listings` — Acquire product to resell with custom retail price
* `PUT /api/reseller-listings/:id` — Update reseller price or available stock
* `DELETE /api/reseller-listings/:id` — Remove reseller listing

### Customer Actions & Inquiries
* `GET /api/favourites` — Retrieve customer's saved items & shops
* `POST /api/favourites/products/:id` — Toggle product favorite
* `POST /api/enquiries` — Send direct inquiry to seller regarding product
* `GET /api/enquiries/sent` — View inquiries sent by buyer
* `GET /api/enquiries/received` — Seller inbox for customer messages
* `PATCH /api/enquiries/:id` — Seller response and status update

### Admin Console
* `GET /api/admin/dashboard` — Platform telemetry & pending applications
* `GET /api/admin/users` — Moderate users (activate/deactivate)
* `GET /api/admin/sellers` — Review seller verification status (APPROVE/REJECT/SUSPEND)
* `PATCH /api/admin/sellers/:id/verification` — Update merchant verification
* `GET /api/admin/products` — Moderate marketplace catalog
* `GET /api/admin/admins` — List system administrators
* `POST /api/admin/admins` — Create new platform administrator

---

## 📄 License & Attribution
Developed for SwaShop Phase 1. All rights reserved.
# SwaShop
# SwaShop
