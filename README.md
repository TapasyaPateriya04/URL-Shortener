# Snaplink

Snaplink is a full-stack URL shortener with custom aliases, optional expiry, redirect tracking, and a private dashboard for managing links. The React dashboard is deployed separately from the Express API; MongoDB stores links, while a per-link management token keeps dashboard analytics and deletion private to the browser that created the link.

## Features

- Shorten HTTP and HTTPS URLs and create memorable custom aliases.
- Set optional expiry dates; expired links return `410 Gone`.
- Track redirects and view click totals in the dashboard.
- Copy, search, filter, refresh, and delete saved links.
- Choose between Garden, After hours, Blue hour, and Rose color themes; the selection is saved in the current browser.
- Keep dashboard management tokens in the current browser's local storage; no account is required.
- Restrict browser API access with an explicit CORS allowlist and expose a database-aware health endpoint.
- Responsive layout, keyboard focus states, and reduced-motion support.

> Dashboard ownership is browser-based, not account-based. Clearing browser storage or using another browser removes access to manage those saved links. The short URLs themselves remain public until they expire or are deleted from the creating browser.

## Run locally

Requirements: Node.js 20 or later, npm, and MongoDB (local or Atlas).

1. Start MongoDB and create `backend/.env` from `backend/.env.example`.
2. Set `MONGO_URI` to your MongoDB connection string. Keep the other local defaults.
3. In one terminal:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

4. In another terminal, create `frontend/.env` from `frontend/.env.example`, then run:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

5. Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API health check is at `http://localhost:5000/api/health`.

Do not commit `.env` files. The checked-in `.env.example` files contain local development values only.

## Deploy

The included deployment configuration uses **MongoDB Atlas** for the database, **Render** for the Node API, and **Vercel** for the Vite frontend. Deploy the API first so its URL can be configured in Vercel.

### 1. Create the production database

Create a MongoDB Atlas cluster and database user. Copy the application's connection string and replace its password placeholder. Add the Render service's outbound IP addresses to Atlas Network Access; avoid opening database access to every IP unless you intentionally accept that exposure.

### 2. Deploy the API to Render

1. Create a new Render Blueprint from this repository and apply the included [`render.yaml`](./render.yaml). It builds from `backend/`, starts with `npm start`, and checks `/api/health`.
2. Set the Blueprint's three prompted environment values:
   - `MONGO_URI`: the Atlas connection string.
   - `BASE_URL`: the public Render service origin, for example `https://snaplink-api.onrender.com` (no trailing slash). This is the origin embedded in every short URL.
   - `FRONTEND_URLS`: the exact Vercel origin, for example `https://your-project.vercel.app`. Add additional trusted frontend origins as a comma-separated list.
3. Wait for the service to become healthy. Confirm `https://YOUR-API-HOST/api/health` returns `{"status":"ok","database":"connected"}`.

The API listens on Render's assigned `PORT`. For local operation, copy [`backend/.env.example`](./backend/.env.example) to `backend/.env` and replace `MONGO_URI`.

### 3. Deploy the frontend to Vercel

1. Import this repository as a Vercel project and leave the project root at the repository root. The root [`vercel.json`](./vercel.json) installs and builds `frontend/`, publishes `frontend/dist`, and routes frontend paths to the SPA.
2. Add the Vercel environment variable `VITE_API_URL` with the API origin, for example `https://snaplink-api.onrender.com` (no trailing slash).
3. Deploy or redeploy. Add any custom frontend domain to the Render `FRONTEND_URLS` value and redeploy the API.

For local Vite development, `VITE_API_URL` defaults to `http://localhost:5000`. For a custom short-link domain, point that domain to the API service and set Render's `BASE_URL` to that origin.

### 4. Verify the production app

1. Open the Vercel site and confirm the status indicator reports the API is online.
2. Shorten a URL, copy/open it, and confirm it redirects.
3. Refresh the dashboard and confirm the click count increases.
4. Try a duplicate custom alias, an invalid URL, and an expired link to verify the error and expiry behavior.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `MONGO_URI` | API | MongoDB connection string. Required to start the API. |
| `BASE_URL` | API | Public origin used to generate shareable short links. |
| `FRONTEND_URLS` | API | Comma-separated browser origins allowed by CORS. |
| `PORT` | API | Optional local port; the hosting platform supplies this in production. |
| `VITE_API_URL` | Frontend | API origin. Defaults to `http://localhost:5000` for local development. |

## Checks

```sh
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```
