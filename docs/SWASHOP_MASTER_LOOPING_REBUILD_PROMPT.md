# SWASHOP MASTER LOOPING REBUILD PROMPT & ARCHITECTURAL BLUEPRINT
## Local Market Discovery & Shop Digitization SaaS Engine

> **Canonical Definition:**  
> **SwaShop is a local market discovery and shop digitization SaaS that gives physical shops, artisans, MSMEs, and micro-entrepreneurs a digital shop identity and helps customers discover the products they need, connect with the right shop, and reach it for physical inspection and offline purchase.**  
>  
> *Core Philosophy:* **Product is the discovery entry point. Shop is the primary identity. AI is the embedded listing assistant. Physical commerce is the destination.**

---

## 1. NON-NEGOTIABLE PRODUCT IDENTITY & ANTI-PATTERNS

### What SwaShop IS:
- A **Hyperlocal Discovery & Digitization SaaS** connecting customers with offline shops and makers.
- A **Digital Identity for Physical Shops**: Giving artisans and local retailers a professional online storefront with address, hours, catalog, and QR code.
- A **Physical Linkage Platform**: The journey ends when the customer arrives at the shop counter, inspects the product in person, and buys offline.
- An **Embedded AI Assistant**: Helping shopkeepers create high-converting catalog listings with photo enhancement directly inside the product creation form.

### What SwaShop is NOT (STRICT ANTI-PATTERNS):
- ❌ **NOT an Amazon / Flipkart / Meesho E-commerce Marketplace**: No cart-first UI, no checkout dominance, no shipping/courier fleets, no warehouse ERP.
- ❌ **NO Standalone AI Studio / AI Dashboard**: AI is never a destination; it is an embedded utility button `[ ✨ AI ENHANCE PRODUCT ]` inside the standard listing form.
- ❌ **NO AI Image Fabrication**: The enhanced product image must remain faithful to real-world physical reality. AI must never invent materials, certifications, or features that will disappoint the customer during offline physical inspection.
- ❌ **NO Fake Maps or Faked Distances**: Routing must calculate real distance and open truthful turn-by-turn GPS navigation using actual shop coordinates.

---

## 2. THE CANONICAL USER FLOWS

### A. Customer Discovery to Physical Purchase Flow
```text
CUSTOMER VISITS SWASHOP
         ↓
"What are you looking for?" (Searches product, e.g. "bamboo basket", "terracotta vase")
         ↓
DATABASE PRODUCT SEARCH (Keyword, category, tags, attributes, nearby radius)
         ↓
SEARCH RESULTS (Displays product photo, price, availability + PROMINENT SHOP NAME, CITY & DISTANCE)
         ↓
CUSTOMER SELECTS PRODUCT (Views details, specifications, real stock status)
         ↓
PROMINENT SHOP IDENTITY CARD (Shopkeeper name, verified badge, address, business hours)
         ↓
INTERACTIVE ROUTE MAP & TRACK (Shows customer GPS location → route track → shop coordinates)
         ↓
CHAT / CONTACT SHOP ("Is this available right now?", "What are your hours today?")
         ↓
GET TURN-BY-TURN DIRECTIONS (Launches Google Maps navigation directly to shop coords)
         ↓
PHYSICAL SHOP VISIT → TOUCH & INSPECT QUALITY → OFFLINE PURCHASE
```

