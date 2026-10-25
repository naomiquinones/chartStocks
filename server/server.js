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

const inProgress = new Map();
app.get('/api/stocks/:symbol/prices', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  const { rowCount } = await pool.query('SELECT 1 FROM stocks WHERE symbol = $1', [symbol]);
  if (rowCount === 0) {
    return res.status(404).json({ error: `${symbol} is not on the list` });
  }
  if (!(await isRecent(symbol))) {
    if (!inProgress.has(symbol)) {
      console.log(`Fetching prices for ${symbol} from Marketstack...`);
      inProgress.set(symbol, fetchDailyPrices(symbol)
        .then((rows) => savePrices(symbol, rows))
        .finally(() => inProgress.delete(symbol)));
    }
    await inProgress.get(symbol);
  }

  const prices = await getPrices(symbol);
  res.json(prices);
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));