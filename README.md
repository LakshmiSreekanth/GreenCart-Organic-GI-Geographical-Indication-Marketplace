# GreenCart – Organic & GI Marketplace

> Mini-Amazon for Organic & Geographical Indication (GI) products, inspired by OQart. Built with **React JS**, **Node.js**, **Express.js**, and **SQL**.
> **Zero Vite** · **Pure Express.js REST APIs** · **Zero external microservices / No FastAPI** · **No Vue.js**

---

## 🔹 Architecture & Tech Stack

```text
React Frontend (Pure React + HTML + CSS + JS)
                      ↓ (HTTP REST APIs)
Express.js Backend (Auth, Products, Cart, Orders, Admin, Recommendations)
                      ↓ (SQL Queries & Transactions)
SQL Database (Users, Farmers, Products, Orders, Order Items, Reviews, Cart, Wishlist)
```

- **Frontend**: React 18, HTML5, CSS3, JavaScript (Served directly by Express, **no Vite build step needed**)
- **Backend**: Node.js, Express.js (20+ REST APIs, JWT authentication, bcrypt password hashing, multer file uploads)
- **Recommendations**: Built directly into **Express.js** (`/api/recommend/:productId`) using multi-factor SQL scoring (GI tag, category, region/origin, average rating)
- **Database**: SQL schema with 8 tables, Foreign Keys, CHECK constraints, and optimized indexes on name, category, GI tag, and location.

---

## 🔹 3 Roles & Features

| Role | Key Capabilities |
| --- | --- |
| **Farmer** | Register, upload organic/GI certificates, list produce with GI tags/pricing/stock/images, view incoming orders, update fulfillment status |
| **Customer** | Browse produce, multi-filter (category, GI certified, organic, price range, state), add to cart, wishlist, checkout, track orders (pending → confirmed → shipped → delivered), write reviews & ratings |
| **Admin** | Review & approve/reject farmer certificates with custom reasons, monitor platform dashboard (users, farmers, products, orders, revenue), manage products and users |

---

## 🔹 Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@greencart.in` | `Admin@123` |
| **Farmer (Approved)** | `farmer@greencart.in` | `Farmer@123` |
| **Customer** | `customer@greencart.in` | `Customer@123` |
| **Farmer (Pending)** | `pending@greencart.in` | `Farmer@123` |

---

## 🔹 Run Locally in 1 Step

Requirements: **Node.js 18+**

```bash
# 1. Install backend dependencies (one-time)
cd backend
npm install
cd ..

# 2. Start the application
npm start
```

Open your browser at:
👉 **`http://localhost:5000`**

- The Express server serves **both** the REST API and the React frontend on port `5000`.
- No Vite dev server, no port conflicts, no proxy configurations needed!

---

## 🔹 Database Schema (SQL)

Includes **8 tables** with Foreign Keys and Indexes:

1. `users` – User accounts with role-based access (`customer`, `farmer`, `admin`)
2. `farmers` – Farm details, certificate file paths, verification status (`pending`, `approved`, `rejected`), rejection reasons
3. `products` – Produce catalog with GI tag badges, organic flags, prices, stock, units, region, image URLs
4. `orders` – Customer orders with total, status tracking, and shipping addresses
5. `order_items` – Products included in each order with quantity and snapshot price
6. `reviews` – Customer reviews with 1–5 star ratings and comments
7. `cart_items` – Real-time customer cart with quantities
8. `wishlist` – Saved items for future purchase

**Indexes**:
- `idx_products_name`
- `idx_products_category`
- `idx_products_gi_tag`
- `idx_products_location`
- `idx_orders_customer`
- `idx_farmers_status`
- `idx_users_email`

---

## 🔹 REST APIs (Express.js)

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Register as Customer or Farmer
- `POST /api/auth/login` – Login & receive JWT token
- `GET /api/auth/me` – Fetch current user profile & farmer status
- `PUT /api/auth/me` – Update user profile details
- `POST /api/auth/certificate` – Upload organic/GI certificate (PDF/Image)

### Products (`/api/products`)
- `GET /api/products` – Query products with multi-filter (search, category, gi, organic, minPrice, maxPrice, location)
- `GET /api/products/meta` – Filter dropdown options (categories, GI tags, locations)
- `GET /api/products/mine` – Logged-in farmer's products
- `GET /api/products/:id` – Product detail with average rating & review count
- `POST /api/products` – Create product (Approved farmers only)
- `PUT /api/products/:id` – Edit product details
- `DELETE /api/products/:id` – Delete product

### Smart Recommendations (`/api/recommend`) – *Express.js API*
- `GET /api/recommend` – Featured/trending curated organic & GI produce
- `GET /api/recommend/:productId` – Content-based recommendation engine scoring products by GI tag, category, origin region, and star ratings

### Cart & Wishlist (`/api/cart`, `/api/wishlist`)
- `GET /api/cart` – View user's cart and calculated subtotal
- `POST /api/cart` – Add product to cart
- `PUT /api/cart/:id` – Update item quantity
- `DELETE /api/cart/:id` – Remove item from cart
- `GET /api/wishlist` – View customer wishlist
- `POST /api/wishlist` – Save product to wishlist
- `DELETE /api/wishlist/:productId` – Remove from wishlist

### Orders (`/api/orders`)
- `GET /api/orders` – View customer order history or farmer's incoming orders
- `POST /api/orders` – Place order from cart items
- `GET /api/orders/:id` – Order details & items
- `PUT /api/orders/:id/status` – Update order lifecycle (`pending` → `confirmed` → `shipped` → `delivered`)

### Farmer Management (`/api/farmers`)
- `GET /api/farmers/me` – Farmer profile and verification status
- `GET /api/farmers/dashboard` – Farmer statistics (total products, orders, total earnings, recent orders)
- `GET /api/farmers/orders` – Incoming customer orders for this farmer

### Admin Management (`/api/admin`)
- `GET /api/admin/dashboard` – Platform overview metrics & top-selling products
- `GET /api/admin/farmers` – List farmers (filter by pending/approved/rejected)
- `PUT /api/admin/farmers/:id/approve` – Approve farmer certificate
- `PUT /api/admin/farmers/:id/reject` – Reject certificate with reason
- `GET /api/admin/users` – List all registered users
- `DELETE /api/admin/users/:id` – Remove user
- `GET /api/admin/products` – List all marketplace products
- `DELETE /api/admin/products/:id` – Remove product
- `GET /api/admin/orders` – View all orders across platform

### Reviews (`/api/products/:id/reviews`)
- `GET /api/products/:id/reviews` – Fetch reviews and ratings for a product
- `POST /api/products/:id/reviews` – Submit review and 1–5 star rating

---

## 🔹 Interview One-Liner

> *"GreenCart is a mini-Amazon for organic and GI-tagged products where farmers sell upon certificate verification, customers order with order tracking, and admins verify certificates — built end-to-end with React, Node.js, Express REST APIs, and SQL."*