### B. Seller Digitization & Embedded AI Listing Flow
```text
SELLER REGISTERS / LOGS IN
         ↓
CREATES DIGITAL SHOP (Business name, category, seller type, address, GPS pin, hours, phone)
         ↓
CLICKS "+ ADD NEW PRODUCT" (Opens standard product creation form)
         ↓
CAPTURES PHOTO WITH CAMERA OR UPLOADS EXISTING IMAGE
         ↓
ENTERS ROUGH PRODUCT NAME & ROUGH DETAILS
         ↓
CLICKS [ ✨ AI ENHANCE PRODUCT ]
         ↓
BACKEND AI PIPELINE (POST /api/ai/product/enhance)
├── Analyzes image & text context
├── Generates professional English title & description
├── Generates authentic Hindi title & description
├── Suggests category, tags, and structured attributes
└── Enhances image lighting, sharpness & presentation (Zero hallucination)
         ↓
AI ENHANCE REVIEW MODAL
├── Seller inspects Original Photo vs. Enhanced Photo
├── Seller reviews English & Hindi content
├── Seller can Edit, Regenerate, or Accept
         ↓
SELLER ACCEPTS & REVIEWS FINAL FORM
         ↓
PUBLISHES PRODUCT TO SHOP CATALOG
         ↓
STOREFRONT & PRODUCT ARE INSTANTLY DISCOVERABLE LOCALLY
```

---

## 3. FULL ARCHITECTURAL AUDIT & SPECIFICATIONS

### Layer 1: Authentication & Roles
- **Single Unified Authentication System**: Exactly one `User` collection.
- **Roles**:
  - `CUSTOMER`: Browses products, saves favorites, sends enquiries/chats, views route maps.
  - `SELLER`: Business account. **Inherently retains all Customer discovery capabilities** (can browse other shops, save items, and inquire without switching accounts). Manages their own Shop, Products, and Inquiries.
  - `ADMIN`: Platform administration, seller verifications, moderation, and AI telemetry. Created securely via backend seed/env—no public admin registration.

### Layer 2: Shop Entity (First-Class Business Entity)
- Every product must strictly belong to a Shop (`SellerProfile` referencing `userId`).
- Shop attributes:
  - `businessName`, `description`, `sellerType` (`ARTISAN`, `LOCAL_SHOP`, `MSME`, `MICRO_ENTREPRENEUR`).
  - `address`, `city`, `state`, `pincode`.
  - `location`: GeoJSON `Point` (`coordinates: [longitude, latitude]`) with 2dsphere index.
  - `phone`, `businessHours`, `verificationStatus` (`PENDING`, `APPROVED`, `VERIFIED`).
  - `logo`, `coverImage`, `storeQrCode`.

### Layer 3: Product Entity
- Belongs to a Shop: `sellerId` pointing to `SellerProfile`.
- Fields:
  - `name`, `description`.
  - `languageVariants`: `{ hi: { name, description }, en: { name, description } }`.
  - `categoryId`, `price`, `discountPrice`.
  - `stockStatus`: `AVAILABLE`, `LOW_STOCK`, `OUT_OF_STOCK`.
  - `images`: Array of stored URLs (original & enhanced).
  - `tags`, `attributes` (`material`, `dimensions`, etc.).
  - `b2b`: `{ enabled, minOrderQuantity, bulkPrice, leadTimeDays }`.
  - `aiMetadata`: Stores generation logs without overwriting seller's canonical approved edits.

### Layer 4: Search & Discovery Engine
- Product-first search querying MongoDB via compound text match + category + availability filters.
- Location-aware sorting: Computes distance in kilometers between customer's coordinates (`lat`, `lng`) and shop's coordinates.
- Card presentation: Product cards display the product photo, price, availability badge, **and the Shop Name, Seller Type, City, and Distance (km)**.

### Layer 5: Route Tracking & Navigation (`ShopRouteMap`)
- Embedded route visualization showing:
  - Origin: Customer's device location.
  - Destination: Shop's physical address and GPS coordinates.
  - Driving and walking distance and ETA.
  - Action 1: **"Start Turn-by-Turn GPS"** (direct URL: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).
  - Action 2: **"Chat Before Visiting"** (launches direct enquiry modal).

### Layer 6: Embedded AI Service
- Centralized behind backend: `POST /api/ai/product/enhance`.
- Provider adapter with timeout (4000ms) that gracefully falls back to deterministic local intelligence engine if external AI APIs are unreachable.
- Outputs structured JSON conforming strictly to the catalog schema.
- Frontend review modal allows seller to edit, regenerate, or cancel. Never silently auto-publishes.

---

## 4. FOUR-PHASE REBUILD ROADMAP

