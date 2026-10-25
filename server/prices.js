import pool from "./db.js";

export async function savePrices(symbol, rows) {
  for (const { date, close } of rows) {
    await pool.query(
      `INSERT INTO prices (symbol, trading_date, close)
        VALUES ($1, $2, $3)
        ON CONFLICT (symbol, trading_date) DO UPDATE SET close = EXCLUDED.close`,
      [symbol, date, close],
    );
  }

  await pool.query(
    `INSERT INTO price_cache_status (symbol, last_checked_at)
      VALUES ($1, NOW())
      ON CONFLICT (symbol) DO UPDATE SET last_checked_at = NOW()`,
    [symbol],
  );
}

export async function isRecent(symbol) {
  const { rows } = await pool.query(
    `SELECT 1 FROM price_cache_status
     WHERE symbol = $1 AND last_checked_at > NOW() - INTERVAL '7 days'`,
    [symbol]
  );
  return rows.length > 0;
}

export async function getPrices(symbol) {
  const { rows } = await pool.query(
    `SELECT trading_date::text AS date, close::float AS close
     FROM prices
     WHERE symbol = $1
     ORDER BY trading_date`,
    [symbol]
  );
  return rows;
}
