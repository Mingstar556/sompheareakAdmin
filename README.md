# 👑 Somphea Reak Admin Desk (`sompheareakAdmin`)

Dedicated, decoupled store owner management dashboard for **Somphea Reak Studio (សម្ភារៈ)**.

This repository is isolated from the customer storefront repository (`sompeareak`), ensuring that store administration controls, security PINs, and inventory management are maintained in a secure, dedicated environment.

---

## 🌐 Architecture & Synchronization

- **Unified Backend API**: Connects to the centralized Python server (`server.py`) running on `http://127.0.0.1:5000` (or production endpoint).
- **Shared SQLite Database**: Communicates directly with the single source of truth database (`sompheareak.db`), guaranteeing zero data drift between customer purchases and admin oversight.
- **Role-Based Authentication**: Requires the Admin Security PIN (`X-Admin-PIN` / Bearer token) enforced by backend middleware.
- **Real-Time Live Sync**: Polling and zero-delay `BroadcastChannel` maintain synchronized state across all browser tabs.

---

## 🚀 Quick Start

### 1. Ensure the Unified Backend Server is Running
In the main backend project directory (`sompeareak website`):
```bash
python server.py
# Running on http://127.0.0.1:5000
```

### 2. Launch the Admin Portal
In this directory (`sompheareakAdmin`):
```bash
python serve.py
# Running on http://127.0.0.1:5500
```
Open **http://127.0.0.1:5500** in your web browser.

### 3. Log In
Enter your Admin Security PIN to access:
- **📊 Live Dashboard**: Real-time sales metrics, revenue, and pending order counts.
- **🧾 Orders Desk**: One-click order approval, rejection with notes, cancellation, and dispatch tracking.
- **🛍️ Products & Catalog**: Add/edit items, adjust real-time stock levels, update pricing.
- **🔗 Custom Italian Charm Studio**: Manage charm links, stock numbers, finishes, and models.
- **👥 Loyalty & Customers**: Manage customer accounts, award loyalty points, view vouchers.
- **⚙️ Store Settings**: Update exchange rates, delivery fees, brand info, and store announcements.

---

## ⚙️ Configuration (`config.js`)

If the backend server is deployed on a remote host or different port, configure it via `config.js` or in browser console:
```javascript
window.SR_CONFIG.setApiBase('https://api.yourdomain.com');
```

---

## 🛡️ Security

- All admin mutations (`POST /api/products`, `DELETE /api/categories`, `POST /api/orders/:id/approve`, etc.) require valid administrative credentials.
- Backend rate limiting prevents brute-force attempts.