```text
┌────────────────────────────────────────────────────────┐
│ PHASE 1: DIGITAL SHOP & LOCAL DISCOVERY FOUNDATION     │
│ Shop creation, product CRUD, location, search,         │
│ truthful routing, customer enquiries, physical visit.  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ PHASE 2: EMBEDDED AI LISTING ASSISTANT                 │
│ Camera capture, rough text input, AI Enhance button,   │
│ multilingual (EN/HI), image enhancement, review modal. │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ PHASE 3: INTELLIGENT LOCAL LINKAGE                     │
│ Geo-radius filtering, stock availability signals,       │
│ verified maker badges, B2B wholesale enquiries.        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ PHASE 4: LOCAL COMMERCE SCALE LAYER                    │
│ QR storefronts, mobile PWA optimization, merchant      │
│ analytics, audit trails, and multi-region deployment.   │
└────────────────────────────────────────────────────────┘
```

---

## 5. THE 14-STEP AUTONOMOUS DEVELOPMENT LOOP

Whenever modifying or evolving SwaShop, follow this mandatory looping cycle:

```text
 1. INSPECT       → Examine active files, routes, components, and models.
 2. AUDIT         → Check against SwaShop's non-negotiable local discovery identity.
 3. DETECT        → Flag any e-commerce drift (cart, checkout, fake maps, standalone AI studio).
 4. REMOVE/ISOLATE→ Eliminate or de-emphasize conflicting patterns.
 5. PLAN          → Define minimal, robust, backward-compatible edits.
 6. IMPLEMENT     → Write clean, structured code adhering to project architecture.
 7. BUILD CLIENT  → Run `npm run build --workspace=client` (Must compile with 0 errors).
 8. RUN TESTS     → Run `npm test --workspace=server` (All test suites must pass).
 9. LOG DIAGNOSIS → If any test fails, inspect logs, identify root cause, and fix.
10. EDGE CASES    → Test AI timeout fallbacks, missing GPS coordinates, and role guards.
11. VERIFY FLOWS  → Confirm Customer Flow, Seller Flow, and Seller-as-Customer Flow.
12. UI AUDIT      → Ensure shop identity, location, and route map are prominent.
13. COMMIT/SYNC   → Stage and record changes with clean git history.
14. LOOP/ADVANCE  → Move to next feature only after previous phase is 100% stable.
```

---

## 6. END-TO-END VERIFICATION CRITERIA

Before marking any phase or task complete, ensure the following pass:

1. **Product Search**:
   - Customer searches "bamboo basket" on Home or Explore.
   - Products are returned from MongoDB.
   - Each card visibly displays Shop Name, Seller Type, City, and Distance.

2. **Physical Shop Navigation**:
   - Customer opens product details.
   - Prominent Shop Identity Card displays verified badge, address, and hours.
   - `ShopRouteMap` renders route from customer's location to shop coordinates.
   - Clicking "Start Turn-by-Turn GPS" opens real Google Maps directions.

3. **Customer-to-Shop Chat**:
   - Customer clicks "Contact / Chat with Shop".
   - Enquiry modal offers quick chips ("In stock right now?", "Store hours today?").
   - Message is saved to `/api/enquiries` and visible in seller & customer dashboards.

4. **Embedded AI Listing**:
   - Seller opens `/seller/products/new`.
   - Seller captures/uploads photo and enters rough title & description.
   - Seller clicks `[ ✨ AI ENHANCE PRODUCT ]`.
   - `AiEnhanceReviewModal` displays preview of enhanced image, English, and Hindi content.
   - Seller edits/accepts -> Form fills -> Seller clicks Publish -> Saved to DB.
   - If AI provider times out, local craft intelligence seamlessly completes the request.

5. **Security & Role Boundaries**:
   - Customer cannot access `/api/products` POST/PUT/DELETE (403 Forbidden).
   - Seller A cannot edit Seller B's products (403 Forbidden).
   - Regular users cannot access `/api/admin/*` (403 Forbidden).
