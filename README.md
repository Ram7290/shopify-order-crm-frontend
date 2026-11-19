# shopify-order-crm-frontend

React single-page app for the Mini Order Management CRM. It talks only to the backend API. Shopify credentials never reach the browser.

- **Stack:** React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 4, shadcn/ui (Button, Card, Input, Label, Select, Table, Badge)
- **Pages:** login, orders list (server-side search, filters, sorting, pagination), order details, create order, and a Shopify connection and sync panel

Filters, sort order and page number are stored in the URL, so a filtered view can be shared or refreshed.

## Local setup

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL if the backend isn't on localhost:3000
npm run dev              # http://localhost:5173 (Vite picks the next free port if this one is busy)
```

Log in with the admin account configured in the backend (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).

Make sure the backend's `FRONTEND_URL` matches the address shown by Vite, otherwise the post-install redirect and CORS will fail.

## Environment variables

| Name | Description |
| --- | --- |
| `VITE_API_BASE_URL` | API base path. Keep the default `/api`. Vercel forwards `/api/*` to the backend (see `vercel.json`), and the dev server proxies it to `localhost:3000` |

The login token is kept in an HTTP-only cookie, so the browser code never reads it. Variables starting with `VITE_` are embedded in the built JavaScript, so never put secrets in them.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build |

## Deployment (Vercel)

1. Import this repository in Vercel. The framework preset is **Vite**.
2. Do not set `VITE_API_BASE_URL` on Vercel (or set it to `/api`). `vercel.json` forwards `/api/*` to the Render backend, so the login cookie belongs to the Vercel domain.
3. Deploy. The rewrites also send all other routes to `index.html`, so refreshing deep links such as `/orders/123` works.
4. Copy the Vercel URL into the backend's `FRONTEND_URL` on Render.
