import "dotenv/config";
import express from "express";
import pool from "./db.js";
import { fetchDailyPrices } from "./callmarketstack.js";
import { savePrices, isRecent, getPrices } from "./prices.js";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8080;

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/stocks", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM stocks");
  res.json(rows);
});

const inProgress = new Map();

async function refreshIfStale(symbol) {
  if (await isRecent(symbol)) return;

  if (!inProgress.has(symbol)) {
    console.log(`Fetching prices for ${symbol} from Marketstack...`);
    inProgress.set(
      symbol,
      fetchDailyPrices(symbol)
        .then((rows) => savePrices(symbol, rows))
        .finally(() => inProgress.delete(symbol)),
    );
  }
  await inProgress.get(symbol);
}

app.get("/api/stocks/:symbol/prices", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  const { rowCount } = await pool.query(
    "SELECT 1 FROM stocks WHERE symbol = $1",
    [symbol],
  );
  if (rowCount === 0) {
    return res.status(404).json({ error: `${symbol} is not on the list` });
  }

  await refreshIfStale(symbol);
  res.json(await getPrices(symbol));
});

app.post("/api/stocks", async (req, res) => {
  const symbol = String(req.body?.symbol ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    return res.status(400).json({ error: "Enter a symbol of 1 to 5 letters" });
  }

  const { rows } = await pool.query("SELECT symbol FROM stocks");
  if (rows.some((row) => row.symbol === symbol)) {
    return res.status(409).json({ error: `${symbol} is already on the list` });
  }
  if (rows.length >= 10) {
    return res.status(400).json({ error: "The list is full (10 stocks)" });
  }

  await refreshIfStale(symbol);
  const prices = await getPrices(symbol);
  if (prices.length === 0) {
    return res.status(404).json({ error: `No price data found for ${symbol}` });
  }

  await pool.query("INSERT INTO stocks (symbol) VALUES ($1)", [symbol]);
  res.status(201).json({ symbol });
});

app.delete("/api/stocks/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  await pool.query("DELETE FROM stocks WHERE symbol = $1", [symbol]);
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
