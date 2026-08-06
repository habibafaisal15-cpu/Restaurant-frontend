# Your Kitchen Admin

A full-featured restaurant admin dashboard for **Your Kitchen** — manage online and in-restaurant orders, POS walk-ins, menu, delivery riders, receipts/slips, and sales reports from a single copper-themed control panel.

Built for Pakistani restaurants with **PKR** currency formatting, multi-channel order flows (online delivery, dine-in, takeaway), and mock data for local development without a backend.

---

## Features

### Order Channels
- **Online** — delivery orders with rider assignment workflow
- **In-Restaurant** — dine-in and takeaway via POS
- **Walk-in POS** — quick counter ordering with token numbers

### Core Modules
| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs, sales chart, top items/categories, recent orders |
| **Orders** | Filter, status updates, rider assignment, channel badges |
| **POS** | Walk-in order placement with cart, tax, and service charge |
| **Categories** | Menu organization, hero rotation, sort order |
| **Menu Items** | Pricing, discounts, availability, tags |
| **Hero / Home** | Homepage slide and side-card content |
| **Riders** | Fleet management, status (available/busy/offline), enable/disable |
| **Slips / Receipts** | Preview and print kitchen slips & customer receipts |
| **Reports** | Daily/weekly/monthly analytics, filters, CSV export |
| **Settings** | Restaurant profile, tax, slips, open/closed, announcements |

### UI & UX
- Dark/light theme toggle (TopBar)
- Responsive layout with collapsible sidebar
- Toast notifications, modals, confirm dialogs
- Loading skeletons and empty states
- Copper & black design system

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Build | Vite 8 |
| Routing | React Router DOM 7 |
| HTTP | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Toasts | react-hot-toast |
| PDF/Print | jsPDF, html2canvas |
| Lint | Oxlint |

---

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build for Production

```bash
npm run build
npm run preview
```

---

## Demo Credentials

| Field | Value |
|-------|-------|
| Email | `admin@yourkitchen.com` |
| Password | `admin123` |

Mock authentication is used when the API is unavailable or mock mode is enabled.

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_USE_MOCK` | `true` | Use in-memory mock data instead of API |

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK=true
```

When `VITE_USE_MOCK=true`, all services fall back to mock data in `src/mock/data.js`. When `false`, the app calls the real API and falls back to mocks only on network failure.

---

## Folder Structure

```
src/
├── api/
│   └── client.js          # Axios instance, auth interceptor, withFallback
├── components/
│   ├── auth/              # ProtectedRoute
│   ├── charts/            # SalesChart
│   ├── layout/            # AppLayout, Sidebar, TopBar
│   ├── pos/               # POS item grid
│   ├── slips/             # Slip preview & print
│   └── ui/                # DataTable, Modal, StatCard, badges, etc.
├── context/
│   ├── AuthContext.jsx
│   ├── SettingsContext.jsx
│   └── ThemeContext.jsx
├── mock/
│   └── data.js            # Seed data for offline development
├── pages/
│   ├── Dashboard.jsx
│   ├── Orders.jsx
│   ├── POS.jsx
│   ├── Categories.jsx
│   ├── MenuItems.jsx
│   ├── Hero.jsx
│   ├── Riders.jsx
│   ├── Slips.jsx
│   ├── Reports.jsx
│   ├── Settings.jsx
│   └── Login.jsx
├── services/              # API + mock service layer
├── styles/                # Global CSS, variables
└── utils/                 # formatPKR, storage helpers
```

---

## API Contract Summary

Suggested REST endpoints for backend integration. All authenticated routes expect `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/logout` | — | `{ success }` |
| GET | `/auth/me` | — | `User` |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List orders (filters: status, channel, date) |
| GET | `/orders/:id` | Single order |
| POST | `/orders` | Create order |
| PATCH | `/orders/:id/status` | Update status |
| PATCH | `/orders/:id/assign-rider` | Assign rider |
| GET | `/orders/pending-online` | Poll pending online orders |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/categories` | CRUD categories |
| PUT/DELETE | `/categories/:id` | Update / deactivate |
| PATCH | `/categories/reorder` | `{ ids: [] }` |
| GET/POST | `/menu-items` | CRUD menu items |
| PUT/DELETE | `/menu-items/:id` | Update / deactivate |

### Riders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riders` | List riders (`?active`, `?status`, `?search`) |
| POST | `/riders` | Create rider |
| PUT | `/riders/:id` | Update rider |
| PATCH | `/riders/:id/toggle-active` | Enable/disable |

### Sales / Reports
| Method | Endpoint | Query Params |
|--------|----------|--------------|
| GET | `/sales/summary` | `range`, `channel`, `from`, `to`, `subtype`, `paymentMethod` |
| GET | `/sales/by-day` | same |
| GET | `/sales/by-item` | same |
| GET | `/sales/by-category` | same |

**Summary response shape:**
```json
{
  "range": "weekly",
  "from": "2026-01-26T...",
  "to": "2026-02-02T...",
  "totalRevenue": 542800,
  "totalOrders": 268,
  "averageOrderValue": 2025,
  "cancelledOrders": 11,
  "channels": {
    "ONLINE": { "revenue": 318400, "orders": 156, "percentage": 58.7 },
    "IN_RESTAURANT": { "revenue": 224400, "orders": 112, "percentage": 41.3 }
  },
  "paymentMethods": { "cash": 112600, "card": 134200, "online": 296000 }
}
```

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Restaurant settings |
| PUT | `/settings` | Partial update |

### Slips
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/slips` | List generated slips |
| POST | `/slips/generate` | Generate slip for order |

### Hero
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hero` | Homepage content |
| PUT | `/hero` | Update slides / side cards |

---

## TODOs — Wiring Real Backend

- [ ] Set `VITE_USE_MOCK=false` and point `VITE_API_BASE_URL` to production API
- [ ] Implement JWT refresh / session expiry handling beyond 401 redirect
- [ ] Wire Reports date-range, subtype, and payment filters to server-side aggregation
- [ ] Add real-time order notifications (WebSocket or SSE) for pending online orders
- [ ] Connect image uploads to cloud storage (S3/Cloudinary) instead of URL strings
- [ ] Persist settings opening hours UI (data model exists in mock, no UI yet)
- [ ] Role-based route guards (cashier vs manager vs super-admin)
- [ ] Pagination on Orders, Menu Items, and Reports tables
- [ ] Export PDF reports in addition to CSV
- [ ] E2E tests for critical flows (login, POS, order status)

---

## License

Private — Your Kitchen restaurant admin panel.
