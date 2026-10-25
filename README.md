# Chart the Stock Market

A full-stack app that charts recent daily closing prices for a shared list of stocks. Anyone can add or remove a stock, and every open browser updates in real time.

Built for freeCodeCamp's [Chart the Stock Market](https://www.freecodecamp.org/learn/coding-interview-prep/take-home-projects/chart-the-stock-market) project.

**Live demo:** _add your Render URL here_

## Features

- View a line chart of the last ~100 trading days for each stock on the list
- Add stocks by ticker symbol
- Remove stocks
- See other users' changes instantly, using WebSockets

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React, Vite, Recharts |
| Backend | Node.js, Express 5, `ws` |
| Database | PostgreSQL on Neon, `pg` |
| Stock data | Marketstack API (end-of-day prices) |
| Hosting | Render (one web service) |

## How it works

```
Browser (React)              Express server                  Outside services
───────────────              ──────────────                  ────────────────
chart, add/remove   ─HTTP─▶  /api/stocks             ─SQL──▶  Neon Postgres
                             /api/stocks/:symbol/prices
                    ◀─WS───  "changed" broadcast     ─HTTP─▶  Marketstack
                                                              (only when cache is stale)
```

- **The database is the source of truth.** The shared list lives in the `stocks` table.
- **HTTP does the work.** Adding, removing, and loading prices are normal API requests.
- **WebSockets only announce.** After an add or remove, the server sends `changed` to every connected browser, and each one re-fetches the list. Browsers reconnect automatically if the connection drops.
- **Prices are cached.** The server fetches from Marketstack only when a stock hasn't been checked in 7 days, and simultaneous requests for the same stock share one fetch.

### Protecting the API quota

Marketstack's free plan allows 100 requests per month, so the server:

- Validates symbols (1–5 letters) before calling Marketstack
- Serves prices only for stocks on the list
- Caps the list at 10 stocks
- Limits itself to 10 Marketstack calls per day and 75 per month, tracked in the database

## Run it locally

**You'll need:** Node.js 22.12 or newer, a free [Neon](https://neon.com) database, and a free [Marketstack](https://marketstack.com) API key.

1. **Install dependencies:**
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```
2. **Create the tables:** in Neon's SQL Editor, run the contents of `server/schema.sql`.
3. **Add environment variables:** copy `server/.env.example` to `server/.env` and fill in your values:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=verify-full
   MARKETSTACK_API_KEY=your-marketstack-key
   ```
4. **Start both servers:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173. Vite serves the React app and proxies `/api` and `/ws` to Express on port 8080.

## Scripts

Run from the project root:

| Command | What it does |
|---|---|
| `npm run dev` | Starts Vite (5173) and Express (8080) together |
| `npm run build` | Installs server and client dependencies, then builds React into `client/dist` |
| `npm start` | Starts Express, which serves the built app, the API, and the WebSocket on one port |

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/stocks` | The shared list of symbols |
| `POST` | `/api/stocks` | Add a symbol. Body: `{ "symbol": "TSLA" }` |
| `DELETE` | `/api/stocks/:symbol` | Remove a symbol |
| `GET` | `/api/stocks/:symbol/prices` | Daily closing prices for a listed symbol |
| WebSocket | `/ws` | Receives `changed` whenever the list changes |

## Deploying to Render

Create a **Web Service** from this repo with:

- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment variables:** `DATABASE_URL` and `MARKETSTACK_API_KEY`

Render sets `PORT` automatically.

## Data source

Stock data provided by [Marketstack](https://marketstack.com).