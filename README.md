# Restaurant Frontend

Monorepo with customer and admin React apps (Vite).

| Folder | App | Dev port |
|--------|-----|----------|
| `customer/` | Customer ordering site | 5173 |
| `admin/` | Admin dashboard | 5174 |

## Live API (Railway)

```
https://restaurantapp-backend-production-7986.up.railway.app
```

## Vercel deploy

Create **two** Vercel projects from this repo:

| Project | Root Directory | Branch |
|---------|----------------|--------|
| Customer | `customer` | `main` |
| Admin | `admin` | `main` |

### Environment variables (both projects)

```
VITE_API_BASE_URL=https://restaurantapp-backend-production-7986.up.railway.app/api/v1
VITE_API_ORIGIN=https://restaurantapp-backend-production-7986.up.railway.app
VITE_WS_URL=https://restaurantapp-backend-production-7986.up.railway.app
```

Admin only: `VITE_USE_MOCK=false`

## Local dev

```bash
cd customer && npm install && npm run dev
cd admin && npm install && npm run dev
```
