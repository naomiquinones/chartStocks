import 'dotenv/config';
import express from 'express';
import pool from './db.js';
import { fetchDailyPrices } from './callmarketstack.js';
import { savePrices, isRecent, getPrices } from './prices.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/stocks', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM stocks');
  res.json(rows);
});

app.get('/api/stocks/:symbol/prices', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  if (!(await isRecent(symbol))) {
    console.log(`Fetching prices for ${symbol} from Marketstack...`);

    const rows = await fetchDailyPrices(symbol);
    await savePrices(symbol, rows);
  }

  const prices = await getPrices(symbol);
  res.json(prices);
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));