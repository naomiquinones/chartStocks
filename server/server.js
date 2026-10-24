import 'dotenv/config';
import express from 'express';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/stocks', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM stocks');
  res.json(rows);
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));